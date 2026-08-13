#![cfg_attr(not(any(test, feature = "export-abi")), no_main)]

extern crate alloc;

// ---------------------------
// Module Declarations
// ---------------------------

pub mod constants;
pub mod errors;
pub mod escrow;
pub mod events;
pub mod types;
pub mod storage;
pub mod interfaces;
pub mod token;
pub mod dispute;
pub mod payment;
pub mod juror;

use alloc::string::String;
use alloc::vec::Vec;

use alloy_primitives::{Address, U256, B256};
use storage::state::{Dispute, Job, Juror};

use alloy_primitives::FixedBytes;

use errors::EscrowError;

// ---------------------------
// Stylus Imports
// ---------------------------

use stylus_sdk::prelude::*;

// ---------------------------
// Contract Storage (the entrypoint)
// ---------------------------

sol_storage! {
    #[entrypoint]
    pub struct EscrowContract {
        address admin;
        address usdc_token;
        address gtl_token;
        address fee_recipient;

        // NEW
        address ai_oracle;


        bool initialized;

        mapping(uint256 => Job) jobs;
        uint256 job_count;
        mapping(address => uint256[]) client_jobs;
        mapping(address => uint256[]) freelancer_jobs;

        mapping(uint256 => Dispute) disputes;
        uint256 dispute_count;

        mapping(address => Juror) jurors;
        address[] juror_registry;
    }
}

// ---------------------------
// Public Methods
// ---------------------------

#[public]
impl EscrowContract {
    pub fn create_job(
        &mut self,
        freelancer: Address,
        title: String,
        milestone_descriptions: Vec<String>,
        milestone_amounts: Vec<U256>,
        duration_seconds: u64,
    ) -> Result<U256, EscrowError> {
        escrow::create_job::create_job(
            self,
            freelancer,
            title,
            milestone_descriptions,
            milestone_amounts,
            duration_seconds,
        )
    }

    pub fn accept_job(
        &mut self,
        job_id: U256,
    ) -> Result<(), EscrowError> {
        escrow::accept_job::accept_job(self, job_id)
    }

    pub fn initialize(
        &mut self,
        usdc_token: Address,
        gtl_token: Address,
        fee_recipient: Address,
        ai_oracle: Address,
    ) -> Result<(), EscrowError> {
        escrow::initialize::initialize(
            self,
            usdc_token,
            gtl_token,
            fee_recipient,
            ai_oracle,
        )
    }

    pub fn fund_job(
        &mut self,
        job_id: U256,
    ) -> Result<(), EscrowError> {
        escrow::fund_job::fund_job(self, job_id)
    }

    pub fn deliver_milestone(
        &mut self,
        job_id: U256,
        milestone_id: U256,
        delivery_hash: FixedBytes<32>,
    ) -> Result<(), EscrowError> {
        escrow::deliver_milestone::deliver_milestone(
            self,
            job_id,
            milestone_id,
            delivery_hash,
        )
    }

    pub fn release_milestone(
        &mut self,
        job_id: U256,
        milestone_id: U256,
    ) -> Result<(), EscrowError> {
        escrow::release_milestone::release_milestone(
            self,
            job_id,
            milestone_id,
        )
    }

    pub fn raise_dispute(
        &mut self,
        job_id: U256,
        milestone_id: U256,
        reason: String,
    ) -> Result<U256, EscrowError> {
        dispute::raise_dispute::raise_dispute(
            self,
            job_id,
            milestone_id,
            reason,
        )
    }

    pub fn propose_settlement(
        &mut self,
        dispute_id: U256,
        client_bps: u16,
    ) -> Result<(), EscrowError> {
        dispute::propose_settlement::propose_settlement(
            self,
            dispute_id,
            client_bps,
        )
    }

    pub fn submit_ai_report(
        &mut self,
        dispute_id: U256,
        report_hash: FixedBytes<32>,
        confidence: u8,
        suggested_client_bps: u16,
    ) -> Result<(), EscrowError> {
        dispute::submit_ai_report::submit_ai_report(
            self,
            dispute_id,
            report_hash,
            confidence,
            suggested_client_bps,
        )
    }

