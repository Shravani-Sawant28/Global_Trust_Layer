use stylus_sdk::alloy_primitives::U256;
use crate::constants::*;

pub fn score_after_completion(current: U256) -> U256 {
    let new_score = current + U256::from(COMPLETION_REWARD);
    if new_score > U256::from(MAX_SCORE) { U256::from(MAX_SCORE) } else { new_score }
}

pub fn score_after_late_delivery(current: U256) -> U256 {
    let penalty = U256::from(LATE_DELIVERY_PENALTY);
    if current > penalty { current - penalty } else { U256::from(MIN_SCORE) }
}

pub fn score_after_dispute_loss(current: U256) -> U256 {
    let penalty = U256::from(DISPUTE_LOSS_PENALTY);
    if current > penalty { current - penalty } else { U256::from(MIN_SCORE) }
}

pub fn score_after_ghosting(current: U256) -> U256 {
    let penalty = U256::from(GHOSTING_PENALTY);
    if current > penalty { current - penalty } else { U256::from(MIN_SCORE) }
}

/// Interprets a resolved dispute's clientBps to decide if the freelancer was at fault.
/// clientBps >= FREELANCER_CLEARLY_WRONG_BPS means the client's side won convincingly.
pub fn freelancer_was_at_fault(client_bps: U256) -> bool {
    client_bps >= U256::from(FREELANCER_CLEARLY_WRONG_BPS)
}

pub fn client_was_at_fault(client_bps: U256) -> bool {
    client_bps <= U256::from(CLIENT_CLEARLY_WRONG_BPS)
}