//! Job creation — the entrypoint into the escrow lifecycle.
//!
//! This is a free function, not a method, so it can be called from the
//! thin #[public] wrapper in lib.rs while keeping this file's logic
//! completely separate from the entrypoint's routing.

use alloc::string::String;
use alloc::vec::Vec;

use alloy_primitives::{Address, U256, U8, U64};
use stylus_sdk::prelude::*;

use crate::constants::MAX_MILESTONES;
use crate::errors::{
    ArithmeticOverflow, EscrowError, InvalidAddress, InvalidAmount, InvalidJob, InvalidMilestone,
};
use crate::events::JobCreated;
use crate::types::JobStatus;
use crate::EscrowContract;

pub fn create_job(
    contract: &mut EscrowContract,
    freelancer: Address,
    title: String,
    milestone_descriptions: Vec<String>,
    milestone_amounts: Vec<U256>,
    duration_seconds: u64,
) -> Result<U256, EscrowError> {
    let caller = contract.vm().msg_sender();

    // ---------------- Validation ----------------

    if freelancer == Address::ZERO || freelancer == caller {
        return Err(EscrowError::InvalidAddress(InvalidAddress {}));
    }

    if title.is_empty() {
        return Err(EscrowError::InvalidJob(InvalidJob {}));
    }

    if milestone_descriptions.len() != milestone_amounts.len()
        || milestone_descriptions.is_empty()
        || milestone_descriptions.len() > MAX_MILESTONES
    {
        return Err(EscrowError::InvalidMilestone(InvalidMilestone {}));
    }

    if duration_seconds == 0 {
        return Err(EscrowError::InvalidAmount(InvalidAmount {}));
    }

    // ---------------- Calculate total ----------------

    let mut total = U256::ZERO;

    for amount in milestone_amounts.iter() {
        if amount.is_zero() {
            return Err(EscrowError::InvalidAmount(InvalidAmount {}));
        }

        total = total
            .checked_add(*amount)
            .ok_or(EscrowError::ArithmeticOverflow(ArithmeticOverflow {}))?;
    }

    // ---------------- Generate Job ID ----------------

    let job_id = contract.job_count.get() + U256::from(1);
    contract.job_count.set(job_id);

    // Read values BEFORE borrowing contract mutably
    let timestamp = contract.vm().block_timestamp();
    let milestone_count = milestone_descriptions.len() as u64;

    {
        let mut job = contract.jobs.setter(job_id);

        job.client.set(caller);
        job.freelancer.set(freelancer);
        job.title.set_str(&title);

        job.total_amount.set(total);

        job.status.set(U8::from(JobStatus::Created as u8));

        job.created_at.set(U64::from(timestamp));

        job.duration.set(U64::from(duration_seconds));

        job.milestone_count.set(U64::from(milestone_count));

        // Defaults:
        // released_amount = 0
        // deadline = 0
        // dispute_id = 0
        // has_dispute = false

        for (i, (description, amount)) in milestone_descriptions
            .iter()
            .zip(milestone_amounts.iter())
            .enumerate()
        {
            let mut milestone = job.milestones.setter(U256::from(i as u64));

            milestone.description.set_str(description);
            milestone.amount.set(*amount);

            // Remaining fields default to zero / false
        }
    }

    // ---------------- Indexing ----------------

    contract.client_jobs.setter(caller).push(job_id);
    contract.freelancer_jobs.setter(freelancer).push(job_id);

    // ---------------- Emit Event ----------------

    contract.vm().log(JobCreated {
        job_id,
        client: caller,
        freelancer,
        total_amount: total,
        title,
    });

    Ok(job_id)
}