use alloy_primitives::{Address, FixedBytes, U256, U64, U8};
use stylus_sdk::prelude::*;

use crate::{
    constants::DISPUTE_WINDOW_SECS,
    errors::{
        AlreadyDelivered,
        EscrowError,
        JobNotFound,
        MilestoneNotFound,
        Unauthorized,
    },
    events::MilestoneDelivered,
    types::JobStatus,
    EscrowContract,
};

pub fn deliver_milestone(
    contract: &mut EscrowContract,
    job_id: U256,
    milestone_id: U256,
    delivery_hash: FixedBytes<32>,
) -> Result<(), EscrowError> {

    let caller = contract.vm().msg_sender();
    let timestamp = contract.vm().block_timestamp();

    let late: bool;

    {
        let mut job = contract.jobs.setter(job_id);

        // Job exists
        if job.client.get() == Address::ZERO {
            return Err(EscrowError::JobNotFound(JobNotFound {}));
        }

        // Only freelancer may deliver
        if caller != job.freelancer.get() {
            return Err(EscrowError::Unauthorized(Unauthorized {}));
        }

        // Job must be funded
        if job.status.get() != U8::from(JobStatus::Funded as u8) {
            return Err(EscrowError::Unauthorized(Unauthorized {}));
        }

        // Milestone exists
        if milestone_id >= U256::from(job.milestone_count.get().to::<u64>()) {
            return Err(EscrowError::MilestoneNotFound(
                MilestoneNotFound {},
            ));
        }

        // Read deadline BEFORE borrowing milestone
        let deadline = job.deadline.get().to::<u64>();

        late = timestamp > deadline;

        // Now borrow milestone
        let mut milestone = job.milestones.setter(milestone_id);

        if milestone.delivered.get() {
            return Err(EscrowError::AlreadyDelivered(
                AlreadyDelivered {},
            ));
        }

        milestone.delivered.set(true);
        milestone.delivery_hash.set(delivery_hash);
        milestone.delivered_at.set(U64::from(timestamp));
        milestone.late.set(late);

        milestone.dispute_deadline.set(
            U64::from(timestamp + DISPUTE_WINDOW_SECS),
        );
    }

    contract.vm().log(MilestoneDelivered {
        job_id,
        milestone_id,
        delivery_hash,
        late,
    });

    Ok(())
}