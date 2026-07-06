use stylus_sdk::alloy_primitives::Address;
use stylus_sdk::msg;
use crate::errors::{ReputationError, OnlyEscrow};

/// Call this at the top of every state-changing function that only EscrowFactory should trigger.
pub fn require_escrow(escrow_factory: Address) -> Result<(), ReputationError> {
    if msg::sender() != escrow_factory {
        return Err(ReputationError::OnlyEscrow(OnlyEscrow {}));
    }
    Ok(())
}