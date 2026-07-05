use alloy_primitives::{U16, U256, U8};
use stylus_sdk::prelude::*;

use crate::{
    constants::BPS_DENOMINATOR,
    errors::{
        DisputeNotFound,
        EscrowError,
        RevealWindowNotOpen,
    },
    events::DisputeResolvedJury,
    types::DisputeStage,
    EscrowContract,
};

pub fn finalize_jury(
    contract: &mut EscrowContract,
    dispute_id: U256,
) -> Result<(), EscrowError> {

    let timestamp = contract.vm().block_timestamp();

    let mut total_client_bps: u32 = 0;
    let mut revealed_votes: u32 = 0;

    {
        let dispute = contract.disputes.getter(dispute_id);

        // Dispute exists
        if dispute.job_id.get().is_zero() {
            return Err(
                EscrowError::DisputeNotFound(
                    DisputeNotFound {},
                ),
            );
        }

        // Reveal phase must be over
        if timestamp
            < dispute.vote_reveal_deadline.get().to::<u64>()
        {
            return Err(
                EscrowError::RevealWindowNotOpen(
                    RevealWindowNotOpen {},
                ),
            );
        }

        let juror_count = dispute.jurors.len();

        for i in 0..juror_count {

            if let Some(juror) = dispute.jurors.get(i) {

                let vote =
                    dispute.votes.getter(juror);

                if vote.has_revealed.get() {

                    total_client_bps += vote
                        .revealed_client_bps
                        .get()
                        .to::<u16>() as u32;

                    revealed_votes += 1;
                }
            }
        }
    }

    // Nobody revealed
    if revealed_votes == 0 {
        return Ok(());
    }

    let average_client_bps =
        (total_client_bps / revealed_votes) as u16;

    let average_freelancer_bps =
        BPS_DENOMINATOR - average_client_bps;

    {
        let mut dispute =
            contract.disputes.setter(dispute_id);

        dispute.final_client_bps.set(
            U16::from(average_client_bps),
        );

        dispute.final_freelancer_bps.set(
            U16::from(average_freelancer_bps),
        );

        dispute.stage.set(
            U8::from(DisputeStage::ResolvedJury as u8),
        );
    }

    contract.vm().log(
        DisputeResolvedJury {
            dispute_id,
            client_bps: average_client_bps,
            freelancer_bps: average_freelancer_bps,
        },
    );

    Ok(())
}