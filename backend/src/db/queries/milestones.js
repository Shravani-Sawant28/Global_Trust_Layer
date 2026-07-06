'use strict';

/**
 * db/queries/milestones.js
 *
 * All SQL operations against the `milestones` table.
 *
 * on_chain_index mirrors the Milestone[] array index from the
 * EscrowFactory.Job struct. Used when syncing MilestoneDelivered
 * and MilestoneReleased on-chain events.
 */

const { pool } = require('../../config/db');

/**
 * Bulk-insert milestones for a job.
 *
 * @param {number} jobId
 * @param {Array<{title: string, amountRaw: string}>} milestonesArray
 * @returns {Promise<object[]>} inserted milestone rows
 */
async function createMilestones(jobId, milestonesArray) {
  if (!milestonesArray || milestonesArray.length === 0) return [];

  const values = milestonesArray.map((m, i) => `($1, $${i * 2 + 2}, $${i * 2 + 3}, 'PENDING')`).join(', ');
  const flat   = [jobId];

  milestonesArray.forEach((m, i) => {
    flat.push(i);               // on_chain_index
    flat.push(m.amountRaw);     // amount_raw
  });

  // Titles are stored separately — update after initial insert
  const { rows } = await pool.query(
    `INSERT INTO milestones (job_id, on_chain_index, amount_raw, status)
     VALUES ${values}
     RETURNING *`,
    flat
  );

  // Update titles in a second pass (avoids complex parameterisation)
  for (let i = 0; i < rows.length; i++) {
    if (milestonesArray[i].title) {
      await pool.query(
        'UPDATE milestones SET title = $1 WHERE id = $2',
        [milestonesArray[i].title, rows[i].id]
      );
      rows[i].title = milestonesArray[i].title;
    }
  }

  return rows;
}

/**
 * Get all milestones for a job.
 *
 * @param {number} jobId
 * @returns {Promise<object[]>}
 */
async function getMilestonesByJobId(jobId) {
  const { rows } = await pool.query(
    'SELECT * FROM milestones WHERE job_id = $1 ORDER BY on_chain_index ASC',
    [jobId]
  );
  return rows;
}

/**
 * Update a milestone's status and optionally its IPFS delivery hash.
 *
 * @param {number} jobId
 * @param {number} onChainIndex
 * @param {string} status       - 'PENDING' | 'SUBMITTED' | 'APPROVED' | 'DISPUTED'
 * @param {string} [ipfsHash]
 * @returns {Promise<void>}
 */
async function updateMilestoneStatus(jobId, onChainIndex, status, ipfsHash) {
  if (ipfsHash) {
    await pool.query(
      `UPDATE milestones
       SET status = $3, ipfs_hash = $4, delivered_at = NOW()
       WHERE job_id = $1 AND on_chain_index = $2`,
      [jobId, onChainIndex, status, ipfsHash]
    );
  } else {
    await pool.query(
      `UPDATE milestones
       SET status = $3
       WHERE job_id = $1 AND on_chain_index = $2`,
      [jobId, onChainIndex, status]
    );
  }
}

module.exports = { createMilestones, getMilestonesByJobId, updateMilestoneStatus };
