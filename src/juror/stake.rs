use alloy_primitives::U256;
use stylus_sdk::prelude::*;

use crate::{
    errors::{
        EscrowError,
        InvalidAmount,
        JurorNotRegistered,
    },
    events::JurorStaked,
    EscrowContract,
};

pub fn stake(
    contract: &mut EscrowContract,
    amount: U256,
) -> Result<(), EscrowError> {

    if amount.is_zero() {
        return Err(
            EscrowError::InvalidAmount(
                InvalidAmount {},
            ),
        );
    }

    let caller = contract.vm().msg_sender();

    {
        let mut juror =
            contract.jurors.setter(caller);

        if !juror.registered.get() {
            return Err(
                EscrowError::JurorNotRegistered(
                    JurorNotRegistered {},
                ),
            );
        }

        let current =
            juror.staked_amount.get();

        juror.staked_amount.set(
            current + amount,
        );
    }

    contract.vm().log(
        JurorStaked {
            juror: caller,
            amount,
        },
    );

    Ok(())
}