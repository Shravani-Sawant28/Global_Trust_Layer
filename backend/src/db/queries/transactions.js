'use strict';

/**
 * db/queries/transactions.js
 *
 * Immutable audit log for every on-chain transaction event
 * that the blockchain listener processes.
 */

const { pool } = require('../../config/db');

/**
 * Insert a transaction audit record.
 *
 * @param {object} data
 * @param {number} [data.jobId]
 * @param {string} data.txHash
 * @param {string} data.type         - e.g. 'JobCreated', 'MilestoneReleased', 'DisputeRaised'
 * @param {string} [data.fromWallet]
 * @param {string} [data.amountRaw]
 * @param {number|bigint} [data.blockNumber]
 * @returns {Promise<object>} inserted row
 */
async function logTransaction(data) {
  const { jobId = null, txHash, type, fromWallet = null, amountRaw = null, blockNumber = null } = data;

  const { rows } = await pool.query(
    `INSERT INTO transactions (job_id, tx_hash, type, from_wallet, amount_raw, block_number)
     VALUES ($1, $2, $3, $4, $5, $6)
     ON CONFLICT (tx_hash) DO NOTHING
     RETURNING *`,
    [
      jobId,
      txHash,
      type,
      fromWallet ? fromWallet.toLowerCase() : null,
      amountRaw ? String(amountRaw) : null,
      blockNumber ? Number(blockNumber) : null,
    ]
  );
  return rows[0] || null;
}

/**
 * Get the transaction log for a job.
 *
 * @param {number} jobId
 * @returns {Promise<object[]>}
 */
async function getTransactionsByJobId(jobId) {
  const { rows } = await pool.query(
    'SELECT * FROM transactions WHERE job_id = $1 ORDER BY created_at ASC',
    [jobId]
  );
  return rows;
}

module.exports = { logTransaction, getTransactionsByJobId };
