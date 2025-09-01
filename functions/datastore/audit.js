// Defer firebase-admin require until runtime so requiring this module before
// `admin.initializeApp()` does not throw. This allows safe static analysis and
// unit tests that mock admin.
async function logEvent(requestId, eventName, payload){
  // TODO: consider partitioning or TTL for audit logs to control storage costs
  const admin = require('firebase-admin')
  const db = admin.firestore()
  const doc = { requestId, eventName, payload: payload||null, timestamp: new Date().toISOString() }
  try{
    await db.collection('audit_logs').add(doc)
  }catch(e){
    console.warn('Failed to write audit log', e && e.message)
  }
}

module.exports = { logEvent }

// NEXT ACTIONS / TODOs for `functions/datastore/audit.js`:
// - Add indexing strategy for audit logs to support queries by requestId and time ranges (create composite indexes in Firestore).
// - Add TTL-based archival into cold storage (BigQuery or exported CSV) for logs older than X days.
// - Add structured log fields (level, message, correlationId) and integrate with Cloud Logging for dashboards.
// - Add unit tests for audit write failures and ensure they don't crash the pipeline.
// - Consider adding per-collection TTL/cleanup and a daily export job to reduce costs.

// ROADMAP: create `audit-exports` scheduled function to move old logs to Cloud Storage/BigQuery.
