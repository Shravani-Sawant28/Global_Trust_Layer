'use strict';

/**
 * routes/dispute.js
 *
 * Routes:
 *  POST /api/dispute              → createDispute
 *  GET  /api/dispute/:id          → getDispute
 *  GET  /api/dispute/job/:jobId   → getDisputesByJob
 *
 * NOTE: /job/:jobId must be before /:id to avoid route collision.
 */

const express = require('express');
const router  = express.Router();

const {
  createDispute,
  getDispute,
  getDisputesByJob,
} = require('../controllers/disputeController');

// GET /api/dispute/job/:jobId — before /:id
router.get('/job/:jobId', getDisputesByJob);

// GET /api/dispute/:id
router.get('/:id', getDispute);

// POST /api/dispute
router.post('/', createDispute);

module.exports = router;
