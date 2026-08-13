//! Contract events.
//!
//! These are declarations only (via the sol! macro) — no emission logic
//! lives here. Actual evm::log(...) calls happen in the business-logic
//! files (escrow/, dispute/, juror/) once we get there, so each event is
//! emitted right next to the state change it describes.

use alloy_sol_types::sol;

sol! {
    // ---- Job lifecycle ----
    event JobCreated(uint256 indexed job_id, address indexed client, address indexed freelancer, uint256 total_amount, string title);
    event JobAccepted(uint256 indexed job_id, address indexed freelancer);
    event JobFunded(uint256 indexed job_id, uint256 amount, uint64 deadline);
    event JobCompleted(uint256 indexed job_id);
    event JobCancelled(uint256 indexed job_id);

    // ---- Milestones ----
    event MilestoneDelivered(uint256 indexed job_id, uint256 milestone_id, bytes32 delivery_hash, bool late);
    event MilestoneReleased(uint256 indexed job_id, uint256 milestone_id, uint256 amount_to_freelancer, uint256 fee);
    event MilestoneRefunded(uint256 indexed job_id, uint256 milestone_id, uint256 amount);
    event MilestoneAutoReleased(uint256 indexed job_id, uint256 milestone_id, uint256 amount);

    // ---- Disputes: raising + Stage 1 (mutual settlement) ----
    event DisputeRaised(uint256 indexed dispute_id, uint256 indexed job_id, uint256 milestone_id, address raised_by, string reason);
    event SplitProposed(
        uint256 indexed dispute_id,
        address indexed proposer,
        uint16 client_bps
    );
    event DisputeResolvedMutual(uint256 indexed dispute_id, uint16 client_bps, uint16 freelancer_bps);

    // ---- Disputes: Stage 2 (AI-suggested settlement) ----
    event AiReportSubmitted(uint256 indexed dispute_id, bytes32 report_hash, uint8 confidence, uint16 suggested_client_bps);
    event AiSettlementAccepted(
        uint256 indexed dispute_id,
        address indexed accepter
    );
    event SettlementExecuted(
        uint256 indexed dispute_id,
        uint16 client_bps,
        uint16 freelancer_bps
    );
    event DisputeResolvedAi(uint256 indexed dispute_id, uint16 client_bps, uint16 freelancer_bps);

    // ---- Disputes: Stage 3 (juror TCR voting) ----
    event DisputeEscalatedToJury(uint256 indexed dispute_id, uint64 commit_deadline, uint64 reveal_deadline);
    event VoteCommitted(uint256 indexed dispute_id, address indexed juror);
    event VoteRevealed(uint256 indexed dispute_id, address indexed juror, uint16 client_bps, uint16 freelancer_bps);
    event DisputeResolvedJury(uint256 indexed dispute_id, uint16 client_bps, uint16 freelancer_bps);

    // ---- Deadlock-breaker ----
    event DisputeResolvedTimeout(uint256 indexed dispute_id);

    // ---- Juror registry economics ----
    event JurorStaked(address indexed juror, uint256 amount);
    event JurorUnstaked(address indexed juror, uint256 amount);
    event JurorRewarded(address indexed juror, uint256 amount);
    event JurorSlashed(address indexed juror, uint256 amount, string reason);
    event JurorRegistered(
        address indexed juror
    );
}