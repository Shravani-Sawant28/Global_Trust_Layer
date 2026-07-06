use alloc::string::String;

use alloy_primitives::{Address, U256, U64, U8};
use stylus_sdk::prelude::*;

use crate::{
    constants::GRACE_PERIOD_SECS,
    errors::{
        AlreadyReleased,
        DisputeAlreadyExists,
        EscrowError,
        InvalidState,
        JobNotFound,
        MilestoneNotFound,
        NotJobParty,
    },
    events::DisputeRaised,
    types::DisputeStage,
    EscrowContract,
};

pub fn raise_dispute(
    contract: &mut EscrowContract,
    job_id: U256,
    milestone_id: U256,
    reason: String,
) -> Result<U256, EscrowError> {

    let caller = contract.vm().msg_sender();
    let timestamp = contract.vm().block_timestamp();

    let dispute_id =
        contract.dispute_count.get() + U256::from(1);

    contract.dispute_count.set(dispute_id);

    {
        let mut job = contract.jobs.setter(job_id);

        // Job exists
        if job.client.get() == Address::ZERO {
            return Err(EscrowError::JobNotFound(
                JobNotFound {},
            ));
        }

        // Only client or freelancer
        if caller != job.client.get()
            && caller != job.freelancer.get()
        {
            return Err(EscrowError::NotJobParty(
                NotJobParty {},
            ));
        }

        // Milestone exists
        if milestone_id
            >= U256::from(job.milestone_count.get().to::<u64>())
        {
            return Err(EscrowError::MilestoneNotFound(
                MilestoneNotFound {},
            ));
        }

        let mut milestone =
            job.milestones.setter(milestone_id);

        if !milestone.delivered.get() {
            return Err(EscrowError::InvalidState(
                InvalidState {},
            ));
        }

        if milestone.released.get() {
            return Err(EscrowError::AlreadyReleased(
                AlreadyReleased {},
            ));
        }

        if milestone.has_dispute.get() {
            return Err(
                EscrowError::DisputeAlreadyExists(
                    DisputeAlreadyExists {},
                ),
            );
        }

        milestone.has_dispute.set(true);
        milestone.dispute_id.set(dispute_id);
    }

    {
        let mut dispute =
            contract.disputes.setter(dispute_id);

        dispute.job_id.set(job_id);
        dispute.milestone_id.set(milestone_id);

        dispute.raised_by.set(caller);

        dispute.reason.set_str(&reason);

        dispute
            .stage
            .set(U8::from(DisputeStage::MutualSettlement as u8));

        dispute
            .raised_at
            .set(U64::from(timestamp));

        dispute.overall_deadline.set(
            U64::from(timestamp + GRACE_PERIOD_SECS),
        );
    }

    contract.vm().log(DisputeRaised {
        dispute_id,
        job_id,
        milestone_id,
        raised_by: caller,
        reason,
    });

    Ok(dispute_id)
}