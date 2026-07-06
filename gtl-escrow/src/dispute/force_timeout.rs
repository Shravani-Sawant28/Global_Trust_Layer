use alloy_primitives::{U8, U256};
use stylus_sdk::prelude::*;

use crate::{
    constants::BPS_DENOMINATOR,
    errors::{
        DeadlockNotReached,
        DisputeNotFound,
        DisputeStageMismatch,
        EscrowError,
    },
    events::DisputeResolvedTimeout,
    payment::execute_settlement::execute_settlement,
    types::DisputeStage,
    EscrowContract,
};

pub fn force_timeout(
    contract: &mut EscrowContract,
    dispute_id: U256,
) -> Result<(), EscrowError> {

    let timestamp = contract.vm().block_timestamp();

    {
        let dispute = contract.disputes.getter(dispute_id);

        // Dispute must exist
        if dispute.job_id.get().is_zero() {
            return Err(EscrowError::DisputeNotFound(
                DisputeNotFound {},
            ));
        }

        // Cannot already be resolved
        let stage = dispute.stage.get();

        if stage == U8::from(DisputeStage::ResolvedMutual as u8)
            || stage == U8::from(DisputeStage::ResolvedAi as u8)
            || stage == U8::from(DisputeStage::ResolvedJury as u8)
            || stage == U8::from(DisputeStage::ResolvedTimeout as u8)
        {
            return Err(
                EscrowError::DisputeStageMismatch(
                    DisputeStageMismatch {},
                ),
            );
        }

        // Deadline must be reached
        if timestamp < dispute.overall_deadline.get().to::<u64>() {
            return Err(
                EscrowError::DeadlockNotReached(
                    DeadlockNotReached {},
                ),
            );
        }
    }

    // Execute 50/50 settlement
    execute_settlement(
        contract,
        dispute_id,
        DisputeStage::ResolvedTimeout,
        BPS_DENOMINATOR / 2,
    )?;

    contract.vm().log(
        DisputeResolvedTimeout {
            dispute_id,
        },
    );

    Ok(())
}