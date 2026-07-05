use alloy_primitives::Address;
use stylus_sdk::prelude::*;

use crate::errors::{EscrowError, InvalidAddress, Unauthorized};
use crate::EscrowContract;

pub fn initialize(
    contract: &mut EscrowContract,
    usdc_token: Address,
    gtl_token: Address,
    fee_recipient: Address,
    ai_oracle: Address,
) -> Result<(), EscrowError> {

    // Can only initialize once
    if contract.initialized.get() {
        return Err(EscrowError::Unauthorized(Unauthorized {}));
    }

    // Validate addresses
    if usdc_token == Address::ZERO
        || gtl_token == Address::ZERO
        || fee_recipient == Address::ZERO
    {
        return Err(EscrowError::InvalidAddress(InvalidAddress {}));
    }

    // Store admin
    contract.admin.set(contract.vm().msg_sender());

    // Store addresses
    contract.usdc_token.set(usdc_token);
    contract.gtl_token.set(gtl_token);
    contract.fee_recipient.set(fee_recipient);

    contract.ai_oracle.set(ai_oracle);

    // Mark initialized
    contract.initialized.set(true);

    Ok(())
}