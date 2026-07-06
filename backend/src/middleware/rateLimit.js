'use strict';

/**
 * middleware/rateLimit.js
 *
 * Simple in-memory rate limiter for the AI trust report endpoint.
 * Prevents excessive Gemini API calls from a single IP.
 *
 * Limits: 10 requests per IP per minute for /api/trust
 *         60 requests per IP per minute for all other routes
 *
 * Uses a sliding window counter per IP stored in a Map.
 * The Map is cleared every minute via setInterval.
 *
 * NOTE: For production with multiple server instances, replace
 * this with a Redis-backed rate limiter.
 */

const WINDOW_MS = 60_000; // 1 minute

// Map: { ip -> { count, resetAt } }
const counters = new Map();

// Clean up expired entries every minute
setInterval(() => {
  const now = Date.now();
  for (const [ip, entry] of counters.entries()) {
    if (entry.resetAt <= now) counters.delete(ip);
  }
}, WINDOW_MS);

/**
 * Create a rate limiter middleware.
 *
 * @param {number} maxRequests - max requests allowed per window
 * @returns Express middleware
 */
function createRateLimiter(maxRequests) {
  return (req, res, next) => {
    // Respect X-Forwarded-For for proxied deployments
    const ip  = req.headers['x-forwarded-for']?.split(',')[0].trim() || req.ip;
    const now = Date.now();

    let entry = counters.get(ip);
    if (!entry || entry.resetAt <= now) {
      entry = { count: 0, resetAt: now + WINDOW_MS };
      counters.set(ip, entry);
    }

    entry.count++;

    if (entry.count > maxRequests) {
      const retryAfter = Math.ceil((entry.resetAt - now) / 1000);
      res.setHeader('Retry-After', retryAfter);
      const err = new Error(`Rate limit exceeded. Try again in ${retryAfter} seconds.`);
      err.statusCode = 429;
      return next(err);
    }

    // Expose rate limit headers
    res.setHeader('X-RateLimit-Limit',     maxRequests);
    res.setHeader('X-RateLimit-Remaining', Math.max(0, maxRequests - entry.count));
    res.setHeader('X-RateLimit-Reset',     Math.ceil(entry.resetAt / 1000));

    next();
  };
}

// Pre-built limiters
const trustRateLimiter  = createRateLimiter(10);  // 10 req/min for AI endpoint
const defaultRateLimiter = createRateLimiter(60); // 60 req/min elsewhere

module.exports = { trustRateLimiter, defaultRateLimiter, createRateLimiter };
