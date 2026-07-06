//! Storage shapes for jobs, milestones, disputes, votes, and jurors.
//! These are NOT the entrypoint — EscrowContract (the entrypoint) lives
//! in lib.rs and references these types directly.

//!Disputes are tracked per milestone.
// In GTL v1, only one dispute may be active for a job at a time,
// but storing dispute metadata on the milestone keeps the data model
// aligned with milestone-based escrow and makes future expansion easier.

use stylus_sdk::prelude::*;

sol_storage! {
    pub struct Job {
        address client;
        address freelancer;
        string title;

        uint256 total_amount;
        uint256 released_amount;

        uint8 status;

        uint64 created_at;
        uint64 duration;
        uint64 deadline;

        uint64 milestone_count;
        mapping(uint256 => Milestone) milestones;
    }

    pub struct Milestone {
        string description;
        uint256 amount;

        bool delivered;
        bool released;
        bool late;

        // NEW
        bool has_dispute;
        uint256 dispute_id;

        bytes32 delivery_hash;
        uint64 delivered_at;
        uint64 dispute_deadline;
    }

    pub struct Dispute {
        uint256 job_id;
        uint256 milestone_id;
        address raised_by;
        string reason;

        uint8 stage;                // DisputeStage as u8
        uint64 raised_at;
        uint64 overall_deadline;

        bool client_proposed;
        uint16 client_proposal_bps;
        bool freelancer_proposed;
        uint16 freelancer_proposal_bps;

        uint64 client_proposed_at;
        uint64 freelancer_proposed_at;

        bytes32 ai_report_hash;
        uint8 ai_confidence;
        uint64 ai_report_timestamp;
        uint16 ai_suggested_client_bps;
        bool client_accepted_ai;
        bool freelancer_accepted_ai;

        address[] jurors;
        uint64 vote_commit_deadline;
        uint64 vote_reveal_deadline;
        mapping(address => Vote) votes;

        uint16 final_client_bps;
        uint16 final_freelancer_bps;
        bool executed;
    }

    pub struct Vote {
        bytes32 commitment;
        bool has_committed;
        bool has_revealed;
        uint16 revealed_client_bps;
        uint16 revealed_freelancer_bps;
    }

    pub struct Juror {
        uint256 staked_amount;
        uint8 status;
        uint64 total_votes;
        uint64 correct_votes;
        bool registered;
        uint64 joined_at;
    }
}