'use strict';

/**
 * services/blockchain.js
 *
 * Read-only blockchain interactions via ethers.js.
 *
 * All functions call contract view functions directly from the
 * EscrowFactory and ReputationRegistry contracts.
 *
 * Function names and parameters match exactly what is defined
 * in the Solidity source:
 *  - EscrowFactory:     getJob(), getMilestone(), getMilestoneCount(),
 *                       getClientJobs(), getFreelancerJobs()
 *  - ReputationRegistry: getPassport(), getTrustScore(),
 *                         getJobHistory(), isNewWallet()
 */

const { escrowContract, reputationContract, isContractReady } = require('../config/contract');

// ─── JobStatus enum from EscrowFactory.sol ─────────────────
// enum JobStatus { CREATED, FUNDED, IN_PROGRESS, COMPLETED, CANCELLED }
const JOB_STATUS_LABELS = ['CREATED', 'FUNDED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'];

// ─── DisputeStatus enum from EscrowFactory.sol ─────────────
// enum DisputeStatus { NONE, DISPUTED, RESOLVED }
const DISPUTE_STATUS_LABELS = ['NONE', 'DISPUTED', 'RESOLVED'];

/**
 * Helper: throw a clear error when contracts aren't deployed yet.
 */
function requireReady() {
  if (!isContractReady) {
    const err = new Error('Smart contracts not configured. Set ESCROW_FACTORY_ADDRESS and REPUTATION_REGISTRY_ADDRESS in .env');
    err.statusCode = 503;
    throw err;
  }
}

/**
 * Fetch a job from EscrowFactory.getJob(jobId).
 *
 * Returns: { id, client, freelancer, totalAmount, releasedAmount,
 *            status, statusLabel, title, createdAt, deadline }
 *
 * @param {number|bigint} jobId
 * @returns {Promise<object>}
 */
async function getJobFromChain(jobId) {
  requireReady();

  const result = await escrowContract.getJob(BigInt(jobId));

  // getJob returns a tuple — destructure by position as per Solidity return order:
  // (uint256 id, address client, address freelancer, uint256 totalAmount,
  //  uint256 releasedAmount, JobStatus status, string title, uint256 createdAt, uint256 deadline)
  const [
    id,
    client,
    freelancer,
    totalAmount,
    releasedAmount,
    status,
    title,
    createdAt,
    deadline,
  ] = result;

  return {
    id:             Number(id),
    client:         client.toLowerCase(),
    freelancer:     freelancer.toLowerCase(),
    totalAmount:    totalAmount.toString(),
    releasedAmount: releasedAmount.toString(),
    status:         Number(status),
    statusLabel:    JOB_STATUS_LABELS[Number(status)] || 'UNKNOWN',
    title,
    createdAt:      Number(createdAt),
    deadline:       Number(deadline),
  };
}

/**
 * Fetch a single milestone from EscrowFactory.getMilestone(jobId, milestoneIndex).
 *
 * Milestone struct fields (from Solidity):
 *  description, amount, delivered, released, late, ipfsHash,
 *  deliveredAt, disputeDeadline, disputeStatus, disputeReason,
 *  clientProposalBps, freelancerProposalBps
 *
 * @param {number|bigint} jobId
 * @param {number|bigint} milestoneIndex
 * @returns {Promise<object>}
 */
async function getMilestoneFromChain(jobId, milestoneIndex) {
  requireReady();

  const m = await escrowContract.getMilestone(BigInt(jobId), BigInt(milestoneIndex));

  return {
    description:          m.description,
    amount:               m.amount.toString(),
    delivered:            m.delivered,
    released:             m.released,
    late:                 m.late,
    ipfsHash:             m.ipfsHash,
    deliveredAt:          Number(m.deliveredAt),
    disputeDeadline:      Number(m.disputeDeadline),
    disputeStatus:        Number(m.disputeStatus),
    disputeStatusLabel:   DISPUTE_STATUS_LABELS[Number(m.disputeStatus)] || 'NONE',
    disputeReason:        m.disputeReason,
    clientProposalBps:    m.clientProposalBps.toString(),
    freelancerProposalBps: m.freelancerProposalBps.toString(),
  };
}

