// Orchestration pipeline: serial controller with lightweight idempotency and observable markers.
const { checkInventory } = require('../inventory/checker')
const { requestMissingMaterials } = require('../procurement/requester')
const { requestApproval } = require('../approval/router')
const { scheduleLab } = require('../calendar/scheduler')
const { notifyApproval, notifyRejection, notifyMaterialsRequest, notifyConflictTeachers } = require('../notify/email')
const { upsertRequestRow } = require('../datastore/excel_backend')
const { logEvent } = require('../datastore/audit')

// Small helper: write last_step safely
async function writeLastStep(id, step){
  try{ const admin = require('firebase-admin'); await admin.firestore().collection('lab_requests').doc(id).set({ last_step: step, updated_at: new Date().toISOString() }, { merge: true }) }catch(e){ console.warn('failed to write last_step', e && e.message) }
}

async function processLabRequest(req){
  // This is a simplified, serial version of the pipeline described in the spec.
  // It contains an idempotency guard and persistence markers used by Cloud Tasks/Replay later.
  // Short-circuit if request appears already processed beyond INTAKE.
  try{
    const admin = require('firebase-admin');
    const ref = admin.firestore().collection('lab_requests').doc(req.id);
    const snap = await ref.get();
    if(snap.exists){
      const data = snap.data() || {};
      if(data.last_step && data.last_step !== 'INTAKE'){
        // Already progressed; avoid double-processing
        await upsertRequestRow(req, `SKIP_ALREADY_${data.last_step}`);
        return req;
      }
    }
  }catch(e){ console.warn('idempotency check failed', e && e.message) }

  await upsertRequestRow(req, 'INTAKE')
  await logEvent(req.id, 'INTAKE_RECEIVED')
  await writeLastStep(req.id, 'INTAKE')

  // Inventory check
  const inv = await checkInventory(req.materials)
  if(inv && inv.material_enough){
    req.status = 'INVENTORY_OK'
    await upsertRequestRow(req, 'INVENTORY_OK')
    await writeLastStep(req.id, 'INVENTORY_OK')
  }else{
    req.status = 'INVENTORY_MISSING'
    const missing = (inv && inv.missing_items) || []
    await upsertRequestRow(req, 'INVENTORY_MISSING')
    try{ await notifyMaterialsRequest(req, missing) }catch(e){ console.warn('notifyMaterialsRequest failed', e && e.message) }
    try{ await requestMissingMaterials(req, missing) }catch(e){ console.warn('requestMissingMaterials failed', e && e.message) }
    await logEvent(req.id, 'PROCUREMENT_REQUESTED')
    await writeLastStep(req.id, 'PROCUREMENT_REQUESTED')
  }

  // Approval
  const decision = await requestApproval(req)
  if(!decision || !decision.approved){
    // If awaiting external approval, persist awaiting state and return
    if(decision && decision.reason === 'awaiting_external_approval'){
      req.status = 'AWAITING_APPROVAL'
      await upsertRequestRow(req, 'AWAITING_APPROVAL')
      await writeLastStep(req.id, 'AWAITING_APPROVAL')
      await logEvent(req.id, 'AWAITING_APPROVAL')
      return req
    }

    // Otherwise it's a rejection
    req.status = 'REJECTED'
    await upsertRequestRow(req, 'REJECTED')
    try{ await notifyRejection(req, decision && decision.reason) }catch(e){ console.warn('notifyRejection failed', e && e.message) }
    await logEvent(req.id, 'REJECTED')
    await writeLastStep(req.id, 'REJECTED')
    return req
  }

  // scheduleLab should return { booking_id, start, lab, url }
  let booking = null
  try{ booking = await scheduleLab(req) }catch(e){ console.warn('scheduleLab failed', e && e.message); throw e }
  req.status = 'SCHEDULED'
  await upsertRequestRow(req, 'SCHEDULED')
  await writeLastStep(req.id, 'SCHEDULED')
  await logEvent(req.id, 'BOOKED')

  try{ await notifyApproval(req, booking) }catch(e){ console.warn('notifyApproval failed', e && e.message) }
  try{ await notifyConflictTeachers(req, booking) }catch(e){ console.warn('notifyConflictTeachers failed', e && e.message) }
  req.status = 'NOTIFIED'
  await upsertRequestRow(req, 'NOTIFIED')

  return req
}

module.exports = { processLabRequest }

// NEXT ACTIONS / TODOs for `functions/orchestrator/pipeline.js`:
// - Extract per-step handlers to their own files and make them idempotent (accept a resume point).
// - Replace in-process orchestration with Cloud Tasks or Pub/Sub to support retries with backoff.
// - Add tracing: persist correlation id, step start/end time, and duration to Firestore audit logs.
// - Write unit tests for the pipeline happy path and for resume-after-approval behavior.
// - Add durable locking (Firestore transaction or distributed lock) for concurrent runs.
