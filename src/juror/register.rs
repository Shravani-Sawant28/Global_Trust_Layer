use alloy_primitives::{U256, U64};
use stylus_sdk::prelude::*;

use crate::{
    errors::{
        AlreadyRegistered,
        EscrowError,
    },
    events::JurorRegistered,
    types::JurorStatus,
    EscrowContract,
};

pub fn register_juror(
    contract: &mut EscrowContract,
) -> Result<(), EscrowError> {

    let caller = contract.vm().msg_sender();
    let timestamp = contract.vm().block_timestamp();

    {
        let mut juror = contract.jurors.setter(caller);

        // Already registered?
        if juror.registered.get() {
            return Err(
                EscrowError::AlreadyRegistered(
                    AlreadyRegistered {},
                ),
            );
        }

        juror.registered.set(true);

        juror.status.set(JurorStatus::Active.into());

        juror.joined_at.set(
            U64::from(timestamp),
        );

        juror.staked_amount.set(U256::ZERO);

        juror.total_votes.set(U64::ZERO);

        juror.correct_votes.set(U64::ZERO);
    }

    // Add juror to registry
    contract.juror_registry.push(caller);

    contract.vm().log(
        JurorRegistered {
            juror: caller,
        },
    );

    Ok(())
}