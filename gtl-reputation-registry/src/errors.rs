use stylus_sdk::alloy_sol_types::sol;
use stylus_sdk::prelude::*;

sol! {
    error OnlyEscrow();
    error OnlyOwner();
    error AlreadySet();
    error InvalidAddress();
    error InvalidResolutionType();
}

#[derive(SolidityError)]
pub enum ReputationError {
    OnlyEscrow(OnlyEscrow),
    OnlyOwner(OnlyOwner),
    AlreadySet(AlreadySet),
    InvalidAddress(InvalidAddress),
    InvalidResolutionType(InvalidResolutionType),
}