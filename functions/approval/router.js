const { APPROVERS } = require('../config/settings')
const { send } = require('../platform/graph_email')

/**
 * requestApproval - apply simple policy rules and notify approvers.
 * Current behavior:
 * - If materials list is empty or less than 3 items, auto-approve
 * - Otherwise, send an approval notification email to configured approvers (if available)
 * TODO:
 * - Integrate with Power Automate Approvals or Teams Adaptive Cards
 * - Persist approval records and handle callbacks/webhooks
 */
async function requestApproval(req){
  try {
    const materialCount = Array.isArray(req.materials) ? req.materials.length : 0
    if (materialCount <= 3) {
      return { approved: true, approver: 'auto-policy', reason: 'small request' }
    }

    // Send notification emails to approvers (best-effort)
    const subject = `Approval required: Lab Request ${req.id} - ${req.experiment_title}`
    const html = `<p>Approval requested for <strong>${req.experiment_title}</strong> by ${req.teacher_name} (${req.teacher_email}).</p>
      <p>Materials: ${req.materials.join(', ')}</p>
      <p>Click to approve/reject in the admin console (TODO: link)</p>`

    for (const approver of (APPROVERS || [])) {
      try {
        await send(approver, subject, html)
      } catch (e) {
        console.warn('Failed to send approval email to', approver, e && e.message)
      }
    }

    // Persist a pending approval record in Firestore and return awaiting state.
    try {
      const admin = require('firebase-admin')
      const db = admin.firestore()
      const pending = { requestId: req.id, status: 'AWAITING_APPROVAL', approvers: (APPROVERS||[]), correlation: req.correlation || null, created_at: new Date().toISOString() }
      const ref = await db.collection('approvals_pending').add(pending)
      // NEXT ACTION: create a Cloud Task to notify approvers and include the `approvals_pending` doc id for idempotency.
      pending.id = ref.id
    } catch (e) {
      console.warn('Failed to persist pending approval', e && e.message)
    }

    // The orchestration should pause and wait for an external webhook callback to /webhook/approval-callback
    return { approved: false, approver: null, reason: 'awaiting_external_approval' }
  } catch (err) {
    console.error('requestApproval error', err)
    return { approved: false, approver: null, reason: err.message }
  }
}

module.exports = { requestApproval }

// NEXT ACTIONS:
// - Secure the approval webhook with a shared secret or verification token
// - Implement a Cloud Task producer on approval callback to resume the orchestrator for the requestId
// - Add unit tests for approval persistence and callback handling

// NEXT ACTIONS / TODOs for `functions/approval/router.js`:
// - Secure the approval webhook: validate a shared secret or Azure AD-signed JWT on incoming callbacks.
// - When approval is recorded, enqueue a Cloud Task to resume the orchestrator pipeline (avoid setImmediate).
// - Add idempotency check: ignore duplicate callbacks if the approval record already has `resolved:true`.
// - Add audit log entry for each approval event and persist approver metadata.
// - Add unit/integration tests for webhook flow and callback validation.
