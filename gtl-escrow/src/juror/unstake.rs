use alloy_primitives::U256;
use stylus_sdk::prelude::*;

use crate::{
    errors::{
        EscrowError,
        InsufficientStake,
        InvalidAmount,
        JurorNotRegistered,
    },
    events::JurorUnstaked,
    EscrowContract,
};

pub fn unstake(
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

        if amount > current {
            return Err(
                EscrowError::InsufficientStake(
                    InsufficientStake {},
                ),
            );
        }

        juror.staked_amount.set(
            current - amount,
        );
    }

    contract.vm().log(
        JurorUnstaked {
            juror: caller,
            amount,
        },
    );

    Ok(())
}