'use strict';

/**
 * db/queries/disputes.js
 *
 * All SQL operations against the `disputes` table.
 */

const { pool } = require('../../config/db');

/**
 * Insert a new dispute record.
 *
 * @param {object} data
 * @param {number} data.jobId
 * @param {number} [data.milestoneIndex]
 * @param {string} data.raisedBy       - wallet address
 * @param {string} data.reason
 * @returns {Promise<object>} inserted dispute row
 */
async function createDispute(data) {
  const { jobId, milestoneIndex = 0, raisedBy, reason } = data;

  const { rows } = await pool.query(
    `INSERT INTO disputes (job_id, milestone_index, raised_by, reason)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [jobId, milestoneIndex, raisedBy.toLowerCase(), reason]
  );
  return rows[0];
}

/**
 * Get all disputes for a job.
 *
 * @param {number} jobId
 * @returns {Promise<object[]>}
 */
async function getDisputesByJobId(jobId) {
  const { rows } = await pool.query(
    'SELECT * FROM disputes WHERE job_id = $1 ORDER BY created_at DESC',
    [jobId]
  );
  return rows;
}

/**
 * Get a single dispute by its primary key.
 *
 * @param {number} id
 * @returns {Promise<object|null>}
 */
async function getDisputeById(id) {
  const { rows } = await pool.query(
    'SELECT * FROM disputes WHERE id = $1',
    [id]
  );
  return rows[0] || null;
}

/**
 * Update dispute status and optional AI verdict.
 *
 * @param {number} id
 * @param {string} status       - 'OPEN' | 'RESOLVED'
 * @param {string} [aiVerdict]
 * @returns {Promise<void>}
 */
async function updateDisputeStatus(id, status, aiVerdict) {
  if (aiVerdict) {
    await pool.query(
      `UPDATE disputes
       SET status = $2, ai_verdict = $3, resolved_at = NOW()
       WHERE id = $1`,
      [id, status, aiVerdict]
    );
  } else {
    await pool.query(
      `UPDATE disputes
       SET status = $2, resolved_at = NOW()
       WHERE id = $1`,
      [id, status]
    );
  }
}

/**
 * Record a split proposal from one party.
 *
 * @param {number} disputeId
 * @param {'client'|'freelancer'} party
 * @param {number} bps              - basis points
 * @returns {Promise<void>}
 */
async function recordSplitProposal(disputeId, party, bps) {
  const col = party === 'client' ? 'client_proposal_bps' : 'freelancer_proposal_bps';
  await pool.query(
    `UPDATE disputes SET ${col} = $2 WHERE id = $1`,
    [disputeId, bps]
  );
}

module.exports = {
  createDispute,
  getDisputesByJobId,
  getDisputeById,
  updateDisputeStatus,
  recordSplitProposal,
};
