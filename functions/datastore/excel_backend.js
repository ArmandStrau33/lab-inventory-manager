const ExcelAdapter = require('../platform/excel_adapter');
const { EXCEL_DRIVE_ID, EXCEL_FILE_ID } = require('../config/settings');
const msal = require('../platform/msal_helper');

async function excelTokenProvider(){
  try{
    const res = await msal.getToken();
    return res && res.accessToken;
  }catch(e){
    // If MSAL isn't configured, caller code will skip Excel logging or use ACCESS_TOKEN fallback
    console.warn('excel_backend: msal token not available', e && e.message)
    return null;
  }
}

// Defer firebase-admin require until runtime to avoid throwing when this
// module is required before `admin.initializeApp()` is called by `index.js`.
async function upsertRequestRow(req, step, extra){
  const admin = require('firebase-admin')
  const db = admin.firestore()
  const now = new Date().toISOString()
  const data = Object.assign({}, req, { step, updated_at: now, extra: extra || null })

  // Defensive: ensure req.id exists
  if(!req || !req.id){
    console.warn('upsertRequestRow called without req.id', req)
    return
  }

  // Log to Firestore
  try{
    await db.collection('lab_requests_history').doc(req.id + ':' + step).set(data)
  }catch(e){ console.warn('failed to write lab_requests_history', e && e.message) }

  // Also log to Excel if configured
  try {
    if (EXCEL_DRIVE_ID && EXCEL_FILE_ID) {
      const excel = new ExcelAdapter(excelTokenProvider);
      // Note: ExcelAdapter expects (driveId, itemId, requestData, step, extraData)
      await excel.logLabRequest(EXCEL_DRIVE_ID, EXCEL_FILE_ID, req, step, extra);
    } else {
      // Log missing config for operators
      if (!EXCEL_DRIVE_ID || !EXCEL_FILE_ID) console.debug('Excel logging disabled: drive/file id missing')
    }
  } catch (error) {
    console.error('Error logging to Excel:', error && (error.message || error));
    // Persist a pending row so a retry worker can pick it up later
    try{
      await db.collection('excel_pending_rows').add({ reqId: req.id, step, req, extra, error: String(error), created_at: new Date().toISOString() })
    }catch(e){ console.error('failed to persist excel_pending_rows', e && e.message) }
    // Continue even if Excel logging fails - don't block pipeline
  }
}

module.exports = { upsertRequestRow }

// NEXT ACTIONS / TODOs for `functions/datastore/excel_backend.js`:
// - Implement batching for Excel writes to avoid frequent small requests; flush on timer or batch size.
// - Add a persistent queue (Firestore collection) for pending rows that failed to write, with a retry worker.
// - Add schema validation and defensive checks for table column availability.
// - Write unit tests for Excel upsert logic (mock Graph/SharePoint responses).
