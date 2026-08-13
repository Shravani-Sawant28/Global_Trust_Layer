use alloy_primitives::{Address, U256, U8};
use stylus_sdk::prelude::*;

use crate::{
    errors::{EscrowError, InvalidState, JobNotFound, Unauthorized},
    events::JobAccepted,
    types::JobStatus,
    EscrowContract,
};

pub fn accept_job(
    contract: &mut EscrowContract,
    job_id: U256,
) -> Result<(), EscrowError> {
    let caller = contract.vm().msg_sender();

    {
        let mut job = contract.jobs.setter(job_id);

        // Job exists
        if job.client.get() == Address::ZERO {
            return Err(EscrowError::JobNotFound(JobNotFound {}));
        }

        // Must be an open job
        if job.freelancer.get() != Address::ZERO {
            return Err(EscrowError::InvalidState(InvalidState {}));
        }

        // Client cannot accept their own job
        if caller == job.client.get() {
            return Err(EscrowError::Unauthorized(Unauthorized {}));
        }

        // Must be in a valid pre-execution state
        let status = job.status.get();
        if status != U8::from(JobStatus::Created as u8) && status != U8::from(JobStatus::Funded as u8) {
            return Err(EscrowError::InvalidState(InvalidState {}));
        }

        job.freelancer.set(caller);
    }

    // Index the job for the freelancer
    contract.freelancer_jobs.setter(caller).push(job_id);

    contract.vm().log(JobAccepted {
        job_id,
        freelancer: caller,
    });

    Ok(())
}
