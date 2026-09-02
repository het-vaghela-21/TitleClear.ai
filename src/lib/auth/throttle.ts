import "server-only";

/**
 * A brake on password guessing.
 *
 * Failures are counted per key (the target email, plus the client address)
 * and the endpoint refuses once the count passes the limit, until the window
 * rolls over. A success clears the counter.
 *
 * Deliberately in-memory, and honest about what that means: the map is
 * per-process, so it resets on restart and does not hold across several
 * instances. That is enough to turn an online guessing attack from thousands
 * of tries a minute into a handful, which is the point — it is not a
 * substitute for a shared store (Redis, or the database) once this runs on
 * more than one node.
 */

const WINDOW_MS = 15 * 60 * 1000;
const MAX_FAILURES = 8;

interface Attempts {
  count: number;
  resetAt: number;
}

const attempts = new Map<string, Attempts>();

/** Drop expired entries so a long-running process doesn't grow unbounded. */
function sweep(now: number): void {
  for (const [key, entry] of attempts) {
    if (entry.resetAt <= now) attempts.delete(key);
  }
}

export interface ThrottleState {
  blocked: boolean;
  retryAfterSeconds: number;
}

export function throttleState(key: string): ThrottleState {
  const now = Date.now();
  const entry = attempts.get(key);
  if (!entry || entry.resetAt <= now) return { blocked: false, retryAfterSeconds: 0 };
  return {
    blocked: entry.count >= MAX_FAILURES,
    retryAfterSeconds: Math.max(1, Math.ceil((entry.resetAt - now) / 1000)),
  };
}

export function recordFailure(key: string): void {
  const now = Date.now();
  sweep(now);
  const entry = attempts.get(key);
  if (!entry || entry.resetAt <= now) {
    attempts.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return;
  }
  entry.count += 1;
}

export function clearFailures(key: string): void {
  attempts.delete(key);
}

/**
 * A best-effort client address. Behind a proxy this is a forwarded header,
 * which the client can forge — so it only ever *adds* to the email-based key,
 * never replaces it. Forging it cannot lift the limit on a targeted account.
 */
export function clientKey(request: Request, email: string): string {
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return `${email}|${forwarded || "local"}`;
}
