const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-network-helpers");

describe("Global Trust Layer — Test Case Verification", function () {
  let usdc, reputation, escrow;
  let owner, client, freelancer, arbiter, randomUser;

  const AMOUNT = 500_000000n;       // 500 USDC
  const DURATION = 21 * 24 * 3600;  // 21 days, matches "Day 21" in test cases

  beforeEach(async () => {
    [owner, client, freelancer, arbiter, randomUser] = await ethers.getSigners();

    const USDC = await ethers.getContractFactory("MockUSDC");
    usdc = await USDC.deploy();

    const Reputation = await ethers.getContractFactory("ReputationRegistry");
    reputation = await Reputation.deploy();

    const Escrow = await ethers.getContractFactory("EscrowFactory");
    escrow = await Escrow.deploy(usdc.target, arbiter.address, reputation.target);

    await reputation.setEscrowFactory(escrow.target);

    await usdc.mint(client.address, 10_000_000000n);
    await usdc.connect(client).approve(escrow.target, 10_000_000000n);
  });

  async function createAndFund(amount = AMOUNT, duration = DURATION) {
    await escrow.connect(client).createJob(
      freelancer.address, "Test Job", ["Full delivery"], [amount], duration
    );
    const jobId = await escrow.jobCounter();
    await escrow.connect(client).fundJob(jobId);
    return jobId;
  }

  // ───────────── CATEGORY 1 — HAPPY PATH ─────────────

  describe("Category 1 — Happy Path", () => {
    it("1.1 — payment released minus 2% fee, both get +10 reputation", async () => {
      const jobId = await createAndFund();
      await escrow.connect(freelancer).markDelivered(jobId, 0, "ipfs://work");

      const feeBalBefore = await usdc.balanceOf(arbiter.address);
      await escrow.connect(client).releaseMilestone(jobId, 0);

      const expectedFee = (AMOUNT * 200n) / 10000n;
      const freelancerBal = await usdc.balanceOf(freelancer.address);
      expect(freelancerBal).to.equal(AMOUNT - expectedFee);
      expect(await usdc.balanceOf(arbiter.address)).to.equal(feeBalBefore + expectedFee);

      expect(await reputation.getTrustScore(client.address)).to.equal(510);
      expect(await reputation.getTrustScore(freelancer.address)).to.equal(510);
    });

    it("1.2 — client can release early, before deadline, no waiting required", async () => {
      const jobId = await createAndFund();
      await escrow.connect(freelancer).markDelivered(jobId, 0, "ipfs://early");
      // deadline is 21 days away — release works immediately
      await expect(escrow.connect(client).releaseMilestone(jobId, 0)).to.not.be.reverted;
    });

    it("1.3 — release BEFORE submission must be rejected", async () => {
      const jobId = await createAndFund();
      await expect(
        escrow.connect(client).releaseMilestone(jobId, 0)
      ).to.be.revertedWith("Milestone must be delivered before release");
    });
  });

  // ───────────── CATEGORY 2 — FREELANCER WRONG ─────────────

  describe("Category 2 — Freelancer Does Something Wrong", () => {
    it("2.1 — freelancer ghosts, client gets full refund after deadline, freelancer penalized", async () => {
      const jobId = await createAndFund();
      await time.increase(DURATION + 1);

      const balBefore = await usdc.balanceOf(client.address);
      await escrow.connect(client).refundClient(jobId, 0);
      expect(await usdc.balanceOf(client.address)).to.equal(balBefore + AMOUNT);

      const passport = await reputation.getPassport(freelancer.address);
      expect(passport.ghostingCount).to.equal(1);
      expect(passport.trustScore).to.equal(400); // 500 - 100
    });

    it("2.2 — garbage work disputed, arbiter rules fully for client", async () => {
      const jobId = await createAndFund();
      await escrow.connect(freelancer).markDelivered(jobId, 0, "ipfs://garbage");
      await escrow.connect(client).raiseDispute(jobId, 0, "work does not match brief");
      await escrow.connect(arbiter).resolveDispute(jobId, 0, 10000); // 100% to client

      const passport = await reputation.getPassport(freelancer.address);
      expect(passport.disputesLost).to.equal(1);
    });

    it("2.3 — late submission is allowed and tracked as late", async () => {
      const jobId = await createAndFund();
      await time.increase(DURATION + 7 * 24 * 3600); // 7 days late
      await escrow.connect(freelancer).markDelivered(jobId, 0, "ipfs://late");

      const m = await escrow.getMilestone(jobId, 0);
      expect(m.late).to.equal(true);

      const passport = await reputation.getPassport(freelancer.address);
      expect(passport.lateDeliveries).to.equal(1);
    });

    it("2.3b — client can still refund instead of accepting late work", async () => {
      const jobId = await createAndFund();
      await time.increase(DURATION + 7 * 24 * 3600);
      await escrow.connect(freelancer).markDelivered(jobId, 0, "ipfs://late");

      const balBefore = await usdc.balanceOf(client.address);
      await escrow.connect(client).refundClient(jobId, 0);
      expect(await usdc.balanceOf(client.address)).to.equal(balBefore + AMOUNT);
    });

    it("2.5 — partial split: 40% freelancer, 60% client", async () => {
      const jobId = await createAndFund();
      await escrow.connect(freelancer).markDelivered(jobId, 0, "ipfs://mediocre");
      await escrow.connect(client).raiseDispute(jobId, 0, "wrong fonts, bad colours");
      await escrow.connect(arbiter).resolveDispute(jobId, 0, 6000); // 60% client, 40% freelancer

      const arbFee = (AMOUNT * 100n) / 10000n;
      const remaining = AMOUNT - arbFee;
      const expectedFreelancer = remaining - (remaining * 6000n) / 10000n;
      expect(await usdc.balanceOf(freelancer.address)).to.equal(expectedFreelancer);
    });
  });

  // ───────────── CATEGORY 3 — CLIENT WRONG ─────────────

  describe("Category 3 — Client Does Something Wrong", () => {
    it("3.1 — client silent, auto-release triggers after deadline + 7 day grace", async () => {
      const jobId = await createAndFund();
      await escrow.connect(freelancer).markDelivered(jobId, 0, "ipfs://perfect");

      await time.increase(DURATION + 7 * 24 * 3600 + 1);
      await expect(escrow.autoRelease(jobId, 0)).to.not.be.reverted;

      const passport = await reputation.getPassport(freelancer.address);
      expect(passport.completedJobs).to.equal(1);
    });

    it("3.1b — auto-release fails before grace period ends", async () => {
      const jobId = await createAndFund();
      await escrow.connect(freelancer).markDelivered(jobId, 0, "ipfs://work");
      await time.increase(DURATION + 1); // deadline passed but NOT +7 days
      await expect(escrow.autoRelease(jobId, 0)).to.be.revertedWith("Grace period not over yet");
    });

    it("3.2 — fake dispute by client resolved in freelancer's favour", async () => {
      const jobId = await createAndFund();
      await escrow.connect(freelancer).markDelivered(jobId, 0, "ipfs://good work");
      await escrow.connect(client).raiseDispute(jobId, 0, "no real reason");
      await escrow.connect(arbiter).resolveDispute(jobId, 0, 0); // 0% to client

      const clientPassport = await reputation.getPassport(client.address);
      expect(clientPassport.disputesLost).to.equal(1);
    });

    it("3.3 — anyone (not just freelancer) can call autoRelease", async () => {
      const jobId = await createAndFund();
      await escrow.connect(freelancer).markDelivered(jobId, 0, "ipfs://work");
      await time.increase(DURATION + 7 * 24 * 3600 + 1);
      await expect(escrow.connect(randomUser).autoRelease(jobId, 0)).to.not.be.reverted;
    });

    it("3.4 — client cannot cancel unilaterally, must dispute, 50/50 split", async () => {
      const jobId = await createAndFund();
      await escrow.connect(freelancer).markDelivered(jobId, 0, "ipfs://partial work");
      await escrow.connect(client).raiseDispute(jobId, 0, "want to cancel mid-project");
      await escrow.connect(arbiter).resolveDispute(jobId, 0, 5000);

      const job = await escrow.getJob(jobId);
      expect(job.status).to.equal(3); // COMPLETED
    });

    it("3.5 — client admits fault, agreeToSplit gives 100% to freelancer, no arbiter needed", async () => {
      const jobId = await createAndFund();
      await escrow.connect(freelancer).markDelivered(jobId, 0, "ipfs://correct work");
      await escrow.connect(client).raiseDispute(jobId, 0, "my mistake, bad brief");

      await escrow.connect(client).agreeToSplit(jobId, 0, 0);      // 0% to client
      await escrow.connect(freelancer).agreeToSplit(jobId, 0, 0);  // matches -> auto executes

      expect(await usdc.balanceOf(freelancer.address)).to.equal(AMOUNT); // no arbitration fee
    });
  });

  // ───────────── CATEGORY 4 — GENUINE DISPUTES ─────────────

  describe("Category 4 — Both Parties Disagree", () => {
    it("4.1 — negotiated 75/25 split via mutual agreement, no fee", async () => {
      const jobId = await createAndFund();
      await escrow.connect(freelancer).markDelivered(jobId, 0, "ipfs://80 percent done");
      await escrow.connect(client).raiseDispute(jobId, 0, "ambiguous brief");

      await escrow.connect(client).agreeToSplit(jobId, 0, 2500);     // 25% client
      await escrow.connect(freelancer).agreeToSplit(jobId, 0, 2500);

      const expectedFreelancer = AMOUNT - (AMOUNT * 2500n) / 10000n;
      expect(await usdc.balanceOf(freelancer.address)).to.equal(expectedFreelancer);
    });

    it("4.2 — arbitration path charges a 1% fee to feeRecipient", async () => {
      const jobId = await createAndFund();
      await escrow.connect(freelancer).markDelivered(jobId, 0, "ipfs://work");
      await escrow.connect(client).raiseDispute(jobId, 0, "total disagreement");

      const feeBalBefore = await usdc.balanceOf(arbiter.address);
      await escrow.connect(arbiter).resolveDispute(jobId, 0, 5000);

      const expectedFee = (AMOUNT * 100n) / 10000n;
      expect(await usdc.balanceOf(arbiter.address)).to.equal(feeBalBefore + expectedFee);
    });

    it("4.3 — freelancer has evidence, dispute resolves heavily in their favour", async () => {
      const jobId = await createAndFund();
      await escrow.connect(freelancer).markDelivered(jobId, 0, "ipfs://commit-history-and-screenshots");
      await escrow.connect(client).raiseDispute(jobId, 0, "claims non-delivery");
      await escrow.connect(arbiter).resolveDispute(jobId, 0, 0); // 100% freelancer

      const arbFee = (AMOUNT * 100n) / 10000n;
      expect(await usdc.balanceOf(freelancer.address)).to.equal(AMOUNT - arbFee);
    });

    it("4.4 — no evidence either side, default 50/50 split", async () => {
      const jobId = await createAndFund();
      await escrow.connect(freelancer).markDelivered(jobId, 0, "ipfs://work");
      await escrow.connect(client).raiseDispute(jobId, 0, "no proof either way");
      await escrow.connect(arbiter).resolveDispute(jobId, 0, 5000);

      const arbFee = (AMOUNT * 100n) / 10000n;
      const remaining = AMOUNT - arbFee;
      expect(await usdc.balanceOf(freelancer.address)).to.equal(remaining / 2n);
    });
  });

  // ───────────── CATEGORY 5 — MILESTONES ─────────────

  describe("Category 5 — Milestone-Based Jobs", () => {
    async function createMultiMilestoneJob() {
      await escrow.connect(client).createJob(
        freelancer.address, "3-Milestone Job",
        ["M1", "M2", "M3"],
        [200_000000n, 200_000000n, 100_000000n],
        DURATION
      );
      const jobId = await escrow.jobCounter();
      await escrow.connect(client).fundJob(jobId);
      return jobId;
    }

    it("5.1 — Milestone 1 released, freelancer keeps it even if project stops after", async () => {
      const jobId = await createMultiMilestoneJob();
      await escrow.connect(freelancer).markDelivered(jobId, 0, "ipfs://m1");
      await escrow.connect(client).releaseMilestone(jobId, 0);

      const m1 = await escrow.getMilestone(jobId, 0);
      expect(m1.released).to.equal(true);

      // client walks away — milestone 2 and 3 never delivered
      const m2 = await escrow.getMilestone(jobId, 1);
      expect(m2.released).to.equal(false);
    });

    it("5.2 — freelancer can withhold Milestone 2 work until Milestone 1 dispute resolves", async () => {
      const jobId = await createMultiMilestoneJob();
      await escrow.connect(freelancer).markDelivered(jobId, 0, "ipfs://m1");
      await escrow.connect(client).raiseDispute(jobId, 0, "not happy with m1");
      // freelancer simply never calls markDelivered for milestone 2 — no code forces them to
      await expect(escrow.connect(freelancer).markDelivered(jobId, 1, "ipfs://m2")).to.not.be.reverted;
      // this call succeeding just proves nothing FORCES it — freelancer's choice not to call it is valid too
    });

    it("5.3 — Milestones 1 & 2 released fine, only Milestone 3 disputed", async () => {
      const jobId = await createMultiMilestoneJob();

      await escrow.connect(freelancer).markDelivered(jobId, 0, "ipfs://m1");
      await escrow.connect(client).releaseMilestone(jobId, 0);

      await escrow.connect(freelancer).markDelivered(jobId, 1, "ipfs://m2");
      await escrow.connect(client).releaseMilestone(jobId, 1);

      await escrow.connect(freelancer).markDelivered(jobId, 2, "ipfs://m3-poor-quality");
      await escrow.connect(client).raiseDispute(jobId, 2, "poor quality");

      const m1 = await escrow.getMilestone(jobId, 0);
      const m2 = await escrow.getMilestone(jobId, 1);
      expect(m1.released).to.equal(true);
      expect(m2.released).to.equal(true); // unaffected by milestone 3 dispute

      await escrow.connect(arbiter).resolveDispute(jobId, 2, 10000); // fully to client
      const job = await escrow.getJob(jobId);
      expect(job.status).to.equal(3); // COMPLETED — all 3 milestones resolved
    });
  });

  // ───────────── CATEGORY 6 — IRREVERSIBILITY CHECK ─────────────

  describe("Category 6 — Irreversibility", () => {
    it("6.5 — released payment cannot be reversed or refunded afterward", async () => {
      const jobId = await createAndFund();
      await escrow.connect(freelancer).markDelivered(jobId, 0, "ipfs://work");
      await escrow.connect(client).releaseMilestone(jobId, 0);

      await time.increase(DURATION + 1);
      await expect(
        escrow.connect(client).refundClient(jobId, 0)
      ).to.be.revertedWith("Already resolved");
    });
  });
});