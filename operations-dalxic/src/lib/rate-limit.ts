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

/** Very strict config for sensitive endpoints */
export const STRICT_RATE_LIMIT: RateLimitConfig = { limit: 5, windowSeconds: 60 };

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

/** Extract client IP from request headers — spoof-resistant */
export function getRateLimitKey(request: Request): string {
  // On Vercel, x-real-ip is set by the platform and cannot be spoofed
  const realIp = request.headers.get("x-real-ip");
  if (realIp) return realIp;
  // Fallback: use x-forwarded-for but take the LAST entry (closest proxy)
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    const parts = forwarded.split(",").map(s => s.trim());
    return parts[parts.length - 1] || "unknown";
  }
  return "unknown";
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

// ── PIN brute-force protection ──

const pinFailStore = new Map<string, { count: number; lockedUntil: number }>();

// Clean up expired lockouts every 5 minutes
setInterval(() => {
  const now = Date.now();
  pinFailStore.forEach((entry, key) => {
    if (now >= entry.lockedUntil && entry.lockedUntil > 0) pinFailStore.delete(key);
  });
}, 300_000);

export function checkPinLockout(orgCode: string): Response | null {
  const entry = pinFailStore.get(orgCode);
  if (!entry) return null;
  if (Date.now() < entry.lockedUntil) {
    const retryAfter = Math.ceil((entry.lockedUntil - Date.now()) / 1000);
    return Response.json(
      { error: "Too many failed attempts. Account locked." },
      { status: 429, headers: { "Retry-After": String(retryAfter) } }
    );
  }
  if (Date.now() >= entry.lockedUntil) pinFailStore.delete(orgCode);
  return null;
}

export function recordPinFailure(orgCode: string): void {
  const entry = pinFailStore.get(orgCode) || { count: 0, lockedUntil: 0 };
  entry.count++;
  if (entry.count >= 5) {
    // Lock for 5 minutes, doubling each time
    const lockMinutes = Math.min(5 * Math.pow(2, Math.floor(entry.count / 5) - 1), 60);
    entry.lockedUntil = Date.now() + lockMinutes * 60 * 1000;
  }
  pinFailStore.set(orgCode, entry);
}

export function clearPinFailures(orgCode: string): void {
  pinFailStore.delete(orgCode);
}
