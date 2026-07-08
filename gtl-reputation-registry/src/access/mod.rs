use stylus_sdk::alloy_primitives::Address;
use crate::errors::{ReputationError, OnlyEscrow};

/// Call this at the top of every state-changing function that only EscrowFactory should trigger.
/// The caller is responsible for passing `self.vm().msg_sender()` as the `caller` argument,
/// since msg access is now done via the HostAccess trait on the contract struct.
pub fn require_escrow(escrow_factory: Address, caller: Address) -> Result<(), ReputationError> {
    if caller != escrow_factory {
        return Err(ReputationError::OnlyEscrow(OnlyEscrow {}));
    }
    Ok(())
}