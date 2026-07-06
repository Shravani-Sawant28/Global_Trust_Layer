//! Platform-wide constants.

// Basis points denominator (100%)
pub const BPS_DENOMINATOR: u16 = 10_000;

// Platform fee (2%)
pub const PLATFORM_FEE_BPS: u16 = 200;

// Arbitration fee (1%)
pub const ARBITRATION_FEE_BPS: u16 = 100;

// Maximum milestones allowed per job
pub const MAX_MILESTONES: usize = 10;

// Dispute window (72 hours)
pub const DISPUTE_WINDOW_SECS: u64 = 72 * 60 * 60;

// Auto release grace period (7 days)
pub const GRACE_PERIOD_SECS: u64 = 7 * 24 * 60 * 60;

pub const JURY_SIZE: usize = 5;

pub const COMMIT_WINDOW: u64 = 24 * 60 * 60;

pub const REVEAL_WINDOW: u64 = 24 * 60 * 60;

pub const MIN_JUROR_STAKE: u64 = 1000;