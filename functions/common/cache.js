// Simple in-memory TTL cache with a max size. Not distributed — suitable for warm-instance caching.
// Usage: const cache = require('./common/cache').createCache({ttlMs:60000, maxSize:500})
function createCache({ttlMs = 5*60*1000, maxSize = 500} = {}){
  const map = new Map()

  function prune(){
    const now = Date.now()
    for(const [k, v] of map){
      if(v.expireAt <= now) map.delete(k)
    }
    // if map too large, drop oldest entries (in insertion order)
    while(map.size > maxSize){
      const firstKey = map.keys().next().value
      map.delete(firstKey)
    }
  }

  function set(key, value){
    const entry = { value, expireAt: Date.now() + ttlMs }
    map.set(key, entry)
    prune()
  }

  function get(key){
    const entry = map.get(key)
    if(!entry) return null
    if(entry.expireAt <= Date.now()){ map.delete(key); return null }
    return entry.value
  }

  async function computeIfAbsentAsync(key, fn){
    const v = get(key)
    if(v != null) return v
    const res = await fn()
    try{ set(key, res) }catch(e){ /* swallow caching errors */ }
    return res
  }

  return { get, set, computeIfAbsentAsync }
}

module.exports = { createCache }

// NEXT ACTIONS / TODOs for `functions/common/cache.js`:
// - Replace this naive in-memory cache with `lru-cache` or a similar well-tested library.
// - Expose basic metrics (hits/misses/size) and integrate with Cloud Monitoring.
// - Provide an optional external cache backend (Redis) configuration for scale.
// - Add unit tests that simulate expiry and concurrent access.
// - Add a simple metrics wrapper (hit/miss counters) so we can observe cache effectiveness in production.

// ROADMAP: replace with `lru-cache` in a dedicated PR and add metrics export.

