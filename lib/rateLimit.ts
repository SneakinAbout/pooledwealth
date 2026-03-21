// WARNING: This store is in-process memory. In multi-process or serverless
// deployments (e.g. Vercel) each function instance has its own independent
// store, so the rate limit only applies within a single process. For true
// enforcement across all instances, replace this with a Redis-backed counter
// (e.g. Upstash Redis with atomic INCR + EXPIRE).
const store = new Map<string, { count: number; resetAt: number }>();

// Clean up expired entries every 5 minutes
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    store.forEach((val, key) => {
      if (now > val.resetAt) store.delete(key);
    });
  }, 5 * 60 * 1000);
}

/**
 * Returns true if the request is allowed, false if rate-limited.
 * @param key      Unique identifier (e.g. "deposit:userId:ip")
 * @param limit    Max requests per window
 * @param windowMs Window duration in milliseconds
 */
export function rateLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const entry = store.get(key);
  if (!entry || now > entry.resetAt) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  if (entry.count >= limit) return false;
  entry.count++;
  return true;
}
