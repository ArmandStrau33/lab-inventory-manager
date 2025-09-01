/**
 * requestMissingMaterials - placeholder procurement integration.
 * Current: logs and returns a fake ticket id.
 * Next steps:
 * - Integrate with procurement system or create SharePoint procurement list item
 * - Send a detailed procurement email via Graph and attach metadata
 * - Add retry/backoff and persist procurement record in Firestore
 */
async function requestMissingMaterials(req, missing){
  if(!req || !req.id) throw new Error('requestMissingMaterials requires req.id')
  console.log('requestMissingMaterials', req.id, missing)
  try{
    const admin = require('firebase-admin')
    const db = admin.firestore()
    const doc = {
      requestId: req.id,
      missing: Array.isArray(missing) ? missing : [missing],
      status: 'OPEN',
      created_at: new Date().toISOString(),
      correlation: req.correlation || null
    }
    const r = await db.collection('procurements').add(doc)
    // NEXT ACTION: send procurement email via Graph including the persisted id and link to request
    return { id: r.id, status: 'OPEN' }
  }catch(e){
    console.warn('requestMissingMaterials persistence failed', e && e.message)
    return { id: 'proc-' + Date.now(), status: 'OPEN', warning: 'persistence_failed' }
  }
}

module.exports = { requestMissingMaterials }

// NEXT ACTIONS / TODOs for `functions/procurement/requester.js`:
// - Send a formal procurement email to procurement team (via Graph) including the persisted procurement id.
// - Add retry/backoff and persistent queue for failed procurement submissions (Cloud Tasks or Firestore queue).
// - Add link to the SharePoint `LabRequests` item created (or to Firestore doc) in the procurement record.
// - Add tests for the procurement creation flow and for error scenarios.
// - Add status transitions and webhook/callback support from procurement system.

// ROADMAP: implement Graph email integration (small patch), then add Cloud Tasks-based retry worker.
