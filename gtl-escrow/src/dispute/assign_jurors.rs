use alloc::vec::Vec;

use alloy_primitives::{Address, U256};
use stylus_sdk::prelude::*;

use crate::{
    constants::JURY_SIZE,
    errors::{
        DisputeNotFound,
        DisputeStageMismatch,
        EscrowError,
        JurorNotEligible,
        Unauthorized,
    },
    types::{DisputeStage, JurorStatus},
    EscrowContract,
};

pub fn assign_jurors(
    contract: &mut EscrowContract,
    dispute_id: U256,
    jurors: Vec<Address>,
) -> Result<(), EscrowError> {

    let caller = contract.vm().msg_sender();

    // Only AI Oracle can assign jurors
    if caller != contract.ai_oracle.get() {
        return Err(
            EscrowError::Unauthorized(
                Unauthorized {},
            ),
        );
    }

    if jurors.len() != JURY_SIZE {
        return Err(
            EscrowError::JurorNotEligible(
                JurorNotEligible {},
            ),
        );
    }

    {
        let mut dispute =
            contract.disputes.setter(dispute_id);

        if dispute.job_id.get().is_zero() {
            return Err(
                EscrowError::DisputeNotFound(
                    DisputeNotFound {},
                ),
            );
        }

        if dispute.stage.get().to::<u8>()
            != DisputeStage::JurorVoting as u8
        {
            return Err(
                EscrowError::DisputeStageMismatch(
                    DisputeStageMismatch {},
                ),
            );
        }

        for address in jurors {

            let juror =
                contract.jurors.getter(address);

            if !juror.registered.get() {
                return Err(
                    EscrowError::JurorNotEligible(
                        JurorNotEligible {},
                    ),
                );
            }

            if juror.status.get().to::<u8>()
                != JurorStatus::Active as u8
            {
                return Err(
                    EscrowError::JurorNotEligible(
                        JurorNotEligible {},
                    ),
                );
            }

            dispute.jurors.push(address);
        }
    }

    Ok(())
}