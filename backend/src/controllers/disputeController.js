'use strict';

/**
 * controllers/disputeController.js
 *
 * Business logic for dispute endpoints.
 *
 * Endpoints:
 *  POST /api/dispute      → createDispute
 *  GET  /api/dispute/:id  → getDispute
 */

const disputeQueries = require('../db/queries/disputes');
const jobQueries     = require('../db/queries/jobs');
const walletQueries  = require('../db/queries/wallets');

// ─────────────────────────────────────────────────────────────
//  POST /api/dispute
// ─────────────────────────────────────────────────────────────

/**
 * createDispute — store the off-chain dispute record.
 *
 * The on-chain raiseDispute() call is made from the frontend directly.
 * This endpoint records the metadata for our DB so we can display it
 * without querying the chain on every page load.
 *
 * Request body:
 *  {
 *    jobId:           number   (DB jobs.id, required)
 *    milestoneIndex?: number   (default 0)
 *    raisedBy:        string   (wallet address, required)
 *    reason:          string   (required)
 *  }
 *
 * Response: 201 { dispute }
 */
exports.createDispute = async (req, res, next) => {
  try {
    const { jobId, milestoneIndex = 0, raisedBy, reason } = req.body;

    // ── Validation ──────────────────────────────────────────
    if (!jobId || isNaN(Number(jobId))) {
      const err = new Error('jobId is required and must be a number'); err.statusCode = 400; return next(err);
    }
    if (!raisedBy) {
      const err = new Error('raisedBy (wallet address) is required'); err.statusCode = 400; return next(err);
    }
    if (!reason || !reason.trim()) {
      const err = new Error('reason is required'); err.statusCode = 400; return next(err);
    }

    // ── Verify job exists ───────────────────────────────────
    const job = await jobQueries.getJobById(Number(jobId));
    if (!job) {
      const err = new Error(`Job with id ${jobId} not found`); err.statusCode = 404; return next(err);
    }

    // ── Verify caller is a party to the job ────────────────
    const caller = raisedBy.toLowerCase();
    const isParty = (
      caller === job.client_wallet.toLowerCase() ||
      (job.freelancer_wallet && caller === job.freelancer_wallet.toLowerCase())
    );
    if (!isParty) {
      const err = new Error('Only the client or freelancer of this job can raise a dispute');
      err.statusCode = 403;
      return next(err);
    }

    // ── Ensure wallet row exists ────────────────────────────
    await walletQueries.upsertWallet(raisedBy);

    // ── Insert dispute ──────────────────────────────────────
    const dispute = await disputeQueries.createDispute({
      jobId:          Number(jobId),
      milestoneIndex: Number(milestoneIndex),
      raisedBy,
      reason:         reason.trim(),
    });

    // ── Update job status ───────────────────────────────────
    await jobQueries.updateJobStatus(Number(jobId), 'Disputed');

    return res.status(201).json({ dispute: formatDispute(dispute) });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────
//  GET /api/dispute/:id
// ─────────────────────────────────────────────────────────────

/**
 * getDispute — get a dispute by its DB id.
 *
 * Params: id (number, DB disputes.id)
 *
 * Response: 200 { dispute } | 404 if not found
 */
exports.getDispute = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      const err = new Error('Invalid dispute id'); err.statusCode = 400; return next(err);
    }

    const dispute = await disputeQueries.getDisputeById(id);
    if (!dispute) {
      const err = new Error('Dispute not found'); err.statusCode = 404; return next(err);
    }

    return res.json({ dispute: formatDispute(dispute) });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────
//  GET /api/dispute/job/:jobId
// ─────────────────────────────────────────────────────────────

/**
 * getDisputesByJob — get all disputes for a job.
 *
 * Params: jobId (DB jobs.id)
 *
 * Response: 200 { disputes: [...] }
 */
exports.getDisputesByJob = async (req, res, next) => {
  try {
    const jobId = parseInt(req.params.jobId, 10);
    if (isNaN(jobId)) {
      const err = new Error('Invalid jobId'); err.statusCode = 400; return next(err);
    }

    const disputes = await disputeQueries.getDisputesByJobId(jobId);
    return res.json({ disputes: disputes.map(formatDispute) });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────
//  Helpers
// ─────────────────────────────────────────────────────────────

function formatDispute(d) {
  return {
    id:                    d.id,
    jobId:                 d.job_id,
    milestoneIndex:        d.milestone_index,
    raisedBy:              d.raised_by,
    reason:                d.reason,
    status:                d.status,
    aiVerdict:             d.ai_verdict,
    clientProposalBps:     d.client_proposal_bps,
    freelancerProposalBps: d.freelancer_proposal_bps,
    resolvedAt:            d.resolved_at,
    createdAt:             d.created_at,
  };
}
