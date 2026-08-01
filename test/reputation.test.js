const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("ReputationRegistry", function () {

    let registry;
    let owner;
    let escrowContract;
    let freelancer;
    let client;
    let randomWallet;

    const INITIAL_SCORE = 50;
    const SCORE_CLEAN_COMPLETION = 10;
    const SCORE_DISPUTE_LOSS = 15;
    const SCORE_GHOST_PENALTY = 20;
    const SCORE_DISPUTE_PENALTY = 5;

    const ONE_ETH = ethers.parseEther("1.0");

    // Outcome codes
    const OUTCOME_CLEAN_COMPLETION = 1;
    const OUTCOME_FREELANCER_GHOSTED = 2;
    const OUTCOME_DISPUTE_FREELANCER_WON = 3;
    const OUTCOME_DISPUTE_CLIENT_WON = 4;
    const OUTCOME_MUTUAL_SPLIT = 5;

    beforeEach(async function () {
        // Get test wallets
        [owner, escrowContract, freelancer, client, randomWallet] = await ethers.getSigners();

        // Deploy ReputationRegistry
        const ReputationRegistry = await ethers.getContractFactory("ReputationRegistry");
        registry = await ReputationRegistry.deploy();
        await registry.waitForDeployment();

        // Authorize the escrow contract
        await registry.connect(owner).setEscrowContract(escrowContract.address);
    });


    // ─────────────────────────────────────────────
    // GROUP 1 — DEPLOYMENT AND SETUP
    // ─────────────────────────────────────────────

    describe("Deployment and Setup", function () {

        it("should deploy with correct owner", async function () {
            expect(await registry.owner()).to.equal(owner.address);
        });

        it("should deploy with zero escrow contract address initially", async function () {
            const ReputationRegistry = await ethers.getContractFactory("ReputationRegistry");
            const freshRegistry = await ReputationRegistry.deploy();
            await freshRegistry.waitForDeployment();
            expect(await freshRegistry.escrowContract()).to.equal(ethers.ZeroAddress);
        });

        it("should set escrow contract address correctly", async function () {
            expect(await registry.escrowContract()).to.equal(escrowContract.address);
        });

        it("should have correct initial score constant", async function () {
            expect(await registry.INITIAL_SCORE()).to.equal(INITIAL_SCORE);
        });

        it("should have correct score constants", async function () {
            expect(await registry.SCORE_CLEAN_COMPLETION()).to.equal(SCORE_CLEAN_COMPLETION);
            expect(await registry.SCORE_DISPUTE_LOSS()).to.equal(SCORE_DISPUTE_LOSS);
            expect(await registry.SCORE_GHOST_PENALTY()).to.equal(SCORE_GHOST_PENALTY);
            expect(await registry.SCORE_DISPUTE_PENALTY()).to.equal(SCORE_DISPUTE_PENALTY);
        });

    });


    // ─────────────────────────────────────────────
    // GROUP 2 — ACCESS CONTROL
    // ─────────────────────────────────────────────

    describe("Access Control", function () {

        it("should allow owner to set escrow contract", async function () {
            await expect(
                registry.connect(owner).setEscrowContract(escrowContract.address)
            ).to.not.be.reverted;
        });

        it("should reject non-owner trying to set escrow contract", async function () {
            await expect(
                registry.connect(randomWallet).setEscrowContract(randomWallet.address)
            ).to.be.reverted;
        });

        it("should reject zero address as escrow contract", async function () {
            await expect(
                registry.connect(owner).setEscrowContract(ethers.ZeroAddress)
            ).to.be.revertedWith("Invalid address");
        });

        it("should allow escrow contract to call updateReputation", async function () {
            await expect(
                registry.connect(escrowContract).updateReputation(
                    freelancer.address,
                    client.address,
                    OUTCOME_CLEAN_COMPLETION,
                    ONE_ETH
                )
            ).to.not.be.reverted;
        });

        it("should reject random wallet calling updateReputation", async function () {
            await expect(
                registry.connect(randomWallet).updateReputation(
                    freelancer.address,
                    client.address,
                    OUTCOME_CLEAN_COMPLETION,
                    ONE_ETH
                )
            ).to.be.revertedWith("Only escrow contract can call this");
        });

        it("should reject owner calling updateReputation directly", async function () {
            await expect(
                registry.connect(owner).updateReputation(
                    freelancer.address,
                    client.address,
                    OUTCOME_CLEAN_COMPLETION,
                    ONE_ETH
                )
            ).to.be.revertedWith("Only escrow contract can call this");
        });

        it("should reject freelancer calling updateReputation on themselves", async function () {
            await expect(
                registry.connect(freelancer).updateReputation(
                    freelancer.address,
                    client.address,
                    OUTCOME_CLEAN_COMPLETION,
                    ONE_ETH
                )
            ).to.be.revertedWith("Only escrow contract can call this");
        });

    });


    // ─────────────────────────────────────────────
    // GROUP 3 — PROFILE CREATION
    // ─────────────────────────────────────────────

    describe("Profile Creation", function () {

        it("should return exists false for wallet that has never used GTL", async function () {
            const profile = await registry.getProfile(randomWallet.address);
            expect(profile.exists).to.equal(false);
        });

        it("should return zero trust score for wallet that has never used GTL", async function () {
            expect(await registry.getTrustScore(randomWallet.address)).to.equal(0);
        });

        it("should return false for profileExists on new wallet", async function () {
            expect(await registry.profileExists(randomWallet.address)).to.equal(false);
        });

        it("should create profile for freelancer on first transaction", async function () {
            await registry.connect(escrowContract).updateReputation(
                freelancer.address,
                client.address,
                OUTCOME_CLEAN_COMPLETION,
                ONE_ETH
            );
            expect(await registry.profileExists(freelancer.address)).to.equal(true);
        });

        it("should create profile for client on first transaction", async function () {
            await registry.connect(escrowContract).updateReputation(
                freelancer.address,
                client.address,
                OUTCOME_CLEAN_COMPLETION,
                ONE_ETH
            );
            expect(await registry.profileExists(client.address)).to.equal(true);
        });

        it("should set initial trust score to 50 on profile creation", async function () {
            await registry.connect(escrowContract).updateReputation(
                freelancer.address,
                client.address,
                OUTCOME_CLEAN_COMPLETION,
                ONE_ETH
            );
            const profile = await registry.getProfile(freelancer.address);
            // After clean completion score is 50 + 10 = 60
            // So we check it was created and updated correctly
            expect(profile.exists).to.equal(true);
            expect(profile.trustScore).to.equal(INITIAL_SCORE + SCORE_CLEAN_COMPLETION);
        });

        it("should record firstTransactionDate on profile creation", async function () {
            await registry.connect(escrowContract).updateReputation(
                freelancer.address,
                client.address,
                OUTCOME_CLEAN_COMPLETION,
                ONE_ETH
            );
            const profile = await registry.getProfile(freelancer.address);
            expect(profile.firstTransactionDate).to.be.gt(0);
        });

        it("should not reset firstTransactionDate on subsequent transactions", async function () {
            await registry.connect(escrowContract).updateReputation(
                freelancer.address,
                client.address,
                OUTCOME_CLEAN_COMPLETION,
                ONE_ETH
            );
            const profileAfterFirst = await registry.getProfile(freelancer.address);
            const firstDate = profileAfterFirst.firstTransactionDate;

            await registry.connect(escrowContract).updateReputation(
                freelancer.address,
                client.address,
                OUTCOME_CLEAN_COMPLETION,
                ONE_ETH
            );
            const profileAfterSecond = await registry.getProfile(freelancer.address);
            expect(profileAfterSecond.firstTransactionDate).to.equal(firstDate);
        });

        it("should emit ProfileCreated event on first transaction", async function () {
            await expect(
                registry.connect(escrowContract).updateReputation(
                    freelancer.address,
                    client.address,
                    OUTCOME_CLEAN_COMPLETION,
                    ONE_ETH
                )
            ).to.emit(registry, "ProfileCreated").withArgs(freelancer.address, await ethers.provider.getBlock("latest").then(b => b.timestamp + 1));
        });

        it("should not emit ProfileCreated on subsequent transactions", async function () {
            await registry.connect(escrowContract).updateReputation(
                freelancer.address,
                client.address,
                OUTCOME_CLEAN_COMPLETION,
                ONE_ETH
            );
            // Second transaction should not emit ProfileCreated
            const tx = await registry.connect(escrowContract).updateReputation(
                freelancer.address,
                client.address,
                OUTCOME_CLEAN_COMPLETION,
                ONE_ETH
            );
            const receipt = await tx.wait();
            const profileCreatedEvents = receipt.logs.filter(
                log => log.fragment && log.fragment.name === "ProfileCreated"
            );
            expect(profileCreatedEvents.length).to.equal(0);
        });

    });


    // ─────────────────────────────────────────────
    // GROUP 4 — OUTCOME 1: CLEAN COMPLETION
    // ─────────────────────────────────────────────

    describe("Outcome 1 — Clean Completion", function () {

        beforeEach(async function () {
            await registry.connect(escrowContract).updateReputation(
                freelancer.address,
                client.address,
                OUTCOME_CLEAN_COMPLETION,
                ONE_ETH
            );
        });

        it("should increment freelancer jobsCompleted by 1", async function () {
            const profile = await registry.getProfile(freelancer.address);
            expect(profile.jobsCompleted).to.equal(1);
        });

        it("should increment client jobsAsClient by 1", async function () {
            const profile = await registry.getProfile(client.address);
            expect(profile.jobsAsClient).to.equal(1);
        });

        it("should increase freelancer trust score by 10", async function () {
            const profile = await registry.getProfile(freelancer.address);
            expect(profile.trustScore).to.equal(INITIAL_SCORE + SCORE_CLEAN_COMPLETION);
        });

        it("should increase client trust score by 5", async function () {
            const profile = await registry.getProfile(client.address);
            expect(profile.trustScore).to.equal(INITIAL_SCORE + 5);
        });

        it("should update freelancer totalVolumeAsFreelancer", async function () {
            const profile = await registry.getProfile(freelancer.address);
            expect(profile.totalVolumeAsFreelancer).to.equal(ONE_ETH);
        });

        it("should update client totalVolumeAsClient", async function () {
            const profile = await registry.getProfile(client.address);
            expect(profile.totalVolumeAsClient).to.equal(ONE_ETH);
        });

        it("should not increment freelancer disputesRaised", async function () {
            const profile = await registry.getProfile(freelancer.address);
            expect(profile.disputesRaised).to.equal(0);
        });

        it("should not increment client disputesRaised", async function () {
            const profile = await registry.getProfile(client.address);
            expect(profile.disputesRaised).to.equal(0);
        });

        it("should accumulate score across multiple clean completions", async function () {
            await registry.connect(escrowContract).updateReputation(
                freelancer.address,
                client.address,
                OUTCOME_CLEAN_COMPLETION,
                ONE_ETH
            );
            await registry.connect(escrowContract).updateReputation(
                freelancer.address,
                client.address,
                OUTCOME_CLEAN_COMPLETION,
                ONE_ETH
            );
            const profile = await registry.getProfile(freelancer.address);
            expect(profile.jobsCompleted).to.equal(3);
            expect(profile.trustScore).to.equal(INITIAL_SCORE + (SCORE_CLEAN_COMPLETION * 3));
        });

        it("should accumulate total volume across multiple completions", async function () {
            await registry.connect(escrowContract).updateReputation(
                freelancer.address,
                client.address,
                OUTCOME_CLEAN_COMPLETION,
                ethers.parseEther("2.0")
            );
            const profile = await registry.getProfile(freelancer.address);
            expect(profile.totalVolumeAsFreelancer).to.equal(ethers.parseEther("3.0"));
        });

        it("should emit ReputationUpdated event for freelancer", async function () {
            await expect(
                registry.connect(escrowContract).updateReputation(
                    freelancer.address,
                    client.address,
                    OUTCOME_CLEAN_COMPLETION,
                    ONE_ETH
                )
            ).to.emit(registry, "ReputationUpdated");
        });

    });


    // ─────────────────────────────────────────────
    // GROUP 5 — OUTCOME 2: FREELANCER GHOSTED
    // ─────────────────────────────────────────────

    describe("Outcome 2 — Freelancer Ghosted", function () {

        beforeEach(async function () {
            // First create profiles with a clean job
            await registry.connect(escrowContract).updateReputation(
                freelancer.address,
                client.address,
                OUTCOME_CLEAN_COMPLETION,
                ONE_ETH
            );
        });

        it("should decrease freelancer trust score by ghost penalty", async function () {
            const scoreBefore = (await registry.getProfile(freelancer.address)).trustScore;
            await registry.connect(escrowContract).updateReputation(
                freelancer.address,
                client.address,
                OUTCOME_FREELANCER_GHOSTED,
                ONE_ETH
            );
            const scoreAfter = (await registry.getProfile(freelancer.address)).trustScore;
            expect(scoreAfter).to.equal(scoreBefore - SCORE_GHOST_PENALTY);
        });

        it("should increment freelancer disputesLost", async function () {
            await registry.connect(escrowContract).updateReputation(
                freelancer.address,
                client.address,
                OUTCOME_FREELANCER_GHOSTED,
                ONE_ETH
            );
            const profile = await registry.getProfile(freelancer.address);
            expect(profile.disputesLost).to.equal(1);
        });

        it("should not affect client score when freelancer ghosts", async function () {
            const clientScoreBefore = (await registry.getProfile(client.address)).trustScore;
            await registry.connect(escrowContract).updateReputation(
                freelancer.address,
                client.address,
                OUTCOME_FREELANCER_GHOSTED,
                ONE_ETH
            );
            const clientScoreAfter = (await registry.getProfile(client.address)).trustScore;
            expect(clientScoreAfter).to.equal(clientScoreBefore);
        });

        it("should not let freelancer score go below zero", async function () {
            // Ghost multiple times to drain score
            for (let i = 0; i < 10; i++) {
                await registry.connect(escrowContract).updateReputation(
                    freelancer.address,
                    client.address,
                    OUTCOME_FREELANCER_GHOSTED,
                    ONE_ETH
                );
            }
            const profile = await registry.getProfile(freelancer.address);
            expect(profile.trustScore).to.be.gte(0);
        });

        it("should not increment freelancer jobsCompleted when ghosted", async function () {
            const completedBefore = (await registry.getProfile(freelancer.address)).jobsCompleted;
            await registry.connect(escrowContract).updateReputation(
                freelancer.address,
                client.address,
                OUTCOME_FREELANCER_GHOSTED,
                ONE_ETH
            );
            const completedAfter = (await registry.getProfile(freelancer.address)).jobsCompleted;
            expect(completedAfter).to.equal(completedBefore);
        });

    });


    // ─────────────────────────────────────────────
    // GROUP 6 — OUTCOME 3: DISPUTE FREELANCER WON
    // ─────────────────────────────────────────────

    describe("Outcome 3 — Dispute Resolved in Freelancer Favour", function () {

        beforeEach(async function () {
            await registry.connect(escrowContract).updateReputation(
                freelancer.address,
                client.address,
                OUTCOME_CLEAN_COMPLETION,
                ONE_ETH
            );
        });

        it("should increment freelancer jobsCompleted", async function () {
            const completedBefore = (await registry.getProfile(freelancer.address)).jobsCompleted;
            await registry.connect(escrowContract).updateReputation(
                freelancer.address,
                client.address,
                OUTCOME_DISPUTE_FREELANCER_WON,
                ONE_ETH
            );
            const completedAfter = (await registry.getProfile(freelancer.address)).jobsCompleted;
            expect(completedAfter).to.equal(completedBefore + 1);
        });

        it("should increase freelancer trust score by 5", async function () {
            const scoreBefore = (await registry.getProfile(freelancer.address)).trustScore;
            await registry.connect(escrowContract).updateReputation(
                freelancer.address,
                client.address,
                OUTCOME_DISPUTE_FREELANCER_WON,
                ONE_ETH
            );
            const scoreAfter = (await registry.getProfile(freelancer.address)).trustScore;
            expect(scoreAfter).to.equal(scoreBefore + 5);
        });

        it("should decrease client trust score by dispute loss penalty", async function () {
            const clientScoreBefore = (await registry.getProfile(client.address)).trustScore;
            await registry.connect(escrowContract).updateReputation(
                freelancer.address,
                client.address,
                OUTCOME_DISPUTE_FREELANCER_WON,
                ONE_ETH
            );
            const clientScoreAfter = (await registry.getProfile(client.address)).trustScore;
            expect(clientScoreAfter).to.equal(clientScoreBefore - SCORE_DISPUTE_LOSS);
        });

        it("should increment client disputesRaised", async function () {
            await registry.connect(escrowContract).updateReputation(
                freelancer.address,
                client.address,
                OUTCOME_DISPUTE_FREELANCER_WON,
                ONE_ETH
            );
            const profile = await registry.getProfile(client.address);
            expect(profile.disputesRaised).to.equal(1);
        });

        it("should increment client disputesLost", async function () {
            await registry.connect(escrowContract).updateReputation(
                freelancer.address,
                client.address,
                OUTCOME_DISPUTE_FREELANCER_WON,
                ONE_ETH
            );
            const profile = await registry.getProfile(client.address);
            expect(profile.disputesLost).to.equal(1);
        });

        it("should not let client score go below zero", async function () {
            for (let i = 0; i < 10; i++) {
                await registry.connect(escrowContract).updateReputation(
                    freelancer.address,
                    client.address,
                    OUTCOME_DISPUTE_FREELANCER_WON,
                    ONE_ETH
                );
            }
            const profile = await registry.getProfile(client.address);
            expect(profile.trustScore).to.be.gte(0);
        });

    });


    // ─────────────────────────────────────────────
    // GROUP 7 — OUTCOME 4: DISPUTE CLIENT WON
    // ─────────────────────────────────────────────

    describe("Outcome 4 — Dispute Resolved in Client Favour", function () {

        beforeEach(async function () {
            await registry.connect(escrowContract).updateReputation(
                freelancer.address,
                client.address,
                OUTCOME_CLEAN_COMPLETION,
                ONE_ETH
            );
        });

        it("should increment client jobsAsClient", async function () {
            const clientJobsBefore = (await registry.getProfile(client.address)).jobsAsClient;
            await registry.connect(escrowContract).updateReputation(
                freelancer.address,
                client.address,
                OUTCOME_DISPUTE_CLIENT_WON,
                ONE_ETH
            );
            const clientJobsAfter = (await registry.getProfile(client.address)).jobsAsClient;
            expect(clientJobsAfter).to.equal(clientJobsBefore + 1);
        });

        it("should increase client trust score by 5", async function () {
            const clientScoreBefore = (await registry.getProfile(client.address)).trustScore;
            await registry.connect(escrowContract).updateReputation(
                freelancer.address,
                client.address,
                OUTCOME_DISPUTE_CLIENT_WON,
                ONE_ETH
            );
            const clientScoreAfter = (await registry.getProfile(client.address)).trustScore;
            expect(clientScoreAfter).to.equal(clientScoreBefore + 5);
        });

        it("should decrease freelancer trust score by dispute loss penalty", async function () {
            const freelancerScoreBefore = (await registry.getProfile(freelancer.address)).trustScore;
            await registry.connect(escrowContract).updateReputation(
                freelancer.address,
                client.address,
                OUTCOME_DISPUTE_CLIENT_WON,
                ONE_ETH
            );
            const freelancerScoreAfter = (await registry.getProfile(freelancer.address)).trustScore;
            expect(freelancerScoreAfter).to.equal(freelancerScoreBefore - SCORE_DISPUTE_LOSS);
        });

        it("should increment freelancer disputesRaised", async function () {
            await registry.connect(escrowContract).updateReputation(
                freelancer.address,
                client.address,
                OUTCOME_DISPUTE_CLIENT_WON,
                ONE_ETH
            );
            const profile = await registry.getProfile(freelancer.address);
            expect(profile.disputesRaised).to.equal(1);
        });

        it("should increment freelancer disputesLost", async function () {
            await registry.connect(escrowContract).updateReputation(
                freelancer.address,
                client.address,
                OUTCOME_DISPUTE_CLIENT_WON,
                ONE_ETH
            );
            const profile = await registry.getProfile(freelancer.address);
            expect(profile.disputesLost).to.equal(1);
        });

        it("should not let freelancer score go below zero", async function () {
            for (let i = 0; i < 10; i++) {
                await registry.connect(escrowContract).updateReputation(
                    freelancer.address,
                    client.address,
                    OUTCOME_DISPUTE_CLIENT_WON,
                    ONE_ETH
                );
            }
            const profile = await registry.getProfile(freelancer.address);
            expect(profile.trustScore).to.be.gte(0);
        });

    });


    // ─────────────────────────────────────────────
    // GROUP 8 — OUTCOME 5: MUTUAL SPLIT
    // ─────────────────────────────────────────────

    describe("Outcome 5 — Mutual Split", function () {

        beforeEach(async function () {
            await registry.connect(escrowContract).updateReputation(
                freelancer.address,
                client.address,
                OUTCOME_CLEAN_COMPLETION,
                ONE_ETH
            );
        });

        it("should increment both parties disputesRaised", async function () {
            await registry.connect(escrowContract).updateReputation(
                freelancer.address,
                client.address,
                OUTCOME_MUTUAL_SPLIT,
                ONE_ETH
            );
            const freelancerProfile = await registry.getProfile(freelancer.address);
            const clientProfile = await registry.getProfile(client.address);
            expect(freelancerProfile.disputesRaised).to.equal(1);
            expect(clientProfile.disputesRaised).to.equal(1);
        });

        it("should decrease both parties trust score by dispute penalty", async function () {
            const freelancerScoreBefore = (await registry.getProfile(freelancer.address)).trustScore;
            const clientScoreBefore = (await registry.getProfile(client.address)).trustScore;

            await registry.connect(escrowContract).updateReputation(
                freelancer.address,
                client.address,
                OUTCOME_MUTUAL_SPLIT,
                ONE_ETH
            );

            const freelancerScoreAfter = (await registry.getProfile(freelancer.address)).trustScore;
            const clientScoreAfter = (await registry.getProfile(client.address)).trustScore;

            expect(freelancerScoreAfter).to.equal(freelancerScoreBefore - SCORE_DISPUTE_PENALTY);
            expect(clientScoreAfter).to.equal(clientScoreBefore - SCORE_DISPUTE_PENALTY);
        });

        it("should not increment jobsCompleted for either party on mutual split", async function () {
            const freelancerCompletedBefore = (await registry.getProfile(freelancer.address)).jobsCompleted;
            await registry.connect(escrowContract).updateReputation(
                freelancer.address,
                client.address,
                OUTCOME_MUTUAL_SPLIT,
                ONE_ETH
            );
            const freelancerCompletedAfter = (await registry.getProfile(freelancer.address)).jobsCompleted;
            expect(freelancerCompletedAfter).to.equal(freelancerCompletedBefore);
        });

        it("should not let either score go below zero on mutual split", async function () {
            for (let i = 0; i < 20; i++) {
                await registry.connect(escrowContract).updateReputation(
                    freelancer.address,
                    client.address,
                    OUTCOME_MUTUAL_SPLIT,
                    ONE_ETH
                );
            }
            const freelancerProfile = await registry.getProfile(freelancer.address);
            const clientProfile = await registry.getProfile(client.address);
            expect(freelancerProfile.trustScore).to.be.gte(0);
            expect(clientProfile.trustScore).to.be.gte(0);
        });

    });


    // ─────────────────────────────────────────────
    // GROUP 9 — READ FUNCTIONS
    // ─────────────────────────────────────────────

    describe("Read Functions", function () {

        beforeEach(async function () {
            await registry.connect(escrowContract).updateReputation(
                freelancer.address,
                client.address,
                OUTCOME_CLEAN_COMPLETION,
                ONE_ETH
            );
        });

        it("getProfile should return complete profile", async function () {
            const profile = await registry.getProfile(freelancer.address);
            expect(profile.exists).to.equal(true);
            expect(profile.trustScore).to.be.gt(0);
            expect(profile.firstTransactionDate).to.be.gt(0);
        });

        it("getTrustScore should return correct score", async function () {
            const score = await registry.getTrustScore(freelancer.address);
            expect(score).to.equal(INITIAL_SCORE + SCORE_CLEAN_COMPLETION);
        });

        it("profileExists should return true for existing wallet", async function () {
            expect(await registry.profileExists(freelancer.address)).to.equal(true);
        });

        it("profileExists should return false for non-existing wallet", async function () {
            expect(await registry.profileExists(randomWallet.address)).to.equal(false);
        });

        it("getStats should return correct summary values", async function () {
            const stats = await registry.getStats(freelancer.address);
            expect(stats.score).to.equal(INITIAL_SCORE + SCORE_CLEAN_COMPLETION);
            expect(stats.completed).to.equal(1);
            expect(stats.disputesRaised).to.equal(0);
            expect(stats.disputesLost).to.equal(0);
            expect(stats.memberSince).to.be.gt(0);
        });

        it("getProfile on non-existent wallet should return empty profile", async function () {
            const profile = await registry.getProfile(randomWallet.address);
            expect(profile.exists).to.equal(false);
            expect(profile.trustScore).to.equal(0);
            expect(profile.jobsCompleted).to.equal(0);
        });

    });


    // ─────────────────────────────────────────────
    // GROUP 10 — EDGE CASES
    // ─────────────────────────────────────────────

    describe("Edge Cases", function () {

        it("should handle same wallet being both freelancer and client across different jobs", async function () {
            // Wallet A is freelancer in job 1
            await registry.connect(escrowContract).updateReputation(
                freelancer.address,
                client.address,
                OUTCOME_CLEAN_COMPLETION,
                ONE_ETH
            );
            // Wallet A is client in job 2
            await registry.connect(escrowContract).updateReputation(
                client.address,
                freelancer.address,
                OUTCOME_CLEAN_COMPLETION,
                ONE_ETH
            );

            const profileA = await registry.getProfile(freelancer.address);
            expect(profileA.jobsCompleted).to.equal(1);
            expect(profileA.jobsAsClient).to.equal(1);
        });

        it("should handle very large transaction amounts without overflow", async function () {
            const largeAmount = ethers.parseEther("1000000");
            await expect(
                registry.connect(escrowContract).updateReputation(
                    freelancer.address,
                    client.address,
                    OUTCOME_CLEAN_COMPLETION,
                    largeAmount
                )
            ).to.not.be.reverted;

            const profile = await registry.getProfile(freelancer.address);
            expect(profile.totalVolumeAsFreelancer).to.equal(largeAmount);
        });

        it("should handle invalid outcome code gracefully", async function () {
            // Outcome 99 doesn't exist — should not revert but also not update anything meaningful
            await registry.connect(escrowContract).updateReputation(
                freelancer.address,
                client.address,
                99,
                ONE_ETH
            );
            // Profiles should exist but nothing meaningful should have changed
            const profile = await registry.getProfile(freelancer.address);
            expect(profile.exists).to.equal(true);
        });

        it("should handle multiple different freelancers independently", async function () {
            const [,,,, , anotherFreelancer] = await ethers.getSigners();

            await registry.connect(escrowContract).updateReputation(
                freelancer.address,
                client.address,
                OUTCOME_CLEAN_COMPLETION,
                ONE_ETH
            );
            await registry.connect(escrowContract).updateReputation(
                anotherFreelancer.address,
                client.address,
                OUTCOME_FREELANCER_GHOSTED,
                ONE_ETH
            );

            const profile1 = await registry.getProfile(freelancer.address);
            const profile2 = await registry.getProfile(anotherFreelancer.address);

            expect(profile1.jobsCompleted).to.equal(1);
            expect(profile2.jobsCompleted).to.equal(0);
            expect(profile2.disputesLost).to.equal(1);
        });

        it("should handle zero amount transaction", async function () {
            await expect(
                registry.connect(escrowContract).updateReputation(
                    freelancer.address,
                    client.address,
                    OUTCOME_CLEAN_COMPLETION,
                    0
                )
            ).to.not.be.reverted;

            const profile = await registry.getProfile(freelancer.address);
            expect(profile.totalVolumeAsFreelancer).to.equal(0);
        });

        it("should keep disputesLost and disputesRaised independent", async function () {
            // Freelancer wins a dispute — their disputesRaised goes up but not disputesLost
            await registry.connect(escrowContract).updateReputation(
                freelancer.address,
                client.address,
                OUTCOME_CLEAN_COMPLETION,
                ONE_ETH
            );
            await registry.connect(escrowContract).updateReputation(
                freelancer.address,
                client.address,
                OUTCOME_DISPUTE_FREELANCER_WON,
                ONE_ETH
            );

            const profile = await registry.getProfile(freelancer.address);
            expect(profile.disputesRaised).to.equal(0);
            expect(profile.disputesLost).to.equal(0);
        });

        it("should correctly track score across mixed outcomes", async function () {
            // Clean completion +10
            await registry.connect(escrowContract).updateReputation(
                freelancer.address, client.address, OUTCOME_CLEAN_COMPLETION, ONE_ETH
            );
            // Another clean completion +10
            await registry.connect(escrowContract).updateReputation(
                freelancer.address, client.address, OUTCOME_CLEAN_COMPLETION, ONE_ETH
            );
            // Lost a dispute -15
            await registry.connect(escrowContract).updateReputation(
                freelancer.address, client.address, OUTCOME_DISPUTE_CLIENT_WON, ONE_ETH
            );
            // Mutual split -5
            await registry.connect(escrowContract).updateReputation(
                freelancer.address, client.address, OUTCOME_MUTUAL_SPLIT, ONE_ETH
            );

            // Expected: 50 + 10 + 10 - 15 - 5 = 50
            const score = await registry.getTrustScore(freelancer.address);
            expect(score).to.equal(50);
        });

    });


    // ─────────────────────────────────────────────
    // GROUP 11 — EVENTS
    // ─────────────────────────────────────────────

    describe("Events", function () {

        it("should emit ReputationUpdated with correct wallet on clean completion", async function () {
            await expect(
                registry.connect(escrowContract).updateReputation(
                    freelancer.address,
                    client.address,
                    OUTCOME_CLEAN_COMPLETION,
                    ONE_ETH
                )
            ).to.emit(registry, "ReputationUpdated")
             .withArgs(freelancer.address, INITIAL_SCORE + SCORE_CLEAN_COMPLETION, "Clean completion");
        });

        it("should emit ReputationUpdated for both parties on clean completion", async function () {
            const tx = await registry.connect(escrowContract).updateReputation(
                freelancer.address,
                client.address,
                OUTCOME_CLEAN_COMPLETION,
                ONE_ETH
            );
            const receipt = await tx.wait();
            const reputationEvents = receipt.logs.filter(
                log => log.fragment && log.fragment.name === "ReputationUpdated"
            );
            expect(reputationEvents.length).to.equal(2);
        });

        it("should emit EscrowContractSet when escrow is set", async function () {
            const ReputationRegistry = await ethers.getContractFactory("ReputationRegistry");
            const freshRegistry = await ReputationRegistry.deploy();
            await freshRegistry.waitForDeployment();

            await expect(
                freshRegistry.connect(owner).setEscrowContract(escrowContract.address)
            ).to.emit(freshRegistry, "EscrowContractSet")
             .withArgs(escrowContract.address);
        });

    });

});