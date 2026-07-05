use alloy_primitives::{U16, U256, U64, U8};
use stylus_sdk::prelude::*;

use crate::{
    constants::BPS_DENOMINATOR,
    dispute::resolve_mutual::resolve_mutual,
    errors::{
        DisputeNotFound,
        DisputeStageMismatch,
        EscrowError,
        InvalidBps,
        NotJobParty,
    },
    events::{DisputeResolvedMutual, SplitProposed},
    types::DisputeStage,
    EscrowContract,
};

pub fn propose_settlement(
    contract: &mut EscrowContract,
    dispute_id: U256,
    client_bps: u16,
) -> Result<(), EscrowError> {

    if client_bps > BPS_DENOMINATOR {
        return Err(EscrowError::InvalidBps(
            InvalidBps {},
        ));
    }

    let caller = contract.vm().msg_sender();
    let timestamp = contract.vm().block_timestamp();

    let mut should_resolve = false;

    {
        let mut dispute =
            contract.disputes.setter(dispute_id);

        // Exists
        if dispute.job_id.get().is_zero() {
            return Err(EscrowError::DisputeNotFound(
                DisputeNotFound {},
            ));
        }

        // Must still be in mutual settlement stage
        if dispute.stage.get()
            != U8::from(DisputeStage::MutualSettlement as u8)
        {
            return Err(
                EscrowError::DisputeStageMismatch(
                    DisputeStageMismatch {},
                ),
            );
        }

        // Determine caller
        let job =
            contract.jobs.getter(dispute.job_id.get());

        if caller == job.client.get() {

            dispute.client_proposed.set(true);
            dispute
                .client_proposal_bps
                .set(U16::from(client_bps));
            dispute.client_proposed_at.set(U64::from(timestamp));

        } else if caller == job.freelancer.get() {

            dispute.freelancer_proposed.set(true);
            dispute
                .freelancer_proposal_bps
                .set(U16::from(client_bps));

            dispute
                .freelancer_proposed_at
                .set(U64::from(timestamp));

        } else {

            return Err(EscrowError::NotJobParty(
                NotJobParty {},
            ));
        }

        if dispute.client_proposed.get()
            && dispute.freelancer_proposed.get()
            && dispute.client_proposal_bps.get()
                == dispute.freelancer_proposal_bps.get()
        {
            should_resolve = true;
        }
    }

    contract.vm().log(SplitProposed {
        dispute_id,
        proposer: caller,
        client_bps,
    });

    if should_resolve {

        resolve_mutual(
            contract,
            dispute_id,
            client_bps,
        )?;

        contract.vm().log(
            DisputeResolvedMutual {
                dispute_id,
                client_bps,
                freelancer_bps:
                    BPS_DENOMINATOR - client_bps,
            },
        );
    }

    Ok(())
}