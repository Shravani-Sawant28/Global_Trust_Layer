use stylus_sdk::alloy_primitives::{Address, U256};
use crate::constants::*;

/// Pure scoring logic for client-side events. No storage access here —
/// lib.rs owns storage, these functions just compute the new score.

pub fn score_after_completion(current: U256) -> U256 {
    let new_score = current + U256::from(COMPLETION_REWARD);
    if new_score > U256::from(MAX_SCORE) { U256::from(MAX_SCORE) } else { new_score }
}

pub fn score_after_dispute_loss(current: U256) -> U256 {
    let penalty = U256::from(DISPUTE_LOSS_PENALTY);
    if current > penalty { current - penalty } else { U256::from(MIN_SCORE) }
}