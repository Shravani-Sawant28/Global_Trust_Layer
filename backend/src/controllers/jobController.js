'use strict';

/**
 * controllers/jobController.js
 *
 * Business logic for job endpoints.
 *
 * Endpoints:
 *  POST /api/jobs           → createJob
 *  GET  /api/jobs/open      → getOpenJobs
 *  GET  /api/jobs           → getJobs    (wallet filter)
 *  GET  /api/jobs/:id       → getJobById
 */

const jobQueries       = require('../db/queries/jobs');
const milestoneQueries = require('../db/queries/milestones');
const walletQueries    = require('../db/queries/wallets');
const blockchainSvc    = require('../services/blockchain');

// ─── JobStatus label mapping (matches on-chain enum indices) ──
// 0=CREATED, 1=FUNDED, 2=IN_PROGRESS, 3=COMPLETED, 4=CANCELLED
// We expose human-readable labels to the frontend
const ON_CHAIN_STATUS_TO_LABEL = {
  0: 'Created',
  1: 'Funded',
  2: 'In Progress',
  3: 'Complete',
  4: 'Cancelled',
};

/**
 * Enrich a DB job with live on-chain data when available.
 * Falls back to DB values silently if contract is not deployed.
 *
 * @param {object} job  - DB job row
 * @returns {Promise<object>} enriched job
 */
async function enrichJobWithChainData(job) {
  if (!job.on_chain_job_id) return job;

  try {
    const chainData = await blockchainSvc.getJobFromChain(job.on_chain_job_id);
    return {
      ...job,
      // Override status with live on-chain value
      status:         ON_CHAIN_STATUS_TO_LABEL[chainData.status] || job.status,
      totalAmount:    chainData.totalAmount,
      releasedAmount: chainData.releasedAmount,
      deadline:       chainData.deadline ? new Date(chainData.deadline * 1000).toISOString() : job.deadline,
    };
  } catch {
    // Contract not deployed or unreachable — use DB values
    return job;
  }
}

/**
 * Format a DB job row for the frontend (camelCase, computed fields).
 *
 * @param {object} row
 * @param {object[]} [milestones]
 * @returns {object}
 */
function formatJob(row, milestones = []) {
  return {
    id:               row.id,
    onChainJobId:     row.on_chain_job_id,
    clientWallet:     row.client_wallet,
    freelancerWallet: row.freelancer_wallet,
    title:            row.title,
    description:      row.description,
    budget:           row.budget_raw,
    currency:         row.currency,
    deadline:         row.deadline,
    status:           row.status,
    category:         row.category,
    isPublic:         row.is_public,
    createdAt:        row.created_at,
    updatedAt:        row.updated_at,
    // Chain-enriched fields (present when on_chain_job_id is set)
    totalAmount:      row.totalAmount    || null,
    releasedAmount:   row.releasedAmount || null,
    milestones:       milestones.map(formatMilestone),
  };
}

function formatMilestone(m) {
  return {
    id:            m.id,
    onChainIndex:  m.on_chain_index,
    title:         m.title,
    amount:        m.amount_raw,
    status:        m.status,
    ipfsHash:      m.ipfs_hash,
    deliveredAt:   m.delivered_at,
    createdAt:     m.created_at,
  };
}

// ─────────────────────────────────────────────────────────────
//  POST /api/jobs
// ─────────────────────────────────────────────────────────────

/**
 * createJob — store off-chain job metadata.
 *
 * Request body:
 *  {
 *    clientWallet:      string   (required, validated by middleware)
 *    freelancerWallet?: string
 *    title:             string   (required)
 *    description?:      string
 *    budget:            string   (required, raw amount)
 *    currency?:         'USDC' | 'ETH'
 *    deadline?:         ISO date string
 *    category?:         string
 *    isPublic?:         boolean
 *    milestones?:       Array<{ title: string, amountRaw: string }>
 *  }
 *
 * Response: 201 { job, milestones }
 */
exports.createJob = async (req, res, next) => {
  try {
    const {
      clientWallet,
      freelancerWallet,
      title,
      description,
      budget,
      currency = 'USDC',
      deadline,
      category,
      isPublic = true,
      milestones: milestonesInput = [],
    } = req.body;

    // ── Validation ──────────────────────────────────────────
    if (!title || !title.trim()) {
      const err = new Error('title is required'); err.statusCode = 400; return next(err);
    }
    if (!budget) {
      const err = new Error('budget is required'); err.statusCode = 400; return next(err);
    }

    // ── Ensure wallet rows exist ────────────────────────────
    await walletQueries.upsertWallet(clientWallet);
    if (freelancerWallet) {
      await walletQueries.upsertWallet(freelancerWallet);
    }

    // ── Insert job ──────────────────────────────────────────
    const job = await jobQueries.createJob({
      clientWallet,
      freelancerWallet: freelancerWallet || null,
      title:    title.trim(),
      description,
      budgetRaw: String(budget),
      currency,
      deadline:  deadline || null,
      category,
      isPublic:  isPublic !== false,
    });

    // ── Insert milestones ───────────────────────────────────
    let milestones = [];
    if (Array.isArray(milestonesInput) && milestonesInput.length > 0) {
      const formatted = milestonesInput.map((m) => ({
        title:     m.title || '',
        amountRaw: String(m.amountRaw || m.amount || '0'),
      }));
      milestones = await milestoneQueries.createMilestones(job.id, formatted);
    }

    return res.status(201).json({
      job:        formatJob(job, milestones),
      milestones: milestones.map(formatMilestone),
    });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────
//  GET /api/jobs/open
// ─────────────────────────────────────────────────────────────

/**
 * getOpenJobs — returns public funded jobs for the Browse Jobs page.
 *
 * Query params:
 *  category? : string
 *  currency? : 'ETH' | 'USDC'
 *  search?   : string (title/description search)
 *
 * Response: 200 { jobs: [...] }
 */
exports.getOpenJobs = async (req, res, next) => {
  try {
    const { category, currency, search } = req.query;
    const rows = await jobQueries.getOpenJobs({ category, currency, search });
    return res.json({ jobs: rows.map((r) => formatJob(r)) });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────
//  GET /api/jobs?wallet=0x...
// ─────────────────────────────────────────────────────────────

/**
 * getJobs — returns all jobs for a wallet (client + freelancer roles).
 *
 * Query params:
 *  wallet: string (required, Ethereum address)
 *
 * Response: 200 { jobs: [...] }
 */
exports.getJobs = async (req, res, next) => {
  try {
    const { wallet } = req.query;
    if (!wallet) {
      const err = new Error('wallet query parameter is required'); err.statusCode = 400; return next(err);
    }
    const ETH_REGEX = /^0x[0-9a-fA-F]{40}$/;
    if (!ETH_REGEX.test(wallet)) {
      const err = new Error('Invalid wallet address in query parameter'); err.statusCode = 400; return next(err);
    }

    const rows = await jobQueries.getJobsByWallet(wallet.toLowerCase());
    return res.json({ jobs: rows.map((r) => formatJob(r)) });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────
//  GET /api/jobs/:id
// ─────────────────────────────────────────────────────────────

/**
 * getJobById — returns a single job with its milestones.
 * Enriches with live on-chain data when the contract is available.
 *
 * Params: id (DB primary key)
 *
 * Response: 200 { job } | 404 if not found
 */
exports.getJobById = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      const err = new Error('Invalid job id'); err.statusCode = 400; return next(err);
    }

    let job = await jobQueries.getJobById(id);
    if (!job) {
      const err = new Error('Job not found'); err.statusCode = 404; return next(err);
    }

    // Enrich with live chain state
    job = await enrichJobWithChainData(job);

    // Fetch milestones
    const milestones = await milestoneQueries.getMilestonesByJobId(id);

    return res.json({ job: formatJob(job, milestones) });
  } catch (err) {
    next(err);
  }
};
