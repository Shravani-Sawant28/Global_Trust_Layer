'use strict';

/**
 * services/listener.js
 *
 * Blockchain event listener — subscribes to EscrowFactory events
 * and keeps the PostgreSQL database in sync.
 *
 * Events handled (from EscrowFactory.sol):
 *  - JobCreated         → link on_chain_job_id to the DB job record
 *  - JobFunded          → update job status to 'Funded'
 *  - MilestoneDelivered → update milestone status to 'SUBMITTED'
 *  - MilestoneReleased  → update milestone to 'APPROVED', log tx
 *  - JobCompleted       → update job status to 'Complete'
 *  - ClientRefunded     → update job status to 'Refunded'
 *  - AutoReleased       → update milestone to 'APPROVED', log tx
 *  - DisputeRaised      → create or update dispute record
 *  - DisputeResolved    → resolve dispute, update milestone
 *
 * The listener is started from index.js after the DB is connected.
 * It is safe to call startListeners() even when contracts are not
 * configured — it will log a warning and return without throwing.
 */

const { escrowContract, isContractReady, provider } = require('../config/contract');
const jobQueries         = require('../db/queries/jobs');
const milestoneQueries   = require('../db/queries/milestones');
const disputeQueries     = require('../db/queries/disputes');
const transactionQueries = require('../db/queries/transactions');

// Re-connect interval on provider disconnect (30 seconds)
const RECONNECT_INTERVAL_MS = 30_000;

/**
 * Safely look up the DB job record by on-chain jobId.
 * Returns null if not found (e.g. job was created outside the backend).
 */
async function findDbJob(onChainJobId) {
  try {
    return await jobQueries.getJobByOnChainId(Number(onChainJobId));
  } catch {
    return null;
  }
}

/**
 * Register all contract event listeners.
 */
