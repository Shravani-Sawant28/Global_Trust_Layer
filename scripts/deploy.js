const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
    const [deployer] = await ethers.getSigners();

    console.log("=".repeat(50));
    console.log("Deploying Global Trust Layer Contracts");
    console.log("=".repeat(50));
    console.log("Deployer address:", deployer.address);

    const balance = await ethers.provider.getBalance(deployer.address);
    console.log("Deployer ETH balance:", ethers.formatEther(balance), "ETH");
    console.log("=".repeat(50));

    // ── Step 1: Deploy MockUSDC ──────────────────────────────────────
    console.log("\n[1/4] Deploying MockUSDC...");
    const USDC = await ethers.getContractFactory("MockUSDC");
    const usdc = await USDC.deploy();
    await usdc.waitForDeployment();
    console.log("✅ MockUSDC deployed at:", usdc.target);

    // ── Step 2: Deploy ReputationRegistry ───────────────────────────
    console.log("\n[2/4] Deploying ReputationRegistry...");
    const Reputation = await ethers.getContractFactory("ReputationRegistry");
    const reputation = await Reputation.deploy();
    await reputation.waitForDeployment();
    console.log("✅ ReputationRegistry deployed at:", reputation.target);

    // ── Step 3: Deploy EscrowFactory ────────────────────────────────
    console.log("\n[3/4] Deploying EscrowFactory...");
    const Escrow = await ethers.getContractFactory("EscrowFactory");
    const escrow = await Escrow.deploy(
        usdc.target,
        deployer.address,   // arbiter = your wallet for MVP
        reputation.target
    );
    await escrow.waitForDeployment();
    console.log("✅ EscrowFactory deployed at:", escrow.target);

    // ── Step 4: Link contracts ───────────────────────────────────────
    console.log("\n[4/4] Linking ReputationRegistry to EscrowFactory...");
    const tx = await reputation.setEscrowFactory(escrow.target);
    await tx.wait();
    console.log("✅ Contracts linked successfully");

    // ── Save addresses ───────────────────────────────────────────────
    const addresses = {
        network: "arbitrumSepolia",
        chainId: 421614,
        deployedAt: new Date().toISOString(),
        deployer: deployer.address,
        contracts: {
            MockUSDC: usdc.target,
            ReputationRegistry: reputation.target,
            EscrowFactory: escrow.target,
        },
    };

    const deploymentsDir = path.join(__dirname, "../deployments");
    if (!fs.existsSync(deploymentsDir)) fs.mkdirSync(deploymentsDir);

    fs.writeFileSync(
        path.join(deploymentsDir, "addresses.json"),
        JSON.stringify(addresses, null, 2)
    );

    console.log("\n" + "=".repeat(50));
    console.log("ALL CONTRACTS DEPLOYED SUCCESSFULLY");
    console.log("=".repeat(50));
    console.log("MockUSDC:            ", usdc.target);
    console.log("ReputationRegistry:  ", reputation.target);
    console.log("EscrowFactory:       ", escrow.target);
    console.log("Addresses saved to:   deployments/addresses.json");
    console.log("\nShare deployments/addresses.json with your teammates.");
    console.log("=".repeat(50));
}

main().catch((error) => {
    console.error(error);
    process.exit(1);
});