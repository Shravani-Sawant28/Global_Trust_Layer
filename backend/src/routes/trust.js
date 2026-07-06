'use strict';

/**
 * routes/trust.js
 *
 * Routes:
 *  GET /api/trust/:wallet → getTrustReport
 *
 * Rate-limited to 10 requests per IP per minute (Gemini API cost).
 */

const express = require('express');
const router  = express.Router();

const { getTrustReport }    = require('../controllers/trustController');
const { validateWalletParam } = require('../middleware/validateWallet');
const { trustRateLimiter }  = require('../middleware/rateLimit');

router.get(
  '/:wallet',
  trustRateLimiter,
  validateWalletParam('wallet'),
  getTrustReport
);

module.exports = router;
