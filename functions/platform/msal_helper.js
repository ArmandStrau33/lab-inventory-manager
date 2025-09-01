// MSAL helper: acquire and cache application tokens for Microsoft Graph using client credentials.
// Supports client secret or certificate (PEM) auth. Falls back to ACCESS_TOKEN from settings when MSAL is not configured.
// Exposes:
// - getToken(): returns { accessToken, expiresOn }
// - getAccessToken(): returns a raw access token string (convenience for adapters)
// - clearCache(): reset cached token (useful for tests)
// - validateSettings(): return array of warning messages

const settings = require('../config/settings');

let tokenCache = {
  accessToken: null,
  expiresAt: 0 // epoch ms
};

/**
 * Validate that minimal MSAL config is present.
 * Returns an array of warning strings (empty if ok)
 */
function validateSettings() {
  const warnings = [];
  // Either client secret or client certificate must be present
  const hasSecret = !!(settings.CLIENT_ID && settings.CLIENT_SECRET && settings.TENANT_ID);
  const hasCert = !!(settings.CLIENT_ID && settings.CLIENT_CERT_PEM && settings.TENANT_ID);
  if (!hasSecret && !hasCert) {
    warnings.push('MSAL configuration missing: provide CLIENT_ID + (CLIENT_SECRET or CLIENT_CERT_PEM) and TENANT_ID');
  }
  if (settings.DISABLE_GRAPH) warnings.push('DISABLE_GRAPH=true; Graph calls are disabled in this environment');
  return warnings;
}

// basic exponential backoff
function sleep(ms){ return new Promise(r => setTimeout(r, ms)) }

async function acquireTokenWithRetry(acquireFn, attempts = 3, baseMs = 300){
  let lastErr;
  for(let i=0;i<attempts;i++){
    try{ return await acquireFn() }catch(e){ lastErr = e; const delay = Math.floor(baseMs * Math.pow(2, i) + Math.random()*100); await sleep(delay) }
  }
  throw lastErr;
}

async function getToken() {
  // Return cached token if still valid (1 minute safety buffer)
  const now = Date.now();
  if (tokenCache.accessToken && now < tokenCache.expiresAt - 60000) {
    return { accessToken: tokenCache.accessToken, expiresOn: new Date(tokenCache.expiresAt) };
  }

  // If MSAL credentials are not configured, fall back to ACCESS_TOKEN env (development)
  const hasSecret = !!(settings.CLIENT_ID && settings.CLIENT_SECRET && settings.TENANT_ID);
  const hasCert = !!(settings.CLIENT_ID && settings.CLIENT_CERT_PEM && settings.TENANT_ID);
  if (!hasSecret && !hasCert) {
    if (settings.ACCESS_TOKEN) {
      tokenCache = { accessToken: settings.ACCESS_TOKEN, expiresAt: now + 3600 * 1000 };
      return { accessToken: tokenCache.accessToken, expiresOn: new Date(tokenCache.expiresAt) };
    }
    throw new Error('MSAL credentials not configured and no ACCESS_TOKEN available in settings');
  }

  try {
    // dynamic require so local dev without msal-node can still run
    const { ConfidentialClientApplication } = require('@azure/msal-node');

    // Build auth config supporting either clientSecret or clientCertificate
    const auth = {
      clientId: settings.CLIENT_ID,
      authority: `https://login.microsoftonline.com/${settings.TENANT_ID}`
    };

    if (hasSecret) auth.clientSecret = settings.CLIENT_SECRET;
    if (hasCert) {
      // settings.CLIENT_CERT_PEM should be a PEM formatted private key string
      auth.clientCertificate = { privateKey: settings.CLIENT_CERT_PEM, thumbprint: settings.CLIENT_CERT_THUMBPRINT || undefined };
    }

    const msalConfig = { auth };
    const cca = new ConfidentialClientApplication(msalConfig);

    const acquire = async () => {
      const result = await cca.acquireTokenByClientCredential({ scopes: ['https://graph.microsoft.com/.default'] });
      if (!result || !result.accessToken) throw new Error('MSAL acquireToken returned no accessToken');
      return result;
    };

    const result = await acquireTokenWithRetry(acquire, 3, 300);
    const expiresAt = (result.expiresOn && result.expiresOn.getTime()) || (now + 3600 * 1000);
    tokenCache = { accessToken: result.accessToken, expiresAt };
    return { accessToken: tokenCache.accessToken, expiresOn: new Date(tokenCache.expiresAt) };
  } catch (err) {
    // Last-resort fallback to ACCESS_TOKEN if provided
    console.warn('msal_helper: unable to obtain token via msal-node, falling back to ACCESS_TOKEN if present:', err && err.message);
    if (settings.ACCESS_TOKEN) {
      tokenCache = { accessToken: settings.ACCESS_TOKEN, expiresAt: now + 3600 * 1000 };
      return { accessToken: tokenCache.accessToken, expiresOn: new Date(tokenCache.expiresAt) };
    }
    throw err;
  }
}

// Convenience: return raw access token string for adapters that expect a simple string
async function getAccessToken() {
  const t = await getToken();
  return t && t.accessToken ? t.accessToken : null;
}

function clearCache() {
  tokenCache = { accessToken: null, expiresAt: 0 };
}

module.exports = { getToken, getAccessToken, clearCache, validateSettings };

// NEXT ACTIONS / TODOs for `functions/platform/msal_helper.js`:
// - Add unit tests that mock `@azure/msal-node` to validate caching, expiry and certificate flows.
// - Add more robust retry/backoff policy (respect 429 / Retry-After when present) and surface error codes.
// - Add telemetry counters (fetches, hits, misses, failures) and integrate with Cloud Monitoring.
// - Add secure storage reference (Secret Manager or KeyVault) for certificate/private key retrieval in production.
// - Add a small integration smoke test function that attempts a Graph call using the helper and logs success/failure.
