// Lightweight transactional email logger. Deferred `firebase-admin` require to avoid startup errors.
async function logEmail({ to, subject, body, template, correlation, result }){
  const admin = require('firebase-admin')
  const db = admin.firestore()
  try{
    const doc = { to, subject, body, template: template || null, correlation: correlation || null, result: result || null, created_at: new Date().toISOString() }
    const r = await db.collection('email_logs').add(doc)
    return { id: r.id }
  }catch(e){ console.warn('email_logs: failed to persist', e && e.message); return null }
}

module.exports = { logEmail }
