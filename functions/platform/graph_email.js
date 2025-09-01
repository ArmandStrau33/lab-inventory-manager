const axios = require('axios')
const settings = require('../config/settings')
const msal = require('./msal_helper')

/**
 * Send an email via Microsoft Graph using application access token when available.
 * If ACCESS_TOKEN is not configured, this will log to console (development mode).
 * TODO: Replace with MSAL client-credentials flow to obtain tokens securely.
 */
async function send(to, subject, html, cc = [], opts = {}){
  console.log('graph_email.send', {to, subject})
  // Acquire token via MSAL helper when available, otherwise use settings.ACCESS_TOKEN
  // Prefer msal.getAccessToken() convenience method for a raw token string
  const token = await (async () => {
    try { return await msal.getAccessToken(); } catch (e) { return settings.ACCESS_TOKEN || null; }
  })();
  if (!token) {
    console.warn('No ACCESS_TOKEN or MSAL token available; skipping real send')
    return { ok: true, mocked: true }
  }

  const url = 'https://graph.microsoft.com/v1.0/users/' + encodeURIComponent(to) + '/sendMail'
  const payload = {
    message: {
      subject: subject,
      body: { contentType: 'HTML', content: html },
      toRecipients: [{ emailAddress: { address: to } }],
      ccRecipients: (cc || []).map(a => ({ emailAddress: { address: a } }))
    }
  }

  try{
    const res = await axios.post(url, payload, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    })
  // TODO: surface Graph message-id or response headers for tracking
  // Persist transactional email log (best-effort)
  try{ const { logEmail } = require('../datastore/email_logs'); await logEmail({ to, subject, body: html, template: opts.template || null, correlation: opts.correlation || null, result: { status: res.status } }) }catch(e){ console.warn('graph_email: failed to persist email log', e && e.message) }
  return { ok: true, status: res.status }
  }catch(err){
    console.error('graph_email.send error', err && (err.response && err.response.data) || err.message)
    // TODO: implement retry queue for transient errors (429/5xx) and persist failures to Firestore
  try{ const { logEmail } = require('../datastore/email_logs'); await logEmail({ to, subject, body: html, template: opts.template || null, correlation: opts.correlation || null, result: { error: String(err) } }) }catch(e){ /* swallow */ }
  throw err
  }

  // NEXT ACTIONS:
  // - Move templates to `functions/templates/` and reference them from notify/email.js
  // - Add retry queue for transient errors and log Graph message-id on success
  // - Add unit tests that mock msal_helper and Graph responses
}

module.exports = { send }

// NEXT ACTIONS / TODOs for `functions/platform/graph_email.js`:
// - Add delivery logging to Firestore with status (queued/sent/failed) and correlation id.
// - Add retry/backoff for transient Graph failures and respect 429/Retry-After.
// - Add unit tests to mock Graph responses and ensure proper error handling.
// - Consider batching or templating service for procurement emails.
