'use strict';

/**
 * routes/jobs.js
 *
 * IMPORTANT: /open must be registered before /:id
 * to prevent Express treating "open" as an id parameter.
 *
 * Routes:
 *  GET  /api/jobs/open  → getOpenJobs  (browse page, no auth needed)
 *  GET  /api/jobs       → getJobs      (?wallet=0x...)
 *  GET  /api/jobs/:id   → getJobById
 *  POST /api/jobs       → createJob
 */

const express = require('express');
const router  = express.Router();

const {
  createJob,
  getOpenJobs,
  getJobs,
  getJobById,
  acceptJob,
  linkOnChainId,
} = require('../controllers/jobController');

const { validateWalletBody } = require('../middleware/validateWallet');

// GET /api/jobs/open — must come before /:id
router.get('/open', getOpenJobs);

// GET /api/jobs?wallet=0x...
router.get('/', getJobs);

// GET /api/jobs/:id
router.get('/:id', getJobById);

// POST /api/jobs/:id/accept
router.post('/:id/accept', acceptJob);

// PATCH /api/jobs/:id/link
router.patch('/:id/link', linkOnChainId);

// POST /api/jobs
router.post(
  '/',
  validateWalletBody(['clientWallet'], ['freelancerWallet']),
  createJob
);

module.exports = router;
