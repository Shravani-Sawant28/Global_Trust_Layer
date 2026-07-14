use alloy_primitives::{Address, U256, U8};
use stylus_sdk::prelude::*;
use stylus_sdk::prelude::Call;
use crate::interfaces::erc20::IERC20;

use crate::{
    constants::{BPS_DENOMINATOR, PLATFORM_FEE_BPS},
    errors::{
        AlreadyReleased,
        EscrowError,
        JobNotFound,
        MilestoneNotFound,
        Unauthorized,
    },
    events::MilestoneReleased,
    types::JobStatus,
    EscrowContract,
};

pub fn release_milestone(
    contract: &mut EscrowContract,
    job_id: U256,
    milestone_id: U256,
) -> Result<(), EscrowError> {

    let caller = contract.vm().msg_sender();

    let amount: U256;
    let fee: U256;
    let freelancer_amount: U256;
    let completed: bool;
    let freelancer: Address;

    {
        let mut job = contract.jobs.setter(job_id);

        freelancer = job.freelancer.get();

        // Job exists
        if job.client.get() == Address::ZERO {
            return Err(EscrowError::JobNotFound(JobNotFound {}));
        }

        // Only client can release payment
        if caller != job.client.get() {
            return Err(EscrowError::Unauthorized(Unauthorized {}));
        }

        // Must be funded
        if job.status.get() != U8::from(JobStatus::Funded as u8) {
            return Err(EscrowError::Unauthorized(Unauthorized {}));
        }

        // Milestone exists
        if milestone_id >= U256::from(job.milestone_count.get().to::<u64>()) {
            return Err(EscrowError::MilestoneNotFound(
                MilestoneNotFound {},
            ));
        }

        let mut milestone = job.milestones.setter(milestone_id);

        if !milestone.delivered.get() {
            return Err(EscrowError::Unauthorized(Unauthorized {}));
        }

        if milestone.released.get() {
            return Err(EscrowError::AlreadyReleased(
                AlreadyReleased {},
            ));
        }

        amount = milestone.amount.get();

        fee = amount
            * U256::from(PLATFORM_FEE_BPS)
            / U256::from(BPS_DENOMINATOR);

        freelancer_amount = amount - fee;

        milestone.released.set(true);

        let released = job.released_amount.get() + amount;
        job.released_amount.set(released);

        completed = released == job.total_amount.get();

        if completed {
            job.status.set(U8::from(JobStatus::Completed as u8));
        }
    }

    // ---------------- Transfer USDC ----------------

    let usdc = IERC20::new(contract.usdc_token.get());

    // -------- Pay freelancer --------
    {
        let call = Call::new_mutating(contract);

        let ok = usdc
            .transfer(
                contract.vm(),
                call,
                freelancer,
                freelancer_amount,
            )
            .map_err(|_| EscrowError::Unauthorized(Unauthorized {}))?;

        if !ok {
            return Err(EscrowError::Unauthorized(Unauthorized {}));
        }
    }

    // -------- Pay platform fee --------
    {
        let fee_recipient = contract.fee_recipient.get();

        let call = Call::new_mutating(contract);

        let ok = usdc
            .transfer(
                contract.vm(),
                call,
                fee_recipient,
                fee,
            )
            .map_err(|_| EscrowError::Unauthorized(Unauthorized {}))?;

        if !ok {
            return Err(EscrowError::Unauthorized(Unauthorized {}));
        }
    }

    contract.vm().log(MilestoneReleased {
        job_id,
        milestone_id,
        amount_to_freelancer: freelancer_amount,
        fee,
    });

    Ok(())
}