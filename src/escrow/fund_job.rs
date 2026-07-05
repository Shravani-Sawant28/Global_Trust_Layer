use alloy_primitives::{Address, U256, U64, U8};
use stylus_sdk::prelude::*;
use stylus_sdk::prelude::Call;

use crate::interfaces::erc20::IERC20;
use crate::{
    errors::{
        AlreadyFunded,
        EscrowError,
        JobNotFound,
        Unauthorized,
    },
    events::JobFunded,
    types::JobStatus,
    EscrowContract,
};

pub fn fund_job(
    contract: &mut EscrowContract,
    job_id: U256,
) -> Result<(), EscrowError> {
    // ---------------- Read environment ----------------

    let caller = contract.vm().msg_sender();
    let timestamp = contract.vm().block_timestamp();

    // Values needed after storage borrow ends
    let total_amount: U256;
    let deadline: u64;

    // ---------------- Load Job ----------------

    {
        let mut job = contract.jobs.setter(job_id);

        // Job must exist
        if job.client.get() == Address::ZERO {
            return Err(EscrowError::JobNotFound(JobNotFound {}));
        }

        // Only the client can fund
        if caller != job.client.get() {
            return Err(EscrowError::Unauthorized(Unauthorized {}));
        }

        // Must still be in Created state
        if job.status.get() != U8::from(JobStatus::Created as u8) {
            return Err(EscrowError::AlreadyFunded(AlreadyFunded {}));
        }

        // Read values before transfer
        total_amount = job.total_amount.get();

        deadline = timestamp + job.duration.get().to::<u64>();
    }

    // ---------------- Transfer USDC into Escrow ----------------

    let usdc = IERC20::new(contract.usdc_token.get());

    let call = Call::new_mutating(contract);

    let ok = usdc
        .transfer_from(
            contract.vm(),
            call,
            caller,
            contract.vm().contract_address(),
            total_amount,
        )
        .map_err(|_| EscrowError::Unauthorized(Unauthorized {}))?;

    if !ok {
        return Err(EscrowError::Unauthorized(
            Unauthorized {},
        ));
    }


    {
        let mut job = contract.jobs.setter(job_id);

        job.status.set(U8::from(JobStatus::Funded as u8));
        job.deadline.set(U64::from(deadline));
    }

    // ---------------- Emit Event ----------------

    contract.vm().log(JobFunded {
        job_id,
        amount: total_amount,
        deadline,
    });

    Ok(())
}