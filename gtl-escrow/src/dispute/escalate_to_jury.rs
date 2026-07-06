use alloy_primitives::{U64, U8, U256};
use stylus_sdk::prelude::*;

use crate::{
    constants::{
        COMMIT_WINDOW,
        REVEAL_WINDOW,
    },
    errors::{
        DisputeNotFound,
        DisputeStageMismatch,
        EscrowError,
    },
    events::DisputeEscalatedToJury,
    types::DisputeStage,
    EscrowContract,
};

pub fn escalate_to_jury(
    contract: &mut EscrowContract,
    dispute_id: U256,
) -> Result<(), EscrowError> {

    let timestamp =
        contract.vm().block_timestamp();

    let commit_deadline =
        timestamp + COMMIT_WINDOW;

    let reveal_deadline =
        commit_deadline + REVEAL_WINDOW;

    {
        let mut dispute =
            contract.disputes.setter(dispute_id);

        if dispute.job_id.get().is_zero() {
            return Err(
                EscrowError::DisputeNotFound(
                    DisputeNotFound {},
                ),
            );
        }

        if dispute.stage.get()
            != U8::from(
                DisputeStage::AiProposed as u8
            )
        {
            return Err(
                EscrowError::DisputeStageMismatch(
                    DisputeStageMismatch {},
                ),
            );
        }

        dispute.stage.set(
            U8::from(
                DisputeStage::JurorVoting as u8
            ),
        );

        dispute.vote_commit_deadline.set(
            U64::from(commit_deadline),
        );

        dispute.vote_reveal_deadline.set(
            U64::from(reveal_deadline),
        );
    }

    contract.vm().log(
        DisputeEscalatedToJury {
            dispute_id,
            commit_deadline,
            reveal_deadline,
        },
    );

    Ok(())
}