/**
 * In-memory sliding window rate limiter.
 * Each key (typically IP) gets a window of allowed requests.
 * Resets after the window expires.
 */

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const store = new Map<string, RateLimitEntry>();

// Clean up expired entries every 60s to prevent memory leak
setInterval(() => {
  const now = Date.now();
  store.forEach((entry, key) => {
    if (now > entry.resetAt) store.delete(key);
  });
}, 60_000);

interface RateLimitConfig {
  /** Max requests per window */
  limit: number;
  /** Window duration in seconds */
  windowSeconds: number;
}

/** Default: 30 requests per 60 seconds */
const DEFAULT_CONFIG: RateLimitConfig = { limit: 30, windowSeconds: 60 };

/** Stricter config for auth endpoints */
export const AUTH_RATE_LIMIT: RateLimitConfig = { limit: 10, windowSeconds: 60 };

/**
 * Check rate limit for a given key.
 * Returns { allowed, remaining } or a 429 Response if blocked.
 */
export function checkRateLimit(
  key: string,
  config: RateLimitConfig = DEFAULT_CONFIG,
): { allowed: true; remaining: number } | { allowed: false; response: Response } {
  const now = Date.now();
  const entry = store.get(key);

  if (!entry || now > entry.resetAt) {
    store.set(key, { count: 1, resetAt: now + config.windowSeconds * 1000 });
    return { allowed: true, remaining: config.limit - 1 };
  }

  if (entry.count >= config.limit) {
    const retryAfter = Math.ceil((entry.resetAt - now) / 1000);
    return {
      allowed: false,
      response: Response.json(
        { error: "Too many requests. Try again later." },
        {
          status: 429,
          headers: {
            "Retry-After": String(retryAfter),
            "X-RateLimit-Limit": String(config.limit),
            "X-RateLimit-Remaining": "0",
            "X-RateLimit-Reset": String(Math.ceil(entry.resetAt / 1000)),
          },
        },
      ),
    };
  }

  entry.count++;
  return { allowed: true, remaining: config.limit - entry.count };
}

/** Extract client IP from request headers */
export function getRateLimitKey(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  return forwarded?.split(",")[0]?.trim() ?? "unknown";
}

/**
 * Rate limit guard — call at the top of any API handler.
 * Returns a 429 Response if blocked, or null if allowed.
 *
 * Usage:
 *   const blocked = rateLimit(request);
 *   if (blocked) return blocked;
 */
export function rateLimit(request: Request, config?: RateLimitConfig): Response | null {
  const key = getRateLimitKey(request);
  const result = checkRateLimit(key, config);
  return result.allowed ? null : result.response;
}
