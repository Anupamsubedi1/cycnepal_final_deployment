// Lightweight in-memory rate limiter for sensitive endpoints (e.g. admin login).
// Keyed by an arbitrary identifier (email + IP). State lives in the Node process,
// so it protects a single instance; for multi-instance deployments back this with
// a shared store (Redis/Mongo). It is intentionally dependency-free.

interface AttemptRecord {
  count: number;
  firstAttemptAt: number;
  lockedUntil?: number;
}

const WINDOW_MS = 15 * 60 * 1000; // attempts counted within a 15-minute window
const MAX_ATTEMPTS = 5; // failures before lockout
const LOCK_MS = 15 * 60 * 1000; // lockout duration after exceeding the limit

const store = new Map<string, AttemptRecord>();

function now(): number {
  return Date.now();
}

export interface RateLimitStatus {
  allowed: boolean;
  retryAfterSeconds?: number;
}

export function checkRateLimit(key: string): RateLimitStatus {
  const record = store.get(key);
  if (!record) {
    return { allowed: true };
  }

  const t = now();

  if (record.lockedUntil && record.lockedUntil > t) {
    return { allowed: false, retryAfterSeconds: Math.ceil((record.lockedUntil - t) / 1000) };
  }

  // Window expired — reset.
  if (t - record.firstAttemptAt > WINDOW_MS) {
    store.delete(key);
    return { allowed: true };
  }

  return { allowed: true };
}

export function recordFailure(key: string): void {
  const t = now();
  const record = store.get(key);

  if (!record || t - record.firstAttemptAt > WINDOW_MS) {
    store.set(key, { count: 1, firstAttemptAt: t });
    return;
  }

  record.count += 1;
  if (record.count >= MAX_ATTEMPTS) {
    record.lockedUntil = t + LOCK_MS;
  }
  store.set(key, record);
}

export function clearAttempts(key: string): void {
  store.delete(key);
}

// Opportunistic cleanup so the map can't grow unbounded.
function sweep(): void {
  const t = now();
  for (const [key, record] of store.entries()) {
    const expired = t - record.firstAttemptAt > WINDOW_MS;
    const unlocked = !record.lockedUntil || record.lockedUntil <= t;
    if (expired && unlocked) {
      store.delete(key);
    }
  }
}

if (typeof setInterval === "function") {
  const interval = setInterval(sweep, WINDOW_MS);
  // Don't keep the event loop alive just for cleanup.
  (interval as unknown as { unref?: () => void }).unref?.();
}
