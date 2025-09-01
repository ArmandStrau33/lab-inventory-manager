const { send } = require('../platform/graph_email')
const { PROCUREMENT_CC } = require('../config/settings')
const fs = require('fs')
const path = require('path')

function loadTemplate(name){
  try{
    const p = path.join(__dirname, '..', 'templates', name + '.html')
    if(fs.existsSync(p)) return fs.readFileSync(p, 'utf8')
  }catch(e){ console.warn('loadTemplate failed', e && e.message) }
  return null
}

/**
 * Notification stubs.
 * - Keep templates small here for now. Move to `functions/templates/` for production.
 * - `send()` should return delivery metadata; consider persisting delivery status to Firestore.
 */
async function notifyMaterialsRequest(req, missing){
  console.log('notifyMaterialsRequest', req.id, missing)
    const subject = `Materials needed for ${req.experiment_title}`
    const tpl = loadTemplate('materials_request') || `<p>Teacher {{teacher_name}} ({{teacher_email}}) requested the following missing materials:</p><ul>{{#missing}}<li>{{.}}</li>{{/missing}}</ul>`
    // simple support for array rendering
    const html = renderTemplate(tpl, {teacher_name: req.teacher_name, teacher_email: req.teacher_email, missing: (missing||[]).map(m=>m.toString())}).replace(/{{#missing}}([\s\S]*?){{\/missing}}/, (_, inner) => (missing||[]).map(m => inner.replace(/{{\.}}/g, m)).join(''))
  for(const to of (PROCUREMENT_CC || [])){
    try{
      const result = await send(to, subject, html, [], { template: 'materials_request', correlation: req.correlation })
      // NEXT ACTION: persist `result` to transactional email log for retries/monitoring
    }catch(e){ console.warn('notifyMaterialsRequest send failed', e && e.message) }
  }
}

async function notifyApproval(req, booking){
  console.log('notifyApproval', req.id, booking)
  // notify teacher of approval and booking
    const subject = `Approval required: ${req.experiment_title}`
    const tpl = loadTemplate('approval_request') || `<p>Please review and approve request <strong>{{id}}</strong> for <em>{{experiment_title}}</em>.</p><p>Teacher: {{teacher_name}} ({{teacher_email}})</p>`
    const html = renderTemplate(tpl, {id: req.id, experiment_title: req.experiment_title, teacher_name: req.teacher_name, teacher_email: req.teacher_email, materials: (req.materials||[]).join(', ')})
  try{
    const result = await send(req.teacher_email, subject, html, [], { template: 'approval_request', correlation: req.correlation })
    // NEXT ACTION: write transactional email log with `result` and correlation id
  }catch(e){ console.warn('notifyApproval send failed', e && e.message) }
}
  // Simple template renderer used for quick HTML/plain email templates.
  function renderTemplate(template, vars){
    return template.replace(/{{\s*([\w\.]+)\s*}}/g, (_, key) => {
      const parts = key.split('.')
      let v = vars
      for(const p of parts){ if(v == null) return ''; v = v[p] }
      return (v == null) ? '' : v
    })
  }

async function notifyRejection(req, reason){
  console.log('notifyRejection', req.id, reason)
  const subject = `Lab request rejected: ${req.experiment_title}`
  const tpl = loadTemplate('rejection') || `<p>Your lab request was rejected. Reason: ${reason || 'No reason provided'}</p>`
  const html = renderTemplate(tpl, { reason: reason || 'No reason provided' })
  try{
    const result = await send(req.teacher_email, subject, html, [], { template: 'rejection', correlation: req.correlation })
    // NEXT ACTION: persist delivery metadata for observability
  }catch(e){ console.warn('notifyRejection send failed', e && e.message) }
}

async function notifyConflictTeachers(req, booking){
  console.log('notifyConflictTeachers', req.id, booking)
  // could notify teachers affected by conflict; placeholder
}

module.exports = { notifyMaterialsRequest, notifyApproval, notifyRejection, notifyConflictTeachers }

// NEXT ACTIONS / TODOs for `functions/notify/email.js`:
// - Move HTML templates into `functions/templates/` and load them at startup.
// - Add a transactional email log in Firestore for delivery retries and audit.
// - Add unit tests for template rendering and for `sendMail` failures.
// - Add the ability to send both HTML and plain-text alternatives and attachments.
// - Consider switching to a dedicated email service (SendGrid) for higher deliverability and better telemetry.

// ROADMAP: create `functions/templates/`, add transactional email collection, and implement a small retry worker.
