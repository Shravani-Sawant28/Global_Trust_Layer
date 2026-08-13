const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("ReputationRegistry Contract Tests", function () {
  let reputation;
  let owner, escrow, client, freelancer, randomUser;

  beforeEach(async () => {
    [owner, escrow, client, freelancer, randomUser] = await ethers.getSigners();

    const Reputation = await ethers.getContractFactory("ReputationRegistry");
    reputation = await Reputation.deploy();

    await reputation.setEscrowFactory(escrow.address);
  });

  describe("Deployment & Access Control", () => {
    it("should set correct owner and escrowFactory", async () => {
      expect(await reputation.owner()).to.equal(owner.address);
      expect(await reputation.escrowFactory()).to.equal(escrow.address);
    });

    it("should prevent setting escrowFactory twice", async () => {
      await expect(
        reputation.setEscrowFactory(randomUser.address)
      ).to.be.revertedWith("Already set");
    });

    it("should restrict record functions to escrowFactory only", async () => {
      await expect(
        reputation.connect(randomUser).recordCompletion(client.address, freelancer.address, 1, 1000)
      ).to.be.revertedWith("Only EscrowFactory can call this");

      await expect(
        reputation.connect(randomUser).recordGhosting(freelancer.address, 1)
      ).to.be.revertedWith("Only EscrowFactory can call this");
    });
  });

  describe("Passport Creation & Trust Scores", () => {
    it("should return 0 trust score for new wallet", async () => {
      expect(await reputation.getTrustScore(client.address)).to.equal(0);
      expect(await reputation.isNewWallet(client.address)).to.equal(true);
    });

    it("should record job completion and add +10 trust score to both parties", async () => {
      await reputation.connect(escrow).recordCompletion(client.address, freelancer.address, 1, 500_000000);

      expect(await reputation.getTrustScore(client.address)).to.equal(510);
      expect(await reputation.getTrustScore(freelancer.address)).to.equal(510);

      const clientPassport = await reputation.getPassport(client.address);
      expect(clientPassport.totalJobs).to.equal(1);
      expect(clientPassport.completedJobs).to.equal(1);
      expect(clientPassport.totalVolume).to.equal(500_000000);
    });

    it("should record auto release for freelancer", async () => {
      await reputation.connect(escrow).recordAutoRelease(freelancer.address, 1, 200_000000);

      expect(await reputation.getTrustScore(freelancer.address)).to.equal(510);
      const passport = await reputation.getPassport(freelancer.address);
      expect(passport.completedJobs).to.equal(1);
    });

    it("should record ghosting penalty (-100 points) for freelancer", async () => {
      await reputation.connect(escrow).recordGhosting(freelancer.address, 1);

      expect(await reputation.getTrustScore(freelancer.address)).to.equal(400); // 500 - 100
      const passport = await reputation.getPassport(freelancer.address);
      expect(passport.ghostingCount).to.equal(1);
      expect(passport.disputesLost).to.equal(1);
    });

    it("should record dispute loss (-50 points)", async () => {
      await reputation.connect(escrow).recordDisputeLoss(client.address);

      expect(await reputation.getTrustScore(client.address)).to.equal(450); // 500 - 50
      const passport = await reputation.getPassport(client.address);
      expect(passport.disputesLost).to.equal(1);
    });

    it("should record late delivery count", async () => {
      await reputation.connect(escrow).recordLateDelivery(freelancer.address);
      const passport = await reputation.getPassport(freelancer.address);
      expect(passport.lateDeliveries).to.equal(1);
    });

    it("should track job history for wallets", async () => {
      await reputation.connect(escrow).recordCompletion(client.address, freelancer.address, 42, 100);
      const history = await reputation.getJobHistory(client.address);
      expect(history.length).to.equal(1);
      expect(history[0]).to.equal(42);
    });
  });
});