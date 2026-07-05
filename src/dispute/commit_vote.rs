use alloy_primitives::{FixedBytes, U256};
use stylus_sdk::prelude::*;

use crate::{
    errors::{
        AlreadyCommitted,
        CommitWindowClosed,
        DisputeNotFound,
        EscrowError,
        JurorNotEligible,
    },
    events::VoteCommitted,
    EscrowContract,
};

pub fn commit_vote(
    contract: &mut EscrowContract,
    dispute_id: U256,
    commitment: FixedBytes<32>,
) -> Result<(), EscrowError> {

    let caller = contract.vm().msg_sender();

    let timestamp =
        contract.vm().block_timestamp();

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

        if timestamp
            > dispute
                .vote_commit_deadline
                .get()
                .to::<u64>()
        {
            return Err(
                EscrowError::CommitWindowClosed(
                    CommitWindowClosed {},
                ),
            );
        }

        let mut eligible = false;

        let total =
            dispute.jurors.len();

        for i in 0..total {

        if let Some(juror) = dispute.jurors.get(i) {
            if juror == caller {
                eligible = true;
                break;
            }
        }
    }

        if !eligible {
            return Err(
                EscrowError::JurorNotEligible(
                    JurorNotEligible {},
                ),
            );
        }
    }

    {
        let mut dispute =
            contract.disputes.setter(dispute_id);

        let mut vote =
            dispute.votes.setter(caller);

        if vote.has_committed.get() {
            return Err(
                EscrowError::AlreadyCommitted(
                    AlreadyCommitted {},
                ),
            );
        }

        vote.commitment.set(commitment);

        vote.has_committed.set(true);
    }

    contract.vm().log(
        VoteCommitted {
            dispute_id,
            juror: caller,
        },
    );

    Ok(())
}