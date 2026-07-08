// Events emitted by the ReputationRegistry contract.
// Uses the sol! macro to define Solidity ABI-compatible event structs.
// Emitted via `self.vm().log(EventName { ... })` using the HostAccess trait in SDK 0.10.7.

use stylus_sdk::alloy_sol_types::sol;

sol! {
    /// Emitted once when the escrow factory address is permanently set.
    event EscrowFactorySet(address indexed escrowFactory);

    /// Emitted whenever a wallet's trust score increases.
    event ScoreIncreased(
        address indexed wallet,
        uint256 points,
        uint256 newScore,
        string  reason
    );

    /// Emitted the first time a wallet gets a passport (client or freelancer).
    event PassportCreated(address indexed wallet, uint256 timestamp);

    /// Emitted after a juror's vote is recorded and their score updated.
    event JurorVoteRecorded(address indexed juror, bool wasCorrect);
}
