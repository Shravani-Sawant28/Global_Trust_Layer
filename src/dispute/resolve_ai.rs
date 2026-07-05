use alloy_primitives::U256;

use crate::{
    errors::EscrowError,
    payment::execute_settlement::execute_settlement,
    EscrowContract,
};

pub(crate) fn resolve_ai(
    contract: &mut EscrowContract,
    dispute_id: U256,
) -> Result<(), EscrowError> {

    let dispute =
        contract.disputes.getter(dispute_id);

    let client_bps =
        dispute.ai_suggested_client_bps.get().to::<u16>();

    execute_settlement(
        contract,
        dispute_id,
        crate::types::DisputeStage::ResolvedAi,
        client_bps,
    )?;

    Ok(())
}