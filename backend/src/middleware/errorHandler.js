'use strict';

/**
 * middleware/errorHandler.js
 *
 * Global Express error-handling middleware.
 *
 * Catches errors forwarded via next(err) from any route or controller
 * and returns a consistent JSON error envelope:
 *
 *   { error: { message, code, status } }
 *
 * Distinguishes between:
 *  - Validation errors (400) — missing required fields
 *  - Not-found errors  (404)
 *  - Service errors    (503) — blockchain/AI unavailable
 *  - Unknown errors    (500)
 */

/* eslint-disable no-unused-vars */
module.exports = function errorHandler(err, req, res, next) {
  const timestamp = new Date().toISOString();
  const status    = err.statusCode || err.status || 500;
  const message   = err.message    || 'Internal Server Error';

  // Always log server errors; suppress noisy 400s in production
  if (status >= 500) {
    console.error(`[${timestamp}] ERROR ${status} ${req.method} ${req.originalUrl} — ${message}`);
    if (err.stack) console.error(err.stack);
  } else {
    console.warn(`[${timestamp}] WARN  ${status} ${req.method} ${req.originalUrl} — ${message}`);
  }

  // Expose `message` at root level so the frontend's
  // `error.response?.data?.message` accessor works directly.
  res.status(status).json({
    message,
    error: {
      message,
      status,
      path: req.originalUrl,
      timestamp,
    },
  });
};
