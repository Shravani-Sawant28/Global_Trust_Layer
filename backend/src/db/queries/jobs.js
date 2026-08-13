'use strict';

/**
 * db/queries/jobs.js
 *
 * All SQL operations against the `jobs` table.
 */

const { pool } = require('../../config/db');

/**
 * Insert a new job record.
 *
 * @param {object} data
 * @param {string} data.clientWallet
 * @param {string} [data.freelancerWallet]
 * @param {string} data.title
 * @param {string} [data.description]
 * @param {string} data.budgetRaw       - raw amount string (e.g. "1000000" for 1 USDC)
 * @param {string} [data.currency]      - 'USDC' | 'ETH'
 * @param {string} [data.deadline]      - ISO date string
 * @param {string} [data.category]
 * @param {boolean} [data.isPublic]
 * @returns {Promise<object>} inserted job row
 */
async function createJob(data) {
  const {
    clientWallet,
    freelancerWallet = null,
    title,
    description = null,
    budgetRaw,
    currency = 'USDC',
    deadline = null,
    category = null,
    isPublic = true,
  } = data;

  const { rows } = await pool.query(
    `INSERT INTO jobs
       (client_wallet, freelancer_wallet, title, description,
        budget_raw, currency, deadline, category, is_public)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
     RETURNING *`,
    [
      clientWallet.toLowerCase(),
      freelancerWallet ? freelancerWallet.toLowerCase() : null,
      title,
      description,
      budgetRaw,
      currency,
      deadline,
      category,
      isPublic,
    ]
  );
  return rows[0];
}

/**
 * Get a single job by its DB primary key.
 *
 * @param {number} id
 * @returns {Promise<object|null>}
 */
async function getJobById(id) {
  const { rows } = await pool.query(
    'SELECT * FROM jobs WHERE id = $1',
    [id]
  );
  return rows[0] || null;
}

/**
 * Get a single job by its on-chain job ID (EscrowFactory.jobs mapping key).
 *
 * @param {number} onChainJobId
 * @returns {Promise<object|null>}
 */
async function getJobByOnChainId(onChainJobId) {
  const { rows } = await pool.query(
    'SELECT * FROM jobs WHERE on_chain_job_id = $1',
    [onChainJobId]
  );
  return rows[0] || null;
}

/**
 * Get all jobs associated with a wallet (as client or freelancer).
 *
 * @param {string} wallet
 * @returns {Promise<object[]>}
 */
async function getJobsByWallet(wallet) {
  const addr = wallet.toLowerCase();
  const { rows } = await pool.query(
    `SELECT * FROM jobs
     WHERE client_wallet = $1 OR freelancer_wallet = $1
     ORDER BY created_at DESC`,
    [addr]
  );
  return rows;
}

/**
 * Get all public open jobs for the Browse Jobs page.
 * "Open" = status is 'Funded' AND no freelancer assigned yet.
 *
 * @param {object} [filters]
 * @param {string} [filters.category]
 * @param {string} [filters.currency]
 * @param {string} [filters.search]   - searches title + description
 * @returns {Promise<object[]>}
 */
async function getOpenJobs(filters = {}) {
  const conditions = [
    "status = 'Funded'",
    'is_public = TRUE',
    'freelancer_wallet IS NULL',
  ];
  const params = [];

  if (filters.category) {
    params.push(filters.category);
    conditions.push(`category = $${params.length}`);
  }

  if (filters.currency) {
    params.push(filters.currency);
    conditions.push(`currency = $${params.length}`);
  }

  if (filters.search) {
    params.push(`%${filters.search}%`);
    conditions.push(
      `(title ILIKE $${params.length} OR description ILIKE $${params.length})`
    );
  }

  const where = conditions.join(' AND ');
  const { rows } = await pool.query(
    `SELECT * FROM jobs WHERE ${where} ORDER BY created_at DESC`,
    params
  );
  return rows;
}

/**
 * Update a job's status.
 *
 * @param {number} id
 * @param {string} status
 * @returns {Promise<void>}
 */
async function updateJobStatus(id, status) {
  await pool.query(
    `UPDATE jobs SET status = $2, updated_at = NOW() WHERE id = $1`,
    [id, status]
  );
}

/**
 * Store the on-chain job ID after a JobCreated event is received.
 *
 * @param {number} dbId        - jobs.id
 * @param {number} onChainId   - EscrowFactory jobCounter value
 * @returns {Promise<void>}
 */
async function updateJobOnChainId(dbId, onChainId) {
  await pool.query(
    `UPDATE jobs SET on_chain_job_id = $2, updated_at = NOW() WHERE id = $1`,
    [dbId, onChainId]
  );
}

/**
 * Assign a freelancer to an open job (public listing accepted).
 *
 * @param {number} id
 * @param {string} freelancerWallet
 * @returns {Promise<void>}
 */
async function assignFreelancer(id, freelancerWallet) {
  await pool.query(
    `UPDATE jobs
     SET freelancer_wallet = $2, is_public = FALSE, updated_at = NOW()
     WHERE id = $1`,
    [id, freelancerWallet.toLowerCase()]
  );
}

/**
 * Update the freelancer for a job (called by blockchain event listener).
 * Used when JobAccepted event is received.
 *
 * @param {number} id
 * @param {string} freelancerWallet
 * @returns {Promise<void>}
 */
async function updateJobFreelancer(id, freelancerWallet) {
  await pool.query(
    `UPDATE jobs
     SET freelancer_wallet = $2, updated_at = NOW()
     WHERE id = $1`,
    [id, freelancerWallet.toLowerCase()]
  );
}

module.exports = {
  createJob,
  getJobById,
  getJobByOnChainId,
  getJobsByWallet,
  getOpenJobs,
  updateJobStatus,
  updateJobOnChainId,
  assignFreelancer,
  updateJobFreelancer,
};
