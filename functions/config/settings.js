module.exports = {
  // Lab calendar mapping: friendly name -> calendar/email address
  LAB_CALENDARS: { 'Lab A': 'lab-a@school.za', 'Lab B': 'lab-b@school.za' },

  // Default approvers and procurement CC recipients (override via env or admin UI later)
  APPROVERS: (process.env.APPROVERS || 'coach@school.za,labtech@school.za').split(','),
  PROCUREMENT_CC: (process.env.PROCUREMENT_CC || 'store@school.za').split(','),

  // Excel logging - optional. When set, the excel adapter will attempt to write rows
  EXCEL_DRIVE_ID: process.env.EXCEL_DRIVE_ID || null,
  EXCEL_FILE_ID: process.env.EXCEL_FILE_ID || null,
  EXCEL_SHEET: process.env.EXCEL_SHEET || 'LabRequestsLog',

  // Working hours used by scheduler (floating point hours; tz string optional)
  WORKING_HOURS: { start: parseFloat(process.env.WORKING_HOURS_START || '7.5'), end: parseFloat(process.env.WORKING_HOURS_END || '16'), tz: process.env.WORKING_TZ || 'Africa/Johannesburg' },
  MATERIAL_MIN_QTY: parseInt(process.env.MATERIAL_MIN_QTY || '1', 10),

  // SharePoint / Graph settings
  SHAREPOINT_SITE_URL: process.env.SHAREPOINT_SITE_URL || 'https://your-tenant.sharepoint.com/sites/your-site',

  // MSAL / Azure AD credentials - used by msal_helper for client-credentials flow.
  // In production prefer to set these with `firebase functions:config:set sharepoint.tenant_id="..." sharepoint.client_id="..." sharepoint.client_secret="..."`
  // or use Secret Manager / Key Vault and inject at deploy time.
  ACCESS_TOKEN: process.env.ACCESS_TOKEN || null, // fallback short-lived token for testing only
  TENANT_ID: process.env.SHAREPOINT_TENANT || process.env.TENANT_ID || null,
  CLIENT_ID: process.env.SHAREPOINT_CLIENT_ID || process.env.CLIENT_ID || null,
  CLIENT_SECRET: process.env.SHAREPOINT_CLIENT_SECRET || process.env.CLIENT_SECRET || null,

  // Notification default
  NOTIFY_EMAIL: process.env.NOTIFY_EMAIL || 'it-support@school.example',

  // NEXT ACTIONS:
  // - Add a startup validator that reads required keys and logs a clear error (fail fast)
  // - Move secrets to Secret Manager or Azure Key Vault and load at runtime
  // - Add typed config helper and unit tests to validate parsing and defaults
  // - Consider making APPROVERS and PROCUREMENT_CC configurable via a small admin REST endpoint
}

// Non-invasive runtime validator. Returns an array of warning strings (empty if ok)
function validateConfig(){
  const warnings = []
  if(!module.exports.CLIENT_ID || !module.exports.CLIENT_SECRET || !module.exports.TENANT_ID){
    warnings.push('MSAL/Graph credentials not fully configured: CLIENT_ID, CLIENT_SECRET, TENANT_ID are recommended for production')
  }
  if(!module.exports.SHAREPOINT_SITE_URL) warnings.push('SHAREPOINT_SITE_URL is not configured')
  return warnings
}

module.exports.validateConfig = validateConfig

// NEXT ACTIONS / TODOs for `functions/config/settings.js`:
// - Move secrets to Secret Manager and load at runtime instead of functions config when possible.
// - Add stricter validation and clear error messages for missing SharePoint/MSAL config.
// - Add environment-based toggles: `DISABLE_GRAPH=true` for local dev to avoid accidental calls.
// - Add unit tests for `validateConfig()` to ensure CI fails fast on missing config.

// Small helper to read flags from env for local development
module.exports.DISABLE_GRAPH = (process.env.DISABLE_GRAPH === 'true')

// NEXT ACTION: add a startup validator which calls validateConfig() and throws in CI if required keys missing.

// NOTE: For production deployments, it's strongly recommended to use Secret Manager or Azure Key Vault
// to manage sensitive information like CLIENT_SECRET, and to inject these secrets at runtime.
