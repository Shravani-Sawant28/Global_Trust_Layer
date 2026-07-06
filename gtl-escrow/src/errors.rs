//! Contract errors, exposed as Solidity custom errors.
//!
//! Each error becomes a real Solidity `error X();` declaration (visible in
//! `cargo stylus export-abi`), and #[derive(SolidityError)] auto-generates
//! the From<EscrowError> for Vec<u8> conversion that #[public] methods need
//! for their Result<T, Vec<u8>> return type.

use alloy_sol_types::sol;
use stylus_sdk::prelude::*;

sol! {
    error Unauthorized();
    error InvalidAddress();
    error InvalidJob();
    error InvalidMilestone();
    error InvalidAmount();
    error InvalidState();

    error AlreadyFunded();
    error AlreadyReleased();
    error AlreadyDelivered();
    error AlreadyRegistered();

    error JobNotFound();
    error MilestoneNotFound();
    error NotJobParty();

    error DisputeAlreadyExists();
    error DisputeNotFound();
    error DisputeStageMismatch();

    error InvalidBps();
    error AlreadyProposed();
    error AlreadyAcceptedAi();

    error CommitWindowClosed();
    error RevealWindowNotOpen();
    error RevealWindowClosed();
    error CommitmentMismatch();
    error AlreadyCommitted();
    error AlreadyRevealed();
    error DeadlockNotReached();

    error VotingClosed();
    error VotingNotStarted();

    error JurorNotEligible();
    error InsufficientStake();

    error ArithmeticOverflow();

    error JurorAlreadyActive();
    error JurorNotRegistered();
}

#[derive(SolidityError)]
pub enum EscrowError {
    Unauthorized(Unauthorized),
    InvalidAddress(InvalidAddress),
    InvalidJob(InvalidJob),
    InvalidMilestone(InvalidMilestone),
    InvalidAmount(InvalidAmount),
    InvalidState(InvalidState),

    AlreadyFunded(AlreadyFunded),
    AlreadyReleased(AlreadyReleased),
    AlreadyDelivered(AlreadyDelivered),
    AlreadyRegistered(AlreadyRegistered),

    JobNotFound(JobNotFound),
    MilestoneNotFound(MilestoneNotFound),
    NotJobParty(NotJobParty),

    DisputeAlreadyExists(DisputeAlreadyExists),
    DisputeNotFound(DisputeNotFound),
    DisputeStageMismatch(DisputeStageMismatch),

    InvalidBps(InvalidBps),
    AlreadyProposed(AlreadyProposed),
    AlreadyAcceptedAi(AlreadyAcceptedAi),

    CommitWindowClosed(CommitWindowClosed),
    RevealWindowNotOpen(RevealWindowNotOpen),
    RevealWindowClosed(RevealWindowClosed),
    CommitmentMismatch(CommitmentMismatch),
    AlreadyCommitted(AlreadyCommitted),
    AlreadyRevealed(AlreadyRevealed),
    DeadlockNotReached(DeadlockNotReached),

    VotingClosed(VotingClosed),
    VotingNotStarted(VotingNotStarted),

    JurorNotEligible(JurorNotEligible),
    InsufficientStake(InsufficientStake),

    ArithmeticOverflow(ArithmeticOverflow),

    JurorAlreadyActive(JurorAlreadyActive),
    JurorNotRegistered(JurorNotRegistered),
}