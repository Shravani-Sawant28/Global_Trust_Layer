'use strict';

/**
 * services/blockchain.js
 *
 * Read-only blockchain interactions via ethers.js.
 *
 * All functions call contract view functions directly from the
 * EscrowStylus (Arbitrum Stylus) and ReputationRegistry contracts.
 *
 * Function names and parameters match exactly what is defined
 * in the Rust source:
 *  - EscrowStylus:     getJobBasic(), getMilestone(), getJobCount()
 *  - ReputationRegistry: getPassport(), getTrustScore(),
 *                         getJobHistory(), isNewWallet()
 */

const contractConfig = require('../config/contract');

// ─── JobStatus enum from Stylus contract ──────────────────
// enum JobStatus { Created = 0, Funded = 1, InProgress = 2, Completed = 3, Cancelled = 4 }
const JOB_STATUS_LABELS = ['Created', 'Funded', 'InProgress', 'Completed', 'Cancelled'];

// ─── DisputeStage enum from Stylus contract ───────────────
// enum DisputeStage { MutualSettlement, AiProposed, JurorVoting, ResolvedMutual, ResolvedAi, ResolvedJury, ResolvedTimeout }
const DISPUTE_STAGE_LABELS = ['MutualSettlement', 'AiProposed', 'JurorVoting', 'ResolvedMutual', 'ResolvedAi', 'ResolvedJury', 'ResolvedTimeout'];

/**
 * Helper: throw a clear error when contracts aren't deployed yet.
 */
function requireReady() {
  if (!contractConfig.isContractReady) {
    const err = new Error('Smart contracts not configured. Set ESCROW_FACTORY_ADDRESS and REPUTATION_REGISTRY_ADDRESS in .env');
    err.statusCode = 503;
    throw err;
  }
}

/**
 * Fetch a job from EscrowStylus.getJobBasic(jobId).
 *
 * Returns: { id, client, freelancer, title, totalAmount, releasedAmount,
 *            status, statusLabel, createdAt, deadline, milestoneCount }
 *
 * @param {number|bigint} jobId
 * @returns {Promise<object>}
 */
async function getJobFromChain(jobId) {
  requireReady();

  const result = await contractConfig.escrowContract.getJobBasic(BigInt(jobId));

  // getJobBasic returns a tuple in this order (from Stylus contract):
  // (address client, address freelancer, string title, uint256 total_amount,
  //  uint256 released_amount, uint8 status, uint64 created_at, uint64 deadline, uint64 milestone_count)
  const [
    client,
    freelancer,
    title,
    totalAmount,
    releasedAmount,
    status,
    createdAt,
    deadline,
    milestoneCount,
  ] = result;

  return {
    id:               Number(jobId),
    client:           client.toLowerCase(),
    freelancer:       freelancer.toLowerCase(),
    title,
    totalAmount:      totalAmount.toString(),
    releasedAmount:   releasedAmount.toString(),
    status:           Number(status),
    statusLabel:      JOB_STATUS_LABELS[Number(status)] || 'Unknown',
    createdAt:        Number(createdAt),
    deadline:         Number(deadline),
    milestoneCount:   Number(milestoneCount),
  };
}

/**
 * Fetch a single milestone from EscrowStylus.getMilestone(jobId, milestoneId).
 *
 * Milestone struct fields (from Rust):
 *  description, amount, funded, delivered, released, disputed, dispute_id,
 *  delivery_hash, delivered_at, dispute_deadline
 *
 * @param {number|bigint} jobId
 * @param {number|bigint} milestoneId
 * @returns {Promise<object>}
 */
async function getMilestoneFromChain(jobId, milestoneId) {
  requireReady();

  const m = await contractConfig.escrowContract.getMilestone(BigInt(jobId), BigInt(milestoneId));

  // getMilestone returns a tuple in this order:
  // (string description, uint256 amount, bool funded, bool delivered, bool released,
  //  bool disputed, uint256 dispute_id, bytes32 delivery_hash, uint64 delivered_at,
  //  uint64 dispute_deadline)
  const [
    description,
    amount,
    funded,
    delivered,
    released,
    disputed,
    disputeId,
    deliveryHash,
    deliveredAt,
    disputeDeadline,
  ] = m;

  return {
    description,
    amount:           amount.toString(),
    funded,
    delivered,
    released,
    disputed,
    disputeId:        Number(disputeId),
    deliveryHash,
    deliveredAt:      Number(deliveredAt),
    disputeDeadline:  Number(disputeDeadline),
  };
}

/**
 * Fetch all milestones for a job.
 * Uses the milestone_count from getJobBasic → calls getMilestone for each index.
 *
 * @param {number|bigint} jobId
 * @returns {Promise<object[]>}
 */
async function getAllMilestonesFromChain(jobId) {
  requireReady();
  
  const jobData = await getJobFromChain(jobId);
  const count = jobData.milestoneCount;
  
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
  const ids = await contractConfig.escrowContract.getClientJobs(wallet);
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
  const ids = await contractConfig.escrowContract.getFreelancerJobs(wallet);
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
  getAllMilestonesFromChain,
  getPassportFromChain,
  getTrustScoreFromChain,
  getJobHistoryFromChain,
  isNewWallet,
  JOB_STATUS_LABELS,
  DISPUTE_STAGE_LABELS,
};