function registerListeners() {
  // ── JobCreated ──────────────────────────────────────────────────
  // event JobCreated(uint256 indexed jobId, address indexed client,
  //                  address indexed freelancer, uint256 totalAmount, string title)
  escrowContract.on('JobCreated', async (jobId, client, freelancer, totalAmount, title, event) => {
    const id   = Number(jobId);
    const txHash = event.log?.transactionHash || event.transactionHash;

    console.log(`[listener] JobCreated: on-chain jobId=${id} title="${title}"`);

    try {
      // Try to match by title + client in case the job was pre-created via POST /api/jobs
      // If no match, we can't link it — that's acceptable for blockchain-first flows
      const allClientJobs = await jobQueries.getJobsByWallet(client.toLowerCase());
      const matchingJob   = allClientJobs.find(
        (j) => j.title === title && j.on_chain_job_id == null
      );

      if (matchingJob) {
        await jobQueries.updateJobOnChainId(matchingJob.id, id);
        console.log(`[listener]   → Linked DB job #${matchingJob.id} to on-chain #${id}`);
      }

      if (txHash) {
        await transactionQueries.logTransaction({
          jobId:   matchingJob?.id || null,
          txHash,
          type:    'JobCreated',
          fromWallet: client.toLowerCase(),
          amountRaw: totalAmount.toString(),
          blockNumber: event.log?.blockNumber || event.blockNumber,
        });
      }
    } catch (err) {
      console.error('[listener] JobCreated handler error:', err.message);
    }
  });

  // ── JobFunded ───────────────────────────────────────────────────
  // event JobFunded(uint256 indexed jobId, uint256 amount, uint256 deadline)
  escrowContract.on('JobFunded', async (jobId, amount, deadline, event) => {
    const id = Number(jobId);
    console.log(`[listener] JobFunded: on-chain jobId=${id}`);

    try {
      const dbJob = await findDbJob(id);
      if (dbJob) {
        await jobQueries.updateJobStatus(dbJob.id, 'Funded');
      }
      const txHash = event.log?.transactionHash || event.transactionHash;
      if (txHash) {
        await transactionQueries.logTransaction({
          jobId:    dbJob?.id || null,
          txHash,
          type:     'JobFunded',
          amountRaw: amount.toString(),
          blockNumber: event.log?.blockNumber || event.blockNumber,
        });
      }
    } catch (err) {
      console.error('[listener] JobFunded handler error:', err.message);
    }
  });

  // ── MilestoneDelivered ──────────────────────────────────────────
  // event MilestoneDelivered(uint256 indexed jobId, uint256 milestoneIndex,
  //                           string ipfsHash, bool late)
  escrowContract.on('MilestoneDelivered', async (jobId, milestoneIndex, ipfsHash, late, event) => {
    const id  = Number(jobId);
    const idx = Number(milestoneIndex);
    console.log(`[listener] MilestoneDelivered: jobId=${id} milestone=${idx} late=${late}`);

    try {
      const dbJob = await findDbJob(id);
      if (dbJob) {
        await milestoneQueries.updateMilestoneStatus(dbJob.id, idx, 'SUBMITTED', ipfsHash || null);
        await jobQueries.updateJobStatus(dbJob.id, 'In Progress');
      }
      const txHash = event.log?.transactionHash || event.transactionHash;
      if (txHash) {
        await transactionQueries.logTransaction({
          jobId: dbJob?.id || null,
          txHash,
          type:  'MilestoneDelivered',
          blockNumber: event.log?.blockNumber || event.blockNumber,
        });
      }
    } catch (err) {
      console.error('[listener] MilestoneDelivered handler error:', err.message);
    }
  });

  // ── MilestoneReleased ───────────────────────────────────────────
  // event MilestoneReleased(uint256 indexed jobId, uint256 milestoneIndex,
  //                          uint256 amountToFreelancer, uint256 fee)
  escrowContract.on('MilestoneReleased', async (jobId, milestoneIndex, amountToFreelancer, fee, event) => {
    const id  = Number(jobId);
    const idx = Number(milestoneIndex);
    console.log(`[listener] MilestoneReleased: jobId=${id} milestone=${idx}`);

    try {
      const dbJob = await findDbJob(id);
      if (dbJob) {
        await milestoneQueries.updateMilestoneStatus(dbJob.id, idx, 'APPROVED');
      }
      const txHash = event.log?.transactionHash || event.transactionHash;
      if (txHash) {
        await transactionQueries.logTransaction({
          jobId:    dbJob?.id || null,
          txHash,
          type:     'MilestoneReleased',
          amountRaw: amountToFreelancer.toString(),
          blockNumber: event.log?.blockNumber || event.blockNumber,
        });
      }
    } catch (err) {
      console.error('[listener] MilestoneReleased handler error:', err.message);
    }
  });

  // ── JobCompleted ────────────────────────────────────────────────
  // event JobCompleted(uint256 indexed jobId)
  escrowContract.on('JobCompleted', async (jobId, event) => {
    const id = Number(jobId);
    console.log(`[listener] JobCompleted: jobId=${id}`);

    try {
      const dbJob = await findDbJob(id);
      if (dbJob) {
        await jobQueries.updateJobStatus(dbJob.id, 'Complete');
      }
      const txHash = event.log?.transactionHash || event.transactionHash;
      if (txHash) {
        await transactionQueries.logTransaction({
          jobId: dbJob?.id || null,
          txHash,
          type:  'JobCompleted',
          blockNumber: event.log?.blockNumber || event.blockNumber,
        });
      }
    } catch (err) {
      console.error('[listener] JobCompleted handler error:', err.message);
    }
  });

  // ── ClientRefunded ──────────────────────────────────────────────
  // event ClientRefunded(uint256 indexed jobId, uint256 milestoneIndex, uint256 amount)
  escrowContract.on('ClientRefunded', async (jobId, milestoneIndex, amount, event) => {
    const id  = Number(jobId);
    const idx = Number(milestoneIndex);
    console.log(`[listener] ClientRefunded: jobId=${id} milestone=${idx}`);

    try {
      const dbJob = await findDbJob(id);
      if (dbJob) {
        await milestoneQueries.updateMilestoneStatus(dbJob.id, idx, 'REFUNDED');
        await jobQueries.updateJobStatus(dbJob.id, 'Refunded');
      }
      const txHash = event.log?.transactionHash || event.transactionHash;
      if (txHash) {
        await transactionQueries.logTransaction({
          jobId:    dbJob?.id || null,
          txHash,
          type:     'ClientRefunded',
          amountRaw: amount.toString(),
          blockNumber: event.log?.blockNumber || event.blockNumber,
        });
      }
    } catch (err) {
      console.error('[listener] ClientRefunded handler error:', err.message);
    }
  });

  // ── AutoReleased ────────────────────────────────────────────────
  // event AutoReleased(uint256 indexed jobId, uint256 milestoneIndex, uint256 amount)
  escrowContract.on('AutoReleased', async (jobId, milestoneIndex, amount, event) => {
    const id  = Number(jobId);
    const idx = Number(milestoneIndex);
    console.log(`[listener] AutoReleased: jobId=${id} milestone=${idx}`);

    try {
      const dbJob = await findDbJob(id);
      if (dbJob) {
        await milestoneQueries.updateMilestoneStatus(dbJob.id, idx, 'APPROVED');
      }
      const txHash = event.log?.transactionHash || event.transactionHash;
      if (txHash) {
        await transactionQueries.logTransaction({
          jobId:    dbJob?.id || null,
          txHash,
          type:     'AutoReleased',
          amountRaw: amount.toString(),
          blockNumber: event.log?.blockNumber || event.blockNumber,
        });
      }
    } catch (err) {
      console.error('[listener] AutoReleased handler error:', err.message);
    }
  });

  // ── DisputeRaised ───────────────────────────────────────────────
  // event DisputeRaised(uint256 indexed jobId, uint256 milestoneIndex,
  //                      address raisedBy, string reason)
  escrowContract.on('DisputeRaised', async (jobId, milestoneIndex, raisedBy, reason, event) => {
    const id  = Number(jobId);
    const idx = Number(milestoneIndex);
    console.log(`[listener] DisputeRaised: jobId=${id} milestone=${idx} by=${raisedBy}`);

    try {
      const dbJob = await findDbJob(id);
      if (dbJob) {
        await jobQueries.updateJobStatus(dbJob.id, 'Disputed');
        // Upsert dispute record (may already exist from POST /api/dispute)
        const existing = await disputeQueries.getDisputesByJobId(dbJob.id);
        const openDispute = existing.find((d) => d.milestone_index === idx && d.status === 'OPEN');
        if (!openDispute) {
          await disputeQueries.createDispute({
            jobId:          dbJob.id,
            milestoneIndex: idx,
            raisedBy:       raisedBy.toLowerCase(),
            reason,
          });
        }
        await milestoneQueries.updateMilestoneStatus(dbJob.id, idx, 'DISPUTED');
      }
      const txHash = event.log?.transactionHash || event.transactionHash;
      if (txHash) {
        await transactionQueries.logTransaction({
          jobId: dbJob?.id || null,
          txHash,
          type:  'DisputeRaised',
          fromWallet: raisedBy.toLowerCase(),
          blockNumber: event.log?.blockNumber || event.blockNumber,
        });
      }
    } catch (err) {
      console.error('[listener] DisputeRaised handler error:', err.message);
    }
  });

  // ── DisputeResolved ─────────────────────────────────────────────
  // event DisputeResolved(uint256 indexed jobId, uint256 milestoneIndex,
  //                        uint256 clientBps, uint256 clientAmount, uint256 freelancerAmount)
  escrowContract.on('DisputeResolved', async (jobId, milestoneIndex, clientBps, clientAmount, freelancerAmount, event) => {
    const id  = Number(jobId);
    const idx = Number(milestoneIndex);
    console.log(`[listener] DisputeResolved: jobId=${id} milestone=${idx} clientBps=${clientBps}`);

    try {
      const dbJob = await findDbJob(id);
      if (dbJob) {
        await milestoneQueries.updateMilestoneStatus(dbJob.id, idx, 'RESOLVED');
        const disputes = await disputeQueries.getDisputesByJobId(dbJob.id);
        const openDispute = disputes.find((d) => d.milestone_index === idx && d.status === 'OPEN');
        if (openDispute) {
          await disputeQueries.updateDisputeStatus(openDispute.id, 'RESOLVED');
        }
      }
      const txHash = event.log?.transactionHash || event.transactionHash;
      if (txHash) {
        await transactionQueries.logTransaction({
          jobId:    dbJob?.id || null,
          txHash,
          type:     'DisputeResolved',
          amountRaw: (BigInt(clientAmount.toString()) + BigInt(freelancerAmount.toString())).toString(),
          blockNumber: event.log?.blockNumber || event.blockNumber,
        });
      }
    } catch (err) {
      console.error('[listener] DisputeResolved handler error:', err.message);
    }
  });

  console.log('[listener] ✅ All event listeners registered');
}

/**
 * Start blockchain event listeners.
 * Safe to call even when contracts are not configured.
 *
 * @returns {void}
 */
function startListeners() {
  if (!isContractReady) {
    console.warn('[listener] Contracts not configured — event listeners disabled.');
    return;
  }

  try {
    registerListeners();

    // Handle provider-level errors gracefully
    if (provider) {
      provider.on('error', (err) => {
        console.error('[listener] Provider error:', err.message);
      });
    }
  } catch (err) {
    console.error('[listener] Failed to start listeners:', err.message);
  }
}

module.exports = { startListeners };
