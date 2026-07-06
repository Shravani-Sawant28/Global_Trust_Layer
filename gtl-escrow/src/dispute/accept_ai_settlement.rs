use alloy_primitives::{U256, U8};
use stylus_sdk::prelude::*;

use crate::{
    dispute::resolve_ai::resolve_ai,
    errors::{
        AlreadyAcceptedAi,
        DisputeNotFound,
        DisputeStageMismatch,
        EscrowError,
        NotJobParty,
    },
    events::AiSettlementAccepted,
    types::DisputeStage,
    EscrowContract,
};

pub fn accept_ai_settlement(
    contract: &mut EscrowContract,
    dispute_id: U256,
) -> Result<(), EscrowError> {

    let caller = contract.vm().msg_sender();

    let mut should_resolve = false;

    {
        let mut dispute = contract.disputes.setter(dispute_id);

        if dispute.job_id.get().is_zero() {
            return Err(
                EscrowError::DisputeNotFound(
                    DisputeNotFound {},
                ),
            );
        }

        if dispute.stage.get()
            != U8::from(DisputeStage::AiProposed as u8)
        {
            return Err(
                EscrowError::DisputeStageMismatch(
                    DisputeStageMismatch {},
                ),
            );
        }

        let job_id = dispute.job_id.get();

        let job = contract.jobs.getter(job_id);

        if caller == job.client.get() {

            if dispute.client_accepted_ai.get() {
                return Err(
                    EscrowError::AlreadyAcceptedAi(
                        AlreadyAcceptedAi {},
                    ),
                );
            }

            dispute.client_accepted_ai.set(true);

        } else if caller == job.freelancer.get() {

            if dispute.freelancer_accepted_ai.get() {
                return Err(
                    EscrowError::AlreadyAcceptedAi(
                        AlreadyAcceptedAi {},
                    ),
                );
            }

            dispute.freelancer_accepted_ai.set(true);

        } else {

            return Err(
                EscrowError::NotJobParty(
                    NotJobParty {},
                ),
            );
        }

        if dispute.client_accepted_ai.get()
            && dispute.freelancer_accepted_ai.get()
        {
            should_resolve = true;
        }
    }

    contract.vm().log(
        AiSettlementAccepted {
            dispute_id,
            accepter: caller,
        },
    );

    if should_resolve {
        resolve_ai(
            contract,
            dispute_id,
        )?;
    }

    Ok(())
}