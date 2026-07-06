use stylus_sdk::alloy_primitives::U256;
use crate::constants::*;

pub fn score_after_correct_vote(current: U256) -> U256 {
    let new_score = current + U256::from(JUROR_CORRECT_VOTE_REWARD);
    if new_score > U256::from(MAX_SCORE) { U256::from(MAX_SCORE) } else { new_score }
}

pub fn score_after_wrong_vote(current: U256) -> U256 {
    let penalty = U256::from(JUROR_WRONG_VOTE_PENALTY);
    if current > penalty { current - penalty } else { U256::from(MIN_SCORE) }
}