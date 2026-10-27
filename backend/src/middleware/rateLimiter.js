/**
 * Rate Limiter for Pairing Code Redemption
 *
 * Protects POST /api/pairing/redeem from brute-force guessing and connection exhaustion.
 * Tracks failed redemption attempts keyed by authenticated student ID and client IP.
 *
 * Config:
 * - Window: 10 minutes (matching pairing code lifetime)
 * - Threshold: 5 failed attempts per window
 * - Exceeded: Returns HTTP 429 Too Many Requests with retryAfterSeconds
 */

const WINDOW_MS = 10 * 60 * 1000; // 10 minutes
const MAX_FAILED_ATTEMPTS = 5;

// In-memory store: key -> { count: number, resetAt: number }
const attemptsStore = new Map();

/**
 * Builds tracking keys from student user ID and client IP.
 * Tracking both independently prevents:
 * 1. IP rotation attacks (keyed by student user ID).
 * 2. Multi-account creation attacks from a single IP (keyed by IP).
 *
 * @param {import('express').Request} req
 * @returns {string[]}
 */
function getRateLimitKeys(req) {
  const keys = [];
  const userId = req.user?.id;
  const ip = req.ip || req.socket?.remoteAddress;

  if (userId) {
    keys.push(`user:${userId}`);
  }
  if (ip) {
    keys.push(`ip:${ip}`);
  }
  if (keys.length === 0) {
    keys.push('anon:unknown');
  }
  return keys;
}

/**
 * Prunes expired records from memory store when it grows large.
 */
function pruneExpiredRecords(now) {
  for (const [key, record] of attemptsStore.entries()) {
    if (now >= record.resetAt) {
      attemptsStore.delete(key);
    }
  }
}

/**
 * Express middleware that checks if the student or client IP has exceeded the failed attempt limit.
 *
 * @type {import('express').RequestHandler}
 */
export function pairingRedeemRateLimiter(req, res, next) {
  const keys = getRateLimitKeys(req);
  const now = Date.now();

  let maxCount = 0;
  let maxResetAt = 0;

  for (const key of keys) {
    const record = attemptsStore.get(key);
    if (!record) continue;

    if (now >= record.resetAt) {
      attemptsStore.delete(key);
      continue;
    }

    if (record.count >= MAX_FAILED_ATTEMPTS) {
      if (record.count > maxCount) maxCount = record.count;
      if (record.resetAt > maxResetAt) maxResetAt = record.resetAt;
    }
  }

  // If any tracking key has reached the threshold, block request
  if (maxCount >= MAX_FAILED_ATTEMPTS) {
    const retryAfterSeconds = Math.max(1, Math.ceil((maxResetAt - now) / 1000));
    res.setHeader('Retry-After', retryAfterSeconds);

    return res.status(429).json({
      error: 'Too Many Requests',
      message: 'Too many failed pairing attempts. Please wait 10 minutes before trying again.',
      retryAfterSeconds,
    });
  }

  next();
}

/**
 * Increments the failed attempt counter for the requesting student and IP.
 * Called whenever a redemption request fails validation, lookup, conflict, or expiration.
 *
 * @param {import('express').Request} req
 */
export function recordFailedRedeemAttempt(req) {
  const keys = getRateLimitKeys(req);
  const now = Date.now();

  // Prune expired entries if the map exceeds 200 items to prevent memory leaks
  if (attemptsStore.size > 200) {
    pruneExpiredRecords(now);
  }

  for (const key of keys) {
    const record = attemptsStore.get(key);

    if (!record || now >= record.resetAt) {
      attemptsStore.set(key, {
        count: 1,
        resetAt: now + WINDOW_MS,
      });
    } else {
      record.count += 1;
    }
  }
}

/**
 * Clears the failed attempt counters for the requesting student and IP.
 * Called upon successful pairing code redemption.
 *
 * @param {import('express').Request} req
 */
export function clearRedeemAttempts(req) {
  const keys = getRateLimitKeys(req);
  for (const key of keys) {
    attemptsStore.delete(key);
  }
}

/**
 * Resets all rate limit tracking in memory.
 * Primarily used by automated test suites to ensure test isolation.
 */
export function resetAllRateLimits() {
  attemptsStore.clear();
}
