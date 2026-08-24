/**
 * In-process sliding window rate limiter for public endpoints.
 *
 * Good enough for a single Node instance; when the deployment fans out,
 * swap the store for Redis behind the same function signature. Callers
 * key by action plus client identity and treat false as a soft 429.
 */

const buckets = new Map<string, number[]>();

let lastSweep = 0;
const SWEEP_INTERVAL_MS = 60_000;

function sweep(nowMs: number) {
  if (nowMs - lastSweep < SWEEP_INTERVAL_MS) return;
  lastSweep = nowMs;
  for (const [key, hits] of buckets) {
    const alive = hits.filter((t) => t > nowMs - 3_600_000);
    if (alive.length === 0) buckets.delete(key);
    else buckets.set(key, alive);
  }
}

/** Returns true when the call is allowed under limit per windowMs. */
export function rateLimit(
  key: string,
  limit: number,
  windowMs: number,
  nowMs = Date.now(),
): boolean {
  sweep(nowMs);
  const hits = (buckets.get(key) ?? []).filter((t) => t > nowMs - windowMs);
  if (hits.length >= limit) {
    buckets.set(key, hits);
    return false;
  }
  hits.push(nowMs);
  buckets.set(key, hits);
  return true;
}

/** Test hook: clears all buckets. */
export function resetRateLimits() {
  buckets.clear();
}
