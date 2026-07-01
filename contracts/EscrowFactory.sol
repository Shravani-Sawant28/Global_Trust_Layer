// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./ReputationRegistry.sol";

contract EscrowFactory is ReentrancyGuard {

    IERC20 public usdc;
    ReputationRegistry public reputation;
    address public arbiter;
    address public feeRecipient;
    uint256 public jobCounter;

    uint256 public constant FEE_BPS = 200;              // 2% platform fee on happy releases
    uint256 public constant ARBITRATION_FEE_BPS = 100;   // 1% fee only when arbiter resolves a dispute
    uint256 public constant BPS_DENOMINATOR = 10000;
    uint256 public constant DISPUTE_WINDOW = 72 hours;
    uint256 public constant GRACE_PERIOD = 7 days;
    uint256 private constant NO_PROPOSAL = type(uint256).max;

    enum JobStatus { CREATED, FUNDED, IN_PROGRESS, COMPLETED, CANCELLED }
    enum DisputeStatus { NONE, DISPUTED, RESOLVED }

    struct Milestone {
        string description;
        uint256 amount;
        bool delivered;
        bool released;
        bool late;
        string ipfsHash;
        uint256 deliveredAt;
        uint256 disputeDeadline;
        DisputeStatus disputeStatus;
        string disputeReason;
        uint256 clientProposalBps;
        uint256 freelancerProposalBps;
    }

    struct Job {
        uint256 jobId;
        address client;
        address freelancer;
        uint256 totalAmount;
        uint256 releasedAmount;
        JobStatus status;
        string title;
        uint256 createdAt;
        uint256 duration;   // seconds freelancer has to deliver, counted from fundJob()
        uint256 deadline;   // fundedAt + duration
        Milestone[] milestones;
    }

    mapping(uint256 => Job) public jobs;
    mapping(address => uint256[]) public clientJobs;
    mapping(address => uint256[]) public freelancerJobs;

    event JobCreated(uint256 indexed jobId, address indexed client, address indexed freelancer, uint256 totalAmount, string title);
    event JobFunded(uint256 indexed jobId, uint256 amount, uint256 deadline);
    event MilestoneDelivered(uint256 indexed jobId, uint256 milestoneIndex, string ipfsHash, bool late);
    event MilestoneReleased(uint256 indexed jobId, uint256 milestoneIndex, uint256 amountToFreelancer, uint256 fee);
    event JobCompleted(uint256 indexed jobId);
    event ClientRefunded(uint256 indexed jobId, uint256 milestoneIndex, uint256 amount);
    event AutoReleased(uint256 indexed jobId, uint256 milestoneIndex, uint256 amount);
    event DisputeRaised(uint256 indexed jobId, uint256 milestoneIndex, address raisedBy, string reason);
    event DisputeResolved(uint256 indexed jobId, uint256 milestoneIndex, uint256 clientBps, uint256 clientAmount, uint256 freelancerAmount);
    event SplitProposed(uint256 indexed jobId, uint256 milestoneIndex, address proposer, uint256 clientBps);
    event SplitAgreed(uint256 indexed jobId, uint256 milestoneIndex, uint256 clientBps);

    constructor(address _usdc, address _arbiter, address _reputation) {
        require(_usdc != address(0), "Invalid USDC address");
        require(_arbiter != address(0), "Invalid arbiter address");
        require(_reputation != address(0), "Invalid reputation address");
        usdc = IERC20(_usdc);
        arbiter = _arbiter;
        feeRecipient = _arbiter;
        reputation = ReputationRegistry(_reputation);
    }

    // ───────────────────────── JOB CREATION ─────────────────────────

    function createJob(
        address _freelancer,
        string memory _title,
        string[] memory _milestoneDescriptions,
        uint256[] memory _milestoneAmounts,
        uint256 _durationSeconds
    ) external returns (uint256) {
        require(_freelancer != address(0), "Invalid freelancer address");
        require(_freelancer != msg.sender, "Cannot hire yourself");
        require(bytes(_title).length > 0, "Title required");
        require(_milestoneDescriptions.length == _milestoneAmounts.length, "Milestone arrays must match in length");
        require(_milestoneDescriptions.length > 0, "Need at least 1 milestone");
        require(_milestoneDescriptions.length <= 10, "Max 10 milestones");
        require(_durationSeconds > 0, "Duration must be > 0");

        uint256 total = 0;
        for (uint256 i = 0; i < _milestoneAmounts.length; i++) {
            require(_milestoneAmounts[i] > 0, "Milestone amount must be > 0");
            total += _milestoneAmounts[i];
        }

        uint256 jobId = ++jobCounter;
        Job storage job = jobs[jobId];
        job.jobId = jobId;
        job.client = msg.sender;
        job.freelancer = _freelancer;
        job.totalAmount = total;
        job.title = _title;
        job.status = JobStatus.CREATED;
        job.createdAt = block.timestamp;
        job.duration = _durationSeconds;

        for (uint256 i = 0; i < _milestoneDescriptions.length; i++) {
            job.milestones.push(Milestone({
                description: _milestoneDescriptions[i],
                amount: _milestoneAmounts[i],
                delivered: false,
                released: false,
                late: false,
                ipfsHash: "",
                deliveredAt: 0,
                disputeDeadline: 0,
                disputeStatus: DisputeStatus.NONE,
                disputeReason: "",
                clientProposalBps: NO_PROPOSAL,
                freelancerProposalBps: NO_PROPOSAL
            }));
        }

        clientJobs[msg.sender].push(jobId);
        freelancerJobs[_freelancer].push(jobId);

        emit JobCreated(jobId, msg.sender, _freelancer, total, _title);
        return jobId;
    }

    function fundJob(uint256 jobId) external nonReentrant {
        Job storage job = jobs[jobId];
        require(job.client != address(0), "Job does not exist");
        require(msg.sender == job.client, "Only client can fund");
        require(job.status == JobStatus.CREATED, "Job already funded");

        bool success = usdc.transferFrom(msg.sender, address(this), job.totalAmount);
        require(success, "USDC transfer failed. Did you approve first?");

        job.status = JobStatus.FUNDED;
        job.deadline = block.timestamp + job.duration;

        emit JobFunded(jobId, job.totalAmount, job.deadline);
    }

    // ───────────────────────── DELIVERY ─────────────────────────

    function markDelivered(uint256 jobId, uint256 milestoneIndex, string memory ipfsHash) external {
        Job storage job = jobs[jobId];
        require(msg.sender == job.freelancer, "Only freelancer can mark delivered");
        require(job.status == JobStatus.FUNDED || job.status == JobStatus.IN_PROGRESS, "Job must be funded first");
        require(milestoneIndex < job.milestones.length, "Invalid milestone index");

        Milestone storage m = job.milestones[milestoneIndex];
        require(!m.delivered, "Milestone already delivered");
        require(bytes(ipfsHash).length > 0, "IPFS hash required as delivery proof");

        m.delivered = true;
        m.ipfsHash = ipfsHash;
        m.deliveredAt = block.timestamp;
        m.disputeDeadline = block.timestamp + DISPUTE_WINDOW;
        m.late = block.timestamp > job.deadline;

        if (m.late) {
            reputation.recordLateDelivery(job.freelancer);
        }

        job.status = JobStatus.IN_PROGRESS;

        emit MilestoneDelivered(jobId, milestoneIndex, ipfsHash, m.late);
    }

    // ───────────────────────── HAPPY-PATH RELEASE ─────────────────────────

    function releaseMilestone(uint256 jobId, uint256 milestoneIndex) external nonReentrant {
        Job storage job = jobs[jobId];
        require(msg.sender == job.client, "Only client can release payment");
        require(milestoneIndex < job.milestones.length, "Invalid milestone index");

        Milestone storage m = job.milestones[milestoneIndex];
        require(m.delivered, "Milestone must be delivered before release");
        require(!m.released, "Milestone already released");
        require(m.disputeStatus == DisputeStatus.NONE, "Milestone is disputed");

        uint256 fee = (m.amount * FEE_BPS) / BPS_DENOMINATOR;
        uint256 payoutAmount = m.amount - fee;

        m.released = true;
        job.releasedAmount += m.amount;

        if (fee > 0) usdc.transfer(feeRecipient, fee);
        usdc.transfer(job.freelancer, payoutAmount);

        reputation.recordCompletion(job.client, job.freelancer, jobId, m.amount);

        if (job.releasedAmount == job.totalAmount) {
            job.status = JobStatus.COMPLETED;
            emit JobCompleted(jobId);
        }

        emit MilestoneReleased(jobId, milestoneIndex, payoutAmount, fee);
    }

    // ───────────────────────── FREELANCER GHOSTS ─────────────────────────

    function refundClient(uint256 jobId, uint256 milestoneIndex) external nonReentrant {
        Job storage job = jobs[jobId];
        require(msg.sender == job.client, "Only client can request refund");
        require(milestoneIndex < job.milestones.length, "Invalid milestone index");

        Milestone storage m = job.milestones[milestoneIndex];
        require(!m.released, "Already resolved");
        require(m.disputeStatus == DisputeStatus.NONE, "Milestone is disputed");
        require(block.timestamp > job.deadline, "Deadline has not passed yet");

        bool wasGhosted = !m.delivered;

        m.released = true;
        job.releasedAmount += m.amount;
        usdc.transfer(job.client, m.amount); // full refund, no fee

        if (wasGhosted) {
            reputation.recordGhosting(job.freelancer, jobId);
        }

        if (job.releasedAmount == job.totalAmount) {
            job.status = JobStatus.CANCELLED;
        }

        emit ClientRefunded(jobId, milestoneIndex, m.amount);
    }

    // ───────────────────────── CLIENT GHOSTS ─────────────────────────

    function autoRelease(uint256 jobId, uint256 milestoneIndex) external nonReentrant {
        Job storage job = jobs[jobId];
        require(milestoneIndex < job.milestones.length, "Invalid milestone index");

        Milestone storage m = job.milestones[milestoneIndex];
        require(m.delivered, "Milestone not delivered");
        require(!m.released, "Already released");
        require(m.disputeStatus == DisputeStatus.NONE, "Milestone is disputed");
        require(block.timestamp > job.deadline + GRACE_PERIOD, "Grace period not over yet");

        uint256 fee = (m.amount * FEE_BPS) / BPS_DENOMINATOR;
        uint256 payoutAmount = m.amount - fee;

        m.released = true;
        job.releasedAmount += m.amount;

        if (fee > 0) usdc.transfer(feeRecipient, fee);
        usdc.transfer(job.freelancer, payoutAmount);

        reputation.recordAutoRelease(job.freelancer, jobId, m.amount);

        if (job.releasedAmount == job.totalAmount) {
            job.status = JobStatus.COMPLETED;
            emit JobCompleted(jobId);
        }

        emit AutoReleased(jobId, milestoneIndex, payoutAmount);
    }

    // ───────────────────────── DISPUTES ─────────────────────────

    function raiseDispute(uint256 jobId, uint256 milestoneIndex, string memory reason) external {
        Job storage job = jobs[jobId];
        require(msg.sender == job.client || msg.sender == job.freelancer, "Only job parties can raise dispute");
        require(milestoneIndex < job.milestones.length, "Invalid milestone index");

        Milestone storage m = job.milestones[milestoneIndex];
        require(m.delivered, "Can only dispute after delivery");
        require(!m.released, "Already released");
        require(m.disputeStatus == DisputeStatus.NONE, "Dispute already raised");
        require(block.timestamp <= m.disputeDeadline, "Dispute window has closed");

        m.disputeStatus = DisputeStatus.DISPUTED;
        m.disputeReason = reason;
        reputation.recordDisputeRaised(job.client, job.freelancer);

        emit DisputeRaised(jobId, milestoneIndex, msg.sender, reason);
    }

    /// @notice Arbiter decides. clientBps = share to client out of 10000. Costs a 1% arbitration fee.
    function resolveDispute(uint256 jobId, uint256 milestoneIndex, uint256 clientBps) external nonReentrant {
        require(msg.sender == arbiter, "Only arbiter can resolve disputes");
        require(clientBps <= BPS_DENOMINATOR, "clientBps must be <= 10000");

        Job storage job = jobs[jobId];
        require(milestoneIndex < job.milestones.length, "Invalid milestone index");
        Milestone storage m = job.milestones[milestoneIndex];
        require(m.disputeStatus == DisputeStatus.DISPUTED, "No active dispute on this milestone");

        _executeSplit(job, m, jobId, milestoneIndex, clientBps, true);
    }

    /// @notice Both parties agree on the same split without the arbiter. No fee.
    function agreeToSplit(uint256 jobId, uint256 milestoneIndex, uint256 clientBps) external nonReentrant {
        Job storage job = jobs[jobId];
        require(msg.sender == job.client || msg.sender == job.freelancer, "Only job parties");
        require(clientBps <= BPS_DENOMINATOR, "clientBps must be <= 10000");
        require(milestoneIndex < job.milestones.length, "Invalid milestone index");

        Milestone storage m = job.milestones[milestoneIndex];
        require(m.disputeStatus == DisputeStatus.DISPUTED, "No active dispute on this milestone");

        if (msg.sender == job.client) {
            m.clientProposalBps = clientBps;
        } else {
            m.freelancerProposalBps = clientBps;
        }
        emit SplitProposed(jobId, milestoneIndex, msg.sender, clientBps);

        if (m.clientProposalBps != NO_PROPOSAL &&
            m.freelancerProposalBps != NO_PROPOSAL &&
            m.clientProposalBps == m.freelancerProposalBps) {
            emit SplitAgreed(jobId, milestoneIndex, clientBps);
            _executeSplit(job, m, jobId, milestoneIndex, clientBps, false);
        }
    }

    function _executeSplit(
        Job storage job, Milestone storage m, uint256 jobId, uint256 milestoneIndex,
        uint256 clientBps, bool chargeArbitrationFee
    ) internal {
        uint256 amount = m.amount;
        uint256 arbFee = 0;

        if (chargeArbitrationFee) {
            arbFee = (amount * ARBITRATION_FEE_BPS) / BPS_DENOMINATOR;
            amount -= arbFee;
        }

        uint256 clientAmount = (amount * clientBps) / BPS_DENOMINATOR;
        uint256 freelancerAmount = amount - clientAmount;

        m.released = true;
        m.disputeStatus = DisputeStatus.RESOLVED;
        job.releasedAmount += m.amount;

        if (arbFee > 0) usdc.transfer(feeRecipient, arbFee);
        if (clientAmount > 0) usdc.transfer(job.client, clientAmount);
        if (freelancerAmount > 0) usdc.transfer(job.freelancer, freelancerAmount);

        if (clientBps == BPS_DENOMINATOR) {
            reputation.recordDisputeLoss(job.freelancer);
        } else if (clientBps == 0) {
            reputation.recordDisputeLoss(job.client);
        }

        if (job.releasedAmount == job.totalAmount) {
            job.status = JobStatus.COMPLETED;
            emit JobCompleted(jobId);
        }

        emit DisputeResolved(jobId, milestoneIndex, clientBps, clientAmount, freelancerAmount);
    }

    // ───────────────────────── ADMIN ─────────────────────────

    function setFeeRecipient(address _newRecipient) external {
        require(msg.sender == arbiter, "Only arbiter");
        require(_newRecipient != address(0), "Invalid address");
        feeRecipient = _newRecipient;
    }

    // ───────────────────────── VIEWS ─────────────────────────

    function getJob(uint256 jobId) external view returns (
        uint256 id, address client, address freelancer, uint256 totalAmount,
        uint256 releasedAmount, JobStatus status, string memory title,
        uint256 createdAt, uint256 deadline
    ) {
        Job storage job = jobs[jobId];
        return (job.jobId, job.client, job.freelancer, job.totalAmount,
                job.releasedAmount, job.status, job.title, job.createdAt, job.deadline);
    }

    function getMilestone(uint256 jobId, uint256 milestoneIndex) external view returns (Milestone memory) {
        return jobs[jobId].milestones[milestoneIndex];
    }

    function getMilestoneCount(uint256 jobId) external view returns (uint256) {
        return jobs[jobId].milestones.length;
    }

    function getClientJobs(address client) external view returns (uint256[] memory) {
        return clientJobs[client];
    }

    function getFreelancerJobs(address freelancer) external view returns (uint256[] memory) {
        return freelancerJobs[freelancer];
    }

    function getContractBalance() external view returns (uint256) {
        return usdc.balanceOf(address(this));
    }
}