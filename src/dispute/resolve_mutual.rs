use alloy_primitives::U256;

use crate::{
    errors::EscrowError,
    payment::execute_settlement::execute_settlement,
    types::DisputeStage,
    EscrowContract,
};

pub(crate) fn resolve_mutual(
    contract: &mut EscrowContract,
    dispute_id: U256,
    client_bps: u16,
) -> Result<(), EscrowError> {
    execute_settlement(
        contract,
        dispute_id,
        DisputeStage::ResolvedMutual,
        client_bps,
    )?;

    Ok(())
}