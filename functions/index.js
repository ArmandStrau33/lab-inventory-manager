const functions = require('firebase-functions')
const admin = require('firebase-admin')
const express = require('express')
const cors = require('cors')
const { v4: uuidv4 } = require('uuid')

admin.initializeApp()
const db = admin.firestore()

const app = express()
app.use(cors({ origin: true }))
app.use(express.json())

// Validate runtime config and log any warnings
try{
  const settings = require('./config/settings')
  const warns = settings.validateConfig && settings.validateConfig()
  if(Array.isArray(warns) && warns.length) console.warn('config warnings:', warns)
}catch(e){ console.warn('Failed to validate settings at startup', e && e.message) }

// Simple health
app.get('/', (req, res) => res.send({ ok: true }))

// Intake submit endpoint
app.post('/submit', async (req, res) => {
  try{
    const payload = req.body || {}
    // basic validation
    if(!payload.teacher_name || !payload.teacher_email || !payload.experiment_title){
      return res.status(400).json({ error: 'teacher_name, teacher_email and experiment_title are required' })
    }

    const id = uuidv4()
    const now = new Date().toISOString()
    const doc = {
      id,
      teacher_name: payload.teacher_name,
      teacher_email: payload.teacher_email,
      experiment_title: payload.experiment_title,
      materials: Array.isArray(payload.materials) ? payload.materials : (payload.materials ? [payload.materials] : []),
      preferred_date: payload.preferred_date || null,
      preferred_lab: payload.preferred_lab || null,
      notes: payload.notes || null,
      status: 'NEW',
      created_at: now,
      updated_at: now
    }

    await db.collection('lab_requests').doc(id).set(doc)

    // Fire-and-forget orchestration: enqueue or start the pipeline but don't wait here.
    // This keeps the HTTP response fast while the background pipeline continues.
    try {
      const correlation = req.header('x-correlation-id') || id
      console.info('submit: enqueuing pipeline', { id, correlation })
      // Use Cloud Tasks when enabled to get retries and durability; fallback to setImmediate for dev.
      const enqueuePipeline = async (payload) => {
        if (process.env.USE_CLOUD_TASKS === 'true') {
          try {
            // Lazy require to avoid adding dependency when not used in dev
            const { CloudTasksClient } = require('@google-cloud/tasks');
            const client = new CloudTasksClient();
            const project = process.env.CLOUD_TASKS_PROJECT;
            const location = process.env.CLOUD_TASKS_LOCATION || 'us-central1';
            const queue = process.env.CLOUD_TASKS_QUEUE || 'default';
            const url = process.env.CLOUD_TASKS_TARGET_URL || (process.env.TARGET_PIPELINE_URL);
            if (!project || !url) throw new Error('CLOUD_TASKS_PROJECT or CLOUD_TASKS_TARGET_URL not configured');

            const parent = client.queuePath(project, location, queue);
            const task = {
              httpRequest: {
                httpMethod: 'POST',
                url: url,
                headers: { 'Content-Type': 'application/json' },
                body: Buffer.from(JSON.stringify(payload)).toString('base64')
              }
            };
            await client.createTask({ parent, task });
            return true;
          } catch (err) {
            console.warn('enqueuePipeline: Cloud Tasks enqueue failed, falling back to in-process', err && err.message);
          }
        }
        // dev fallback: run in next tick
        setImmediate(() => {
          try { const { processLabRequest } = require('./orchestrator/pipeline'); processLabRequest(payload).catch(e=>console.error('pipeline error', e)) }catch(e){ console.warn('Orchestrator not available', e && e.message) }
        })
      };

      // fire-and-forget enqueue
      enqueuePipeline(Object.assign({}, doc, { correlation })).catch(err => console.warn('enqueuePipeline failed', err && err.message))
    } catch (e) {
      // Log but don't fail the request
      console.warn('Orchestrator enqueue failed:', e && e.message)
    }

    return res.json({ id })
  }catch(err){
    console.error(err)
    return res.status(500).json({ error: err.message })
  }
})

// Webhook endpoint for approval callbacks (Power Automate / external approval flow)
// Expected payload: { requestId: string, approved: boolean, approver?: string, reason?: string }
app.post('/webhook/approval-callback', async (req, res) => {
  try {
    const body = req.body || {}
    const { requestId, approved, approver, reason } = body
    if (!requestId || typeof approved !== 'boolean') return res.status(400).json({ error: 'requestId and approved(boolean) are required' })

    // Persist approval record
    const approval = {
      requestId,
      approved,
      approver: approver || 'external',
      reason: reason || null,
      created_at: new Date().toISOString()
    }

    await db.collection('approvals').add(approval)

    // Update lab_requests status and history
    const reqRef = db.collection('lab_requests').doc(requestId)
    const reqSnap = await reqRef.get()
    if (reqSnap.exists) {
      const reqDoc = reqSnap.data()
      const newStatus = approved ? 'APPROVED' : 'REJECTED'
      await reqRef.update({ status: newStatus, updated_at: new Date().toISOString() })
      // add history row
      try {
        const { upsertRequestRow } = require('./datastore/excel_backend')
        await upsertRequestRow(Object.assign({}, reqDoc, { status: newStatus }), newStatus, { reason })
      } catch (e) {
        console.warn('Failed to write history row after approval callback', e && e.message)
      }
      // audit
      try { const { logEvent } = require('./datastore/audit'); await logEvent(requestId, approved ? 'APPROVED' : 'REJECTED', { approver, reason }) } catch(e){ console.warn('audit log failed', e && e.message) }
    }

    return res.json({ ok: true })
  } catch (err) {
    console.error('approval-callback error', err)
    return res.status(500).json({ error: err.message })
  }
})

exports.api = functions.https.onRequest(app)

// NEXT ACTIONS / TODOs for `functions/index.js`:
// - Add authentication middleware (verify Firebase Auth or API key) for `/submit` and webhook routes.
// - Replace setImmediate intake pattern with Cloud Tasks or Pub/Sub producer to enable retries and idempotency.
// - Add JSON schema validation for incoming lab request payloads (e.g., using AJV) and return 400 on invalid.
// - Improve logging: include structured correlation id in all log lines (use a small logger wrapper).
// - Tests: unit tests for route handlers and an integration test that simulates a webhook callback.
// - Deployment: confirm `functions/package.json` engines.node aligns with chosen Gen (18 vs 20).
