use alloy_primitives::{FixedBytes, U16, U64, U8, U256};
use stylus_sdk::prelude::*;

use crate::{
    constants::BPS_DENOMINATOR,
    errors::{
        DisputeNotFound,
        DisputeStageMismatch,
        EscrowError,
        InvalidBps,
        Unauthorized,
    },
    events::AiReportSubmitted,
    types::DisputeStage,
    EscrowContract,
};

pub fn submit_ai_report(
    contract: &mut EscrowContract,
    dispute_id: U256,
    report_hash: FixedBytes<32>,
    confidence: u8,
    suggested_client_bps: u16,
) -> Result<(), EscrowError> {

    if suggested_client_bps > BPS_DENOMINATOR {
        return Err(
            EscrowError::InvalidBps(
                InvalidBps {},
            ),
        );
    }

    let timestamp = contract.vm().block_timestamp();

    let caller = contract.vm().msg_sender();

    if caller != contract.ai_oracle.get() {
        return Err(EscrowError::Unauthorized(
            Unauthorized {},
        ));
    }

    {
        let mut dispute =
            contract.disputes.setter(dispute_id);

        // Must exist
        if dispute.job_id.get().is_zero() {
            return Err(
                EscrowError::DisputeNotFound(
                    DisputeNotFound {},
                ),
            );
        }

        // Must still be in mutual stage
        if dispute.stage.get()
            != U8::from(
                DisputeStage::MutualSettlement as u8,
            )
        {
            return Err(
                EscrowError::DisputeStageMismatch(
                    DisputeStageMismatch {},
                ),
            );
        }

        dispute.ai_report_hash.set(report_hash);

        dispute
            .ai_confidence
            .set(U8::from(confidence));

        dispute
            .ai_report_timestamp
            .set(U64::from(timestamp));

        dispute
            .ai_suggested_client_bps
            .set(U16::from(
                suggested_client_bps,
            ));

        dispute.stage.set(
            U8::from(
                DisputeStage::AiProposed as u8,
            ),
        );
    }

    contract.vm().log(AiReportSubmitted {
        dispute_id,
        report_hash,
        confidence,
        suggested_client_bps,
    });

    Ok(())
}