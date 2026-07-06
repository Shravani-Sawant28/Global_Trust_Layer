use stylus_sdk::prelude::*;
use stylus_sdk::alloy_primitives::{Address, U256};

sol_storage! {
    pub struct ClientPassport {
        uint256 trust_score;
        uint256 jobs_completed;
        uint256 disputes_involved;
        uint256 disputes_lost;
        uint256 total_volume;
        uint256 member_since;
        uint256 last_updated;
    }

    pub struct FreelancerPassport {
        uint256 trust_score;
        uint256 jobs_completed;
        uint256 on_time_deliveries;
        uint256 late_deliveries;
        uint256 disputes_involved;
        uint256 disputes_lost;
        uint256 ghosting_count;
        uint256 total_volume;
        uint256 member_since;
        uint256 last_updated;
    }

    pub struct JurorPassport {
        uint256 trust_score;
        uint256 cases_handled;
        uint256 correct_votes;
        uint256 wrong_votes;
        uint256 member_since;
        uint256 last_updated;
    }
}