const { ethers } = require("hardhat");

async function main() {

    const [deployer] = await ethers.getSigners();
    
    // Paste your deployed contract address here
    const CONTRACT_ADDRESS = "0x40c6B2CCB51012aDB50e70EFdC5D1d35223f5421";
    
    // Get contract instance
    const registry = await ethers.getContractAt(
        "ReputationRegistry", 
        CONTRACT_ADDRESS
    );

    console.log("Testing ReputationRegistry...");
    console.log("Contract Address:", CONTRACT_ADDRESS);
    console.log("Deployer:", deployer.address);
    console.log("─────────────────────────────────");

    // TEST 1 — getProfile on fresh wallet
    console.log("\nTEST 1 — getProfile on fresh wallet");
    const profile = await registry.getProfile(deployer.address);
    console.log("exists:", profile.exists);
    console.log("trustScore:", profile.trustScore.toString());
    console.log("Expected: exists=false, trustScore=0");

    // TEST 2 — getTrustScore on fresh wallet
    console.log("\nTEST 2 — getTrustScore on fresh wallet");
    const score = await registry.getTrustScore(deployer.address);
    console.log("score:", score.toString());
    console.log("Expected: 0");

    // TEST 3 — profileExists on fresh wallet
    console.log("\nTEST 3 — profileExists on fresh wallet");
    const exists = await registry.profileExists(deployer.address);
    console.log("exists:", exists);
    console.log("Expected: false");

    // TEST 4 — setEscrowContract to deployer wallet temporarily
    console.log("\nTEST 4 — setEscrowContract to deployer");
    const setTx = await registry.setEscrowContract(deployer.address);
    await setTx.wait();
    console.log("Escrow contract set to deployer wallet");
    console.log("Tx hash:", setTx.hash);

    // TEST 5 — updateReputation with clean completion
    console.log("\nTEST 5 — updateReputation (clean completion)");
    const updateTx = await registry.updateReputation(
        deployer.address,           // freelancer
        "0x000000000000000000000000000000000000dEaD", // client (burn address as dummy)
        1,                          // outcome 1 = clean completion
        ethers.parseEther("1.0")    // 1 ETH
    );
    await updateTx.wait();
    console.log("updateReputation called successfully");
    console.log("Tx hash:", updateTx.hash);

    // TEST 6 — getProfile after update
    console.log("\nTEST 6 — getProfile after clean completion");
    const updatedProfile = await registry.getProfile(deployer.address);
    console.log("exists:", updatedProfile.exists);
    console.log("trustScore:", updatedProfile.trustScore.toString());
    console.log("jobsCompleted:", updatedProfile.jobsCompleted.toString());
    console.log("firstTransactionDate:", updatedProfile.firstTransactionDate.toString());
    console.log("Expected: exists=true, trustScore=60, jobsCompleted=1");

    // TEST 7 — profileExists after update
    console.log("\nTEST 7 — profileExists after update");
    const existsAfter = await registry.profileExists(deployer.address);
    console.log("exists:", existsAfter);
    console.log("Expected: true");

    // TEST 8 — getTrustScore after update
    console.log("\nTEST 8 — getTrustScore after update");
    const scoreAfter = await registry.getTrustScore(deployer.address);
    console.log("score:", scoreAfter.toString());
    console.log("Expected: 60");

    // TEST 9 — updateReputation with ghost penalty
    console.log("\nTEST 9 — updateReputation (ghost penalty)");
    const ghostTx = await registry.updateReputation(
        deployer.address,
        "0x000000000000000000000000000000000000dEaD",
        2,                          // outcome 2 = freelancer ghosted
        ethers.parseEther("1.0")
    );
    await ghostTx.wait();
    const scoreAfterGhost = await registry.getTrustScore(deployer.address);
    console.log("score after ghost penalty:", scoreAfterGhost.toString());
    console.log("Expected: 40 (60 - 20)");

    // TEST 10 — getStats
    console.log("\nTEST 10 — getStats");
    const stats = await registry.getStats(deployer.address);
    console.log("score:", stats.score.toString());
    console.log("completed:", stats.completed.toString());
    console.log("disputesRaised:", stats.disputesRaised.toString());
    console.log("disputesLost:", stats.disputesLost.toString());
    console.log("memberSince:", stats.memberSince.toString());

    console.log("\n─────────────────────────────────");
    console.log("All tests complete!");
    console.log("Check tx hashes on sepolia.arbiscan.io to confirm on-chain");
}

main().catch(console.error);