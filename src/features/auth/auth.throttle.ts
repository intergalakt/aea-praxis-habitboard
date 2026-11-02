/**
 * App-Drosselung für Anmelde- und Registrierversuche (EC-5, SEC-04).
 *
 * Bewusst im Prozessspeicher: ohne Service-Role-Key (der nie ins Repo darf) gäbe es
 * keine Tabelle, die ein anonymer Angreifer nicht selbst zurücksetzen könnte.
 * Grenze: Zähler gelten pro Instanz. Review-Trigger steht in design.md (Entscheidung 4).
 */

const WINDOW_MS = 15 * 60 * 1000;
const BLOCK_MS = 15 * 60 * 1000;
const MAX_FAILURES = 5;
const MAX_BUCKETS = 5_000;

type Bucket = { count: number; firstAt: number; blockedUntil: number };

const buckets = new Map<string, Bucket>();

export function throttleKey(email: string, ip: string): string {
  return `${email.trim().toLowerCase()}|${ip}`;
}

function prune(now: number): void {
  if (buckets.size < MAX_BUCKETS) return;
  for (const [key, bucket] of buckets) {
    const stale = bucket.blockedUntil < now && now - bucket.firstAt > WINDOW_MS;
    if (stale) buckets.delete(key);
  }
}

export function checkAttempt(
  key: string,
  now: number = Date.now(),
): { allowed: boolean; retryAfterSeconds: number } {
  const bucket = buckets.get(key);
  if (!bucket) return { allowed: true, retryAfterSeconds: 0 };
  if (bucket.blockedUntil > now) {
    return {
      allowed: false,
      retryAfterSeconds: Math.ceil((bucket.blockedUntil - now) / 1000),
    };
  }
  if (now - bucket.firstAt > WINDOW_MS) {
    buckets.delete(key);
    return { allowed: true, retryAfterSeconds: 0 };
  }
  return { allowed: true, retryAfterSeconds: 0 };
}

export function recordFailure(key: string, now: number = Date.now()): void {
  prune(now);
  const bucket = buckets.get(key);
  if (!bucket || now - bucket.firstAt > WINDOW_MS) {
    buckets.set(key, { count: 1, firstAt: now, blockedUntil: 0 });
    return;
  }
  bucket.count += 1;
  if (bucket.count >= MAX_FAILURES) {
    bucket.blockedUntil = now + BLOCK_MS;
  }
}

export function clearFailures(key: string): void {
  buckets.delete(key);
}

/** Nur für Tests: Zustand zurücksetzen. */
export function resetThrottle(): void {
  buckets.clear();
}
