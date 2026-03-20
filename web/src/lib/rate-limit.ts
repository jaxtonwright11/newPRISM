/**
 * Simple in-memory rate limiter for API routes.
 * In production, replace with Redis-backed solution (e.g. Upstash).
 */

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const store = new Map<string, RateLimitEntry>();

interface RateLimitOptions {
  windowMs: number;
  max: number;
}

export function checkRateLimit(
  key: string,
  { windowMs, max }: RateLimitOptions
): { allowed: boolean; remaining: number; resetAt: number } {
  const now = Date.now();
  const entry = store.get(key);

  if (!entry || entry.resetAt <= now) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: max - 1, resetAt: now + windowMs };
  }

  if (entry.count >= max) {
    return { allowed: false, remaining: 0, resetAt: entry.resetAt };
  }

  entry.count += 1;
  return { allowed: true, remaining: max - entry.count, resetAt: entry.resetAt };
}

export function getIpKey(request: Request): string {
  const forwarded = (request as Request & { headers: Headers }).headers.get("x-forwarded-for");
  const ip = forwarded ? forwarded.split(",")[0].trim() : "unknown";
  return ip;
}
