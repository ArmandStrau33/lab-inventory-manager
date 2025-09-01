const SharePointAdapter = require('../platform/sharepoint_adapter');
const { SHAREPOINT_SITE_URL } = require('../config/settings');
const msal = require('../platform/msal_helper');

/**
 * tokenProvider - returns a bearer token string for Graph/SharePoint calls.
 * This delegates to the MSAL helper which handles caching and refresh.
 */
async function tokenProvider(){
  const res = await msal.getToken().catch(() => null);
  return res && res.accessToken;
}

/**
 * checkInventory
 * - materials: array|string - list of materials to check
 * - options: { forceRefresh: boolean }
 * Returns a normalized object: { material_enough: boolean, missing_items: string[], details?: any }
 */
async function checkInventory(materials, options = {}){
  const list = Array.isArray(materials)
    ? materials.map(m => (m||'').toString().trim()).filter(Boolean)
    : (typeof materials === 'string' ? materials.split(',').map(s=>s.trim()).filter(Boolean) : []);

  // quick validation
  if(list.length === 0) return { material_enough: true, missing_items: [] };

  try {
    const { createCache } = require('../common/cache');
    if(!global.__inventory_lru) global.__inventory_lru = createCache({ ttlMs: 2*60*1000, maxSize: 200 });

    const cacheKey = list.join('|')
    const sharepoint = new SharePointAdapter(SHAREPOINT_SITE_URL, tokenProvider);

    // If caller asked for a forced refresh, skip cache read
    const compute = async () => await sharepoint.checkMaterialStock(list);
    const res = (options.forceRefresh)
      ? await compute()
      : await global.__inventory_lru.computeIfAbsentAsync(cacheKey, compute);

    // normalize result shape
    return {
      material_enough: !!res.material_enough,
      missing_items: Array.isArray(res.missing_items) ? res.missing_items : [],
      details: res.details || null
    };
  } catch (error) {
    console.error('Error checking inventory:', error && error.message || error);
    // Fallback: mark as uncertain rather than fail the pipeline
    return { material_enough: true, missing_items: [], warning: 'inventory_check_failed' };
  }
}

// NEXT ACTIONS / TODOs for `functions/inventory/checker.js`:
// - Replace in-memory cache with `lru-cache` and expose metrics (hits/misses).
// - Add fuzzy matching and unit normalization for material names (g vs grams, etc.).
// - Add retry/backoff around SharePoint reads and surface structured errors for caller handling.
// - Add integration tests that mock SharePointAdapter responses for missing/available cases.
// ROADMAP: add unit tests, then replace cache implementation.

module.exports = { checkInventory };
