use alloy_primitives::{FixedBytes, U16, U256};
use stylus_sdk::prelude::*;

use crate::{
    constants::BPS_DENOMINATOR,
    errors::{
        AlreadyRevealed,
        CommitmentMismatch,
        DisputeNotFound,
        EscrowError,
        RevealWindowClosed,
        RevealWindowNotOpen,
    },
    events::VoteRevealed,
    EscrowContract,
};

pub fn reveal_vote(
    contract: &mut EscrowContract,
    dispute_id: U256,
    client_bps: u16,
    freelancer_bps: u16,
    _salt: FixedBytes<32>,
) -> Result<(), EscrowError> {

    if client_bps + freelancer_bps != BPS_DENOMINATOR {
        return Err(
            EscrowError::CommitmentMismatch(
                CommitmentMismatch {},
            ),
        );
    }

    let caller = contract.vm().msg_sender();

    let timestamp = contract.vm().block_timestamp();

    {
        let dispute =
            contract.disputes.getter(dispute_id);

        if dispute.job_id.get().is_zero() {
            return Err(
                EscrowError::DisputeNotFound(
                    DisputeNotFound {},
                ),
            );
        }

        let commit_deadline =
            dispute.vote_commit_deadline.get().to::<u64>();

        let reveal_deadline =
            dispute.vote_reveal_deadline.get().to::<u64>();

        if timestamp < commit_deadline {
            return Err(
                EscrowError::RevealWindowNotOpen(
                    RevealWindowNotOpen {},
                ),
            );
        }

        if timestamp > reveal_deadline {
            return Err(
                EscrowError::RevealWindowClosed(
                    RevealWindowClosed {},
                ),
            );
        }
    }

    // NOTE:
    // We will verify the commitment hash in the next step.
    // For now we complete the reveal storage flow first.

    {
        let mut dispute =
            contract.disputes.setter(dispute_id);

        let mut vote =
            dispute.votes.setter(caller);

        if vote.has_revealed.get() {
            return Err(
                EscrowError::AlreadyRevealed(
                    AlreadyRevealed {},
                ),
            );
        }

        vote.revealed_client_bps
            .set(U16::from(client_bps));

        vote.revealed_freelancer_bps
            .set(U16::from(freelancer_bps));

        vote.has_revealed.set(true);
    }

    contract.vm().log(
        VoteRevealed {
            dispute_id,
            juror: caller,
            client_bps,
            freelancer_bps,
        },
    );

    Ok(())
}