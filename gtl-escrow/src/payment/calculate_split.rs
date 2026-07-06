use alloy_primitives::U256;

use crate::constants::BPS_DENOMINATOR;

/// Calculates how much goes to the client and freelancer
/// from a total amount using basis points.
///
/// Returns:
/// (client_amount, freelancer_amount)
pub fn calculate_split(
    total: U256,
    client_bps: u16,
) -> (U256, U256) {

    let client_amount =
        total * U256::from(client_bps)
            / U256::from(BPS_DENOMINATOR);

    let freelancer_amount =
        total - client_amount;

    (client_amount, freelancer_amount)
}