interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const store = new Map<string, RateLimitEntry>();

setInterval(() => {
  const now = Date.now();
  store.forEach((entry, key) => {
    if (now > entry.resetAt) store.delete(key);
  });
}, 60_000);

interface RateLimitConfig {
  limit: number;
  windowSeconds: number;
}

const DEFAULT_CONFIG: RateLimitConfig = { limit: 30, windowSeconds: 60 };

export const AUTH_RATE_LIMIT: RateLimitConfig = { limit: 10, windowSeconds: 60 };

export const STRICT_RATE_LIMIT: RateLimitConfig = { limit: 5, windowSeconds: 60 };

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

export function getRateLimitKey(request: Request): string {
  const realIp = request.headers.get("x-real-ip");
  if (realIp) return realIp;
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    const parts = forwarded.split(",").map(s => s.trim());
    return parts[parts.length - 1] || "unknown";
  }
  return "unknown";
}

export function rateLimit(request: Request, config?: RateLimitConfig): Response | null {
  const key = getRateLimitKey(request);
  const result = checkRateLimit(key, config);
  return result.allowed ? null : result.response;
}

const pinFailStore = new Map<string, { count: number; lockedUntil: number }>();

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
    const lockMinutes = Math.min(5 * Math.pow(2, Math.floor(entry.count / 5) - 1), 60);
    entry.lockedUntil = Date.now() + lockMinutes * 60 * 1000;
  }
  pinFailStore.set(orgCode, entry);
}

export function clearPinFailures(orgCode: string): void {
  pinFailStore.delete(orgCode);
}
