// Central place for every tunable number — never hardcode these elsewhere.

pub const BPS_DENOMINATOR: u64 = 10000;

pub const STARTING_SCORE: u64 = 500;
pub const MAX_SCORE: u64 = 1000;
pub const MIN_SCORE: u64 = 0;

// Happy-path completion reward
pub const COMPLETION_REWARD: u64 = 10;

// Dispute outcome thresholds — mirrors how a clientBps split implies fault
pub const CLIENT_CLEARLY_WRONG_BPS: u64 = 3000;   // clientBps <= this => freelancer was right
pub const FREELANCER_CLEARLY_WRONG_BPS: u64 = 7000; // clientBps >= this => client was right

pub const DISPUTE_LOSS_PENALTY: u64 = 50;
pub const GHOSTING_PENALTY: u64 = 100;
pub const LATE_DELIVERY_PENALTY: u64 = 5;

// Juror scoring
pub const JUROR_CORRECT_VOTE_REWARD: u64 = 15;
pub const JUROR_WRONG_VOTE_PENALTY: u64 = 20;