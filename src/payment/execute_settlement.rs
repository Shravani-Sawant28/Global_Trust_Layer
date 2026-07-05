use alloy_primitives::{Address, U16, U256, U8};

use stylus_sdk::prelude::*;
use stylus_sdk::prelude::Call;

use crate::{
    constants::{BPS_DENOMINATOR, PLATFORM_FEE_BPS},
    errors::{
        EscrowError,
        DisputeNotFound,
        JobNotFound,
        MilestoneNotFound,
        AlreadyReleased,
        Unauthorized,
    },
    interfaces::erc20::IERC20,
    types::{DisputeStage, JobStatus},
    EscrowContract,
};

/// Shared settlement engine.
///
/// All dispute resolution paths (Mutual, AI, Jury, Timeout)
/// eventually call this function.
pub fn execute_settlement(
    contract: &mut EscrowContract,
    dispute_id: U256,
    stage: DisputeStage,
    client_bps: u16,
) -> Result<(), EscrowError> {

        // ---------------- Load dispute ----------------

    let job_id: U256;
    let milestone_id: U256;

    {
        let dispute = contract.disputes.getter(dispute_id);

        if dispute.job_id.get().is_zero() {
            return Err(EscrowError::DisputeNotFound(
                DisputeNotFound {},
            ));
        }

        job_id = dispute.job_id.get();
        milestone_id = dispute.milestone_id.get();
    }

    // ---------------- Load job ----------------

    let client: Address;
    let freelancer: Address;
    let total_amount: U256;
    let released_amount: U256;

    {
        let job = contract.jobs.getter(job_id);

        if job.client.get() == Address::ZERO {
            return Err(EscrowError::JobNotFound(
                JobNotFound {},
            ));
        }

        if milestone_id >= U256::from(job.milestone_count.get().to::<u64>()) {
            return Err(EscrowError::MilestoneNotFound(
                MilestoneNotFound {},
            ));
        }

        client = job.client.get();
        freelancer = job.freelancer.get();

        total_amount = job.total_amount.get();
        released_amount = job.released_amount.get();
    }

    let milestone_amount: U256;

    {
        let job = contract.jobs.getter(job_id);

        let milestone = job.milestones.getter(milestone_id);

        if milestone.released.get() {
            return Err(EscrowError::AlreadyReleased(
                AlreadyReleased {},
            ));
        }

        milestone_amount = milestone.amount.get();
    }

    // ---------------- Calculate payout ----------------

    let platform_fee =
        milestone_amount
            * U256::from(PLATFORM_FEE_BPS)
            / U256::from(BPS_DENOMINATOR);

    let distributable =
        milestone_amount - platform_fee;

    let client_amount =
        distributable
            * U256::from(client_bps)
            / U256::from(BPS_DENOMINATOR);

    let freelancer_amount =
        distributable - client_amount;

    let usdc = IERC20::new(contract.usdc_token.get());

    let call = Call::new_mutating(contract);

    let ok = usdc
    .transfer(
        contract.vm(),
        call,
        client,
        client_amount,
    )
    .map_err(|_| EscrowError::Unauthorized(
        Unauthorized {},
    ))?;

    if !ok {
        return Err(EscrowError::Unauthorized(
            Unauthorized {},
        ));
    }

    //Freelancer transfer
    let call = Call::new_mutating(contract);

    let ok = usdc
        .transfer(
            contract.vm(),
            call,
            freelancer,
            freelancer_amount,
        )
        .map_err(|_| EscrowError::Unauthorized(
            Unauthorized {},
    ))?;

    if !ok {
        return Err(EscrowError::Unauthorized(
            Unauthorized {},
        ));
    }

    //Platform fee transfer
    let call = Call::new_mutating(contract);

    let ok = usdc
        .transfer(
            contract.vm(),
            call,
            contract.fee_recipient.get(),
            platform_fee,
        )
        .map_err(|_| EscrowError::Unauthorized(
            Unauthorized {},
    ))?;

    if !ok {
        return Err(EscrowError::Unauthorized(
            Unauthorized {},
        ));
    }

    // ---------------- Update milestone & job ----------------

    {
        let mut job = contract.jobs.setter(job_id);

        job.released_amount
            .set(released_amount + milestone_amount);

        let mut milestone = job.milestones.setter(milestone_id);

        milestone.released.set(true);
    }

    // ---------------- Update dispute ----------------

    {
        let mut dispute = contract.disputes.setter(dispute_id);

        dispute.stage.set(U8::from(stage as u8));

        dispute
            .final_client_bps
            .set(U16::from(client_bps));

        dispute
            .final_freelancer_bps
            .set(U16::from(BPS_DENOMINATOR - client_bps));

        dispute.executed.set(true);
    }

    Ok(())
}