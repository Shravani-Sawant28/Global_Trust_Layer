// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/**
 * @title MockUSDC
 * @notice Fake USDC for testnet only. Anyone can mint freely.
 * @dev Uses 6 decimals like real USDC. 1 USDC = 1_000000
 */
contract MockUSDC is ERC20 {
    constructor() ERC20("Mock USDC", "USDC") {}

    /**
     * @notice Mint any amount to any address. Testnet only.
     */
    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }

    /**
     * @notice USDC uses 6 decimals, not 18
     */
    function decimals() public pure override returns (uint8) {
        return 6;
    }
}