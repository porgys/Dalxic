/**
 * In-memory rate limiter — no external dependencies.
 * For production with multiple instances, swap to Upstash Redis.
 *
 * Usage:
 *   const limiter = rateLimit({ interval: 60_000, limit: 10 })
 *   const { success } = limiter.check(ip)
 */

const stores = new Map()

export default function rateLimit({ interval = 60_000, limit = 10 } = {}) {
  // Clean stale entries every 5 minutes
  const CLEANUP_INTERVAL = 5 * 60_000

  let lastCleanup = Date.now()

  function cleanup() {
    const now = Date.now()
    if (now - lastCleanup < CLEANUP_INTERVAL) return
    lastCleanup = now
    for (const [key, entry] of stores) {
      if (now - entry.timestamp > interval) stores.delete(key)
    }
  }

  return {
    check(key) {
      cleanup()
      const now = Date.now()
      const entry = stores.get(key)

      if (!entry || now - entry.timestamp > interval) {
        stores.set(key, { count: 1, timestamp: now })
        return { success: true, remaining: limit - 1 }
      }

      if (entry.count >= limit) {
        return { success: false, remaining: 0 }
      }

      entry.count++
      return { success: true, remaining: limit - entry.count }
    },
  }
}