    pub fn accept_ai_settlement(
        &mut self,
        dispute_id: U256,
    ) -> Result<(), EscrowError> {
        dispute::accept_ai_settlement::accept_ai_settlement(
            self,
            dispute_id,
        )
    }

    pub fn register_juror(
        &mut self,
    ) -> Result<(), EscrowError> {
        juror::register::register_juror(self)
    }

    pub fn stake(
        &mut self,
        amount: U256,
    ) -> Result<(), EscrowError> {
        juror::stake::stake(
            self,
            amount,
        )
    }

    pub fn unstake(
        &mut self,
        amount: U256,
    ) -> Result<(), EscrowError> {
        juror::unstake::unstake(
            self,
            amount,
        )
    }

    pub fn escalate_to_jury(
        &mut self,
        dispute_id: U256,
    ) -> Result<(), EscrowError> {
        dispute::escalate_to_jury::escalate_to_jury(
            self,
            dispute_id,
        )
    }

    pub fn assign_jurors(
        &mut self,
        dispute_id: U256,
        jurors: Vec<Address>,
    ) -> Result<(), EscrowError> {
        dispute::assign_jurors::assign_jurors(
            self,
            dispute_id,
            jurors,
        )
    }

    pub fn commit_vote(
        &mut self,
        dispute_id: U256,
        commitment: FixedBytes<32>,
    ) -> Result<(), EscrowError> {
        dispute::commit_vote::commit_vote(
            self,
            dispute_id,
            commitment,
        )
    }

    pub fn reveal_vote(
        &mut self,
        dispute_id: U256,
        client_bps: u16,
        freelancer_bps: u16,
        salt: FixedBytes<32>,
    ) -> Result<(), EscrowError> {
        dispute::reveal_vote::reveal_vote(
            self,
            dispute_id,
            client_bps,
            freelancer_bps,
            salt,
        )
    }

    pub fn finalize_jury(
        &mut self,
        dispute_id: U256,
    ) -> Result<(), EscrowError> {
        dispute::finalize_jury::finalize_jury(
            self,
            dispute_id,
        )
    }

    pub fn force_timeout(
        &mut self,
        dispute_id: U256,
    ) -> Result<(), EscrowError> {
        dispute::force_timeout::force_timeout(
            self,
            dispute_id,
        )
    }

    pub fn get_job_count(
        &self,
    ) -> U256 {
        self.job_count.get()
    }

    pub fn get_job_basic(
        &self,
        job_id: U256,
    ) -> (
        Address,
        Address,
        String,
        U256,
        U256,
        u8,
        u64,
        u64,
        u64,
    ) {
        let job = self.jobs.get(job_id);

        (
            job.client.get(),
            job.freelancer.get(),
            job.title.get_string(),
            job.total_amount.get(),
            job.released_amount.get(),
            job.status.get().to::<u8>(),
            job.created_at.get().to::<u64>(),
            job.deadline.get().to::<u64>(),
            job.milestone_count.get().to::<u64>(),
        )
    }

    pub fn get_milestone(
        &self,
        job_id: U256,
        milestone_id: U256,
    ) -> (
        String,
        U256,
        bool,
        bool,
        bool,
        bool,
        U256,
        B256,
        u64,
        u64,
    ) {
        let job = self.jobs.get(job_id);
        let milestone = job.milestones.get(milestone_id);

        (
            milestone.description.get_string(),
            milestone.amount.get(),
            milestone.delivered.get(),
            milestone.released.get(),
            milestone.late.get(),
            milestone.has_dispute.get(),
            milestone.dispute_id.get(),
            milestone.delivery_hash.get(),
            milestone.delivered_at.get().to::<u64>(),
            milestone.dispute_deadline.get().to::<u64>(),
        )
    }



}