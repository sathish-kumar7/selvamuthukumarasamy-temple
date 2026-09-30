/**
 * Best-effort in-memory login rate limiter. On serverless platforms each
 * instance keeps its own counter, so this slows brute force attempts rather
 * than guaranteeing a hard limit. Good enough for a small internal app; move
 * to a database or KV store if stronger guarantees are needed.
 */
const WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 10;

const attempts = new Map<string, { count: number; resetAt: number }>();

export function checkLoginRateLimit(key: string): { allowed: boolean; retryAfterSeconds: number } {
  const now = Date.now();
  const entry = attempts.get(key);
  if (!entry || entry.resetAt < now) {
    return { allowed: true, retryAfterSeconds: 0 };
  }
  if (entry.count >= MAX_ATTEMPTS) {
    return { allowed: false, retryAfterSeconds: Math.ceil((entry.resetAt - now) / 1000) };
  }
  return { allowed: true, retryAfterSeconds: 0 };
}

export function recordLoginFailure(key: string): void {
  const now = Date.now();
  const entry = attempts.get(key);
  if (!entry || entry.resetAt < now) {
    attempts.set(key, { count: 1, resetAt: now + WINDOW_MS });
  } else {
    entry.count += 1;
  }
  // Prevent unbounded growth.
  if (attempts.size > 5000) {
    for (const [k, v] of attempts) {
      if (v.resetAt < now) attempts.delete(k);
    }
  }
}

export function clearLoginFailures(key: string): void {
  attempts.delete(key);
}
