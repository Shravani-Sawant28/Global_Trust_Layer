// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract ReputationRegistry {

    address public escrowFactory;
    address public owner;

    struct TrustPassport {
        address wallet;
        uint256 trustScore;
        uint256 totalJobs;
        uint256 completedJobs;
        uint256 disputesInvolved;
        uint256 disputesLost;
        uint256 lateDeliveries;
        uint256 ghostingCount;
        uint256 totalVolume;
        uint256 memberSince;
        uint256 lastUpdated;
    }

    mapping(address => TrustPassport) public passports;
    mapping(address => uint256[]) public jobHistory;

    event PassportCreated(address indexed wallet, uint256 timestamp);
    event ScoreChanged(address indexed wallet, int256 delta, uint256 newScore, string reason);
    event EscrowFactorySet(address escrowFactory);

    modifier onlyEscrow() {
        require(msg.sender == escrowFactory, "Only EscrowFactory can call this");
        _;
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner");
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    function setEscrowFactory(address _escrow) external onlyOwner {
        require(_escrow != address(0), "Invalid address");
        require(escrowFactory == address(0), "Already set");
        escrowFactory = _escrow;
        emit EscrowFactorySet(_escrow);
    }

    function _initPassport(address wallet) internal {
        if (passports[wallet].memberSince == 0) {
            passports[wallet].wallet = wallet;
            passports[wallet].trustScore = 500;
            passports[wallet].memberSince = block.timestamp;
            emit PassportCreated(wallet, block.timestamp);
        }
    }

    function _increase(address wallet, uint256 points, string memory reason) internal {
        _initPassport(wallet);
        passports[wallet].trustScore += points;
        passports[wallet].lastUpdated = block.timestamp;
        emit ScoreChanged(wallet, int256(points), passports[wallet].trustScore, reason);
    }

    function _decrease(address wallet, uint256 points, string memory reason) internal {
        _initPassport(wallet);
        uint256 current = passports[wallet].trustScore;
        passports[wallet].trustScore = current > points ? current - points : 0;
        passports[wallet].lastUpdated = block.timestamp;
        emit ScoreChanged(wallet, -int256(points), passports[wallet].trustScore, reason);
    }

    /// @notice Both parties get +10 when a milestone is released happily (Scenario 1.1)
    function recordCompletion(address client, address freelancer, uint256 jobId, uint256 amount)
        external onlyEscrow
    {
        _initPassport(client);
        _initPassport(freelancer);

        passports[client].totalJobs++;
        passports[client].completedJobs++;
        passports[client].totalVolume += amount;
        jobHistory[client].push(jobId);

        passports[freelancer].totalJobs++;
        passports[freelancer].completedJobs++;
        passports[freelancer].totalVolume += amount;
        jobHistory[freelancer].push(jobId);

        _increase(client, 10, "job completed");
        _increase(freelancer, 10, "job completed");
    }

    /// @notice Auto-release: only freelancer benefits, client stayed silent (Scenario 3.1/3.3)
    function recordAutoRelease(address freelancer, uint256 jobId, uint256 amount) external onlyEscrow {
        _initPassport(freelancer);
        passports[freelancer].totalJobs++;
        passports[freelancer].completedJobs++;
        passports[freelancer].totalVolume += amount;
        jobHistory[freelancer].push(jobId);
        _increase(freelancer, 10, "auto-release after client silence");
    }

    /// @notice Freelancer never delivered, client refunded (Scenario 2.1)
    function recordGhosting(address freelancer, uint256 jobId) external onlyEscrow {
        _initPassport(freelancer);
        passports[freelancer].disputesInvolved++;
        passports[freelancer].disputesLost++;
        passports[freelancer].ghostingCount++;
        jobHistory[freelancer].push(jobId);
        _decrease(freelancer, 100, "ghosted job, client refunded");
    }

    function recordLateDelivery(address freelancer) external onlyEscrow {
        _initPassport(freelancer);
        passports[freelancer].lateDeliveries++;
    }

    /// @notice Called the moment a dispute opens, before it's resolved (Scenario 3.2)
    function recordDisputeRaised(address client, address freelancer) external onlyEscrow {
        _initPassport(client);
        _initPassport(freelancer);
        passports[client].disputesInvolved++;
        passports[freelancer].disputesInvolved++;
    }

    /// @notice Called only when a dispute resolves 100%/0% against one party
    function recordDisputeLoss(address loser) external onlyEscrow {
        _initPassport(loser);
        passports[loser].disputesLost++;
        _decrease(loser, 50, "lost dispute");
    }

    function getTrustScore(address wallet) external view returns (uint256) {
        if (passports[wallet].memberSince == 0) return 0;
        return passports[wallet].trustScore;
    }

    function getPassport(address wallet) external view returns (TrustPassport memory) {
        return passports[wallet];
    }

    function getJobHistory(address wallet) external view returns (uint256[] memory) {
        return jobHistory[wallet];
    }

    function isNewWallet(address wallet) external view returns (bool) {
        return passports[wallet].memberSince == 0;
    }
}