/**
 * Fetch the count of milestones for a job.
 * Calls EscrowFactory.getMilestoneCount(jobId).
 *
 * @param {number|bigint} jobId
 * @returns {Promise<number>}
 */
async function getMilestoneCount(jobId) {
  requireReady();
  const count = await escrowContract.getMilestoneCount(BigInt(jobId));
  return Number(count);
}

/**
 * Fetch all milestone indices for a job and return full milestone data.
 * Iterates getMilestoneCount → getMilestone for each index.
 *
 * @param {number|bigint} jobId
 * @returns {Promise<object[]>}
 */
async function getAllMilestonesFromChain(jobId) {
  requireReady();
  const count = await getMilestoneCount(jobId);
  const promises = [];
  for (let i = 0; i < count; i++) {
    promises.push(getMilestoneFromChain(jobId, i));
  }
  return Promise.all(promises);
}

/**
 * Fetch the TrustPassport for a wallet from ReputationRegistry.getPassport(wallet).
 *
 * TrustPassport struct (from Solidity):
 *  wallet, trustScore, totalJobs, completedJobs, disputesInvolved,
 *  disputesLost, lateDeliveries, ghostingCount, totalVolume,
 *  memberSince, lastUpdated
 *
 * @param {string} wallet - Ethereum address
 * @returns {Promise<object>}
 */
async function getPassportFromChain(wallet) {
  requireReady();

  const p = await reputationContract.getPassport(wallet);

  return {
    wallet:           p.wallet.toLowerCase(),
    trustScore:       Number(p.trustScore),
    totalJobs:        Number(p.totalJobs),
    completedJobs:    Number(p.completedJobs),
    disputesInvolved: Number(p.disputesInvolved),
    disputesLost:     Number(p.disputesLost),
    lateDeliveries:   Number(p.lateDeliveries),
    ghostingCount:    Number(p.ghostingCount),
    totalVolume:      p.totalVolume.toString(),
    memberSince:      Number(p.memberSince),
    lastUpdated:      Number(p.lastUpdated),
  };
}

/**
 * Get only the trust score from ReputationRegistry.getTrustScore(wallet).
 *
 * @param {string} wallet
 * @returns {Promise<number>}
 */
async function getTrustScoreFromChain(wallet) {
  requireReady();
  const score = await reputationContract.getTrustScore(wallet);
  return Number(score);
}

/**
 * Get on-chain job ID history for a wallet from ReputationRegistry.getJobHistory(wallet).
 *
 * @param {string} wallet
 * @returns {Promise<number[]>}
 */
async function getJobHistoryFromChain(wallet) {
  requireReady();
  const ids = await reputationContract.getJobHistory(wallet);
  return ids.map(Number);
}

/**
 * Get list of job IDs where wallet is the client.
 * Calls EscrowFactory.getClientJobs(client).
 *
 * @param {string} wallet
 * @returns {Promise<number[]>}
 */
async function getClientJobsFromChain(wallet) {
  requireReady();
  const ids = await escrowContract.getClientJobs(wallet);
  return ids.map(Number);
}

/**
 * Get list of job IDs where wallet is the freelancer.
 * Calls EscrowFactory.getFreelancerJobs(freelancer).
 *
 * @param {string} wallet
 * @returns {Promise<number[]>}
 */
async function getFreelancerJobsFromChain(wallet) {
  requireReady();
  const ids = await escrowContract.getFreelancerJobs(wallet);
  return ids.map(Number);
}

/**
 * Check if a wallet is brand new (no passport yet).
 * Calls ReputationRegistry.isNewWallet(wallet).
 *
 * @param {string} wallet
 * @returns {Promise<boolean>}
 */
async function isNewWallet(wallet) {
  requireReady();
  return reputationContract.isNewWallet(wallet);
}

module.exports = {
  getJobFromChain,
  getMilestoneFromChain,
  getMilestoneCount,
  getAllMilestonesFromChain,
  getPassportFromChain,
  getTrustScoreFromChain,
  getJobHistoryFromChain,
  getClientJobsFromChain,
  getFreelancerJobsFromChain,
  isNewWallet,
  JOB_STATUS_LABELS,
  DISPUTE_STATUS_LABELS,
};
