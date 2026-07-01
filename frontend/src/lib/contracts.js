// ─────────────────────────────────────────────────────────────────
//  GTL Smart Contract — Placeholder Addresses & ABI Stubs
//
//  TODO: After deploying with `npx hardhat run scripts/deploy.js
//        --network arbitrumSepolia`, replace the ADDRESS values
//        below with the real deployed addresses printed in the
//        deployment output.
// ─────────────────────────────────────────────────────────────────

// ── Deployed Addresses ──────────────────────────────────────────
export const CONTRACT_ADDRESSES = {
  ESCROW_FACTORY: process.env.NEXT_PUBLIC_ESCROW_FACTORY_ADDRESS ||
    '0x0000000000000000000000000000000000000000',

  REPUTATION_REGISTRY: process.env.NEXT_PUBLIC_REPUTATION_REGISTRY_ADDRESS ||
    '0x0000000000000000000000000000000000000000',
};

// ── EscrowFactory ABI (stub — mirrors README contract spec) ─────
//
//  Function signatures designed to match Solidity 0.8.19 patterns.
//  The `token` param is address(0) for native ETH, or an ERC-20
//  address (e.g., USDC on Arbitrum Sepolia) for token payments.
//
export const ESCROW_FACTORY_ABI = [
  // ── Write Functions ────────────────────────────────────────────
  {
    name: 'createEscrow',
    type: 'function',
    stateMutability: 'payable',
    inputs: [
      { name: 'freelancer',        type: 'address'   }, // address(0) for public post
      { name: 'deadline',          type: 'uint256'   }, // Unix timestamp
      { name: 'milestoneAmounts',  type: 'uint256[]' }, // empty [] for single-job
      { name: 'token',             type: 'address'   }, // address(0) = ETH
    ],
    outputs: [{ name: 'escrowId', type: 'uint256' }],
  },
  {
    name: 'submitWork',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'escrowId',    type: 'uint256' },
      { name: 'evidenceUri', type: 'string'  }, // IPFS URI or empty string for MVP
    ],
    outputs: [],
  },
  {
    name: 'releasePayment',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [{ name: 'escrowId', type: 'uint256' }],
    outputs: [],
  },
  {
    name: 'refundClient',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [{ name: 'escrowId', type: 'uint256' }],
    outputs: [],
  },
  {
    name: 'autoRelease',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [{ name: 'escrowId', type: 'uint256' }],
    outputs: [],
  },
  {
    name: 'raiseDispute',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'escrowId', type: 'uint256' },
      { name: 'reason',   type: 'string'  },
    ],
    outputs: [],
  },
  {
    name: 'agreeToSplit',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'escrowId',          type: 'uint256' },
      { name: 'clientBps',         type: 'uint256' }, // basis points to client (e.g. 5000 = 50%)
    ],
    outputs: [],
  },
  {
    name: 'defaultResolution',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [{ name: 'escrowId', type: 'uint256' }],
    outputs: [],
  },

  // ── Read Functions ─────────────────────────────────────────────
  {
    name: 'getEscrow',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'escrowId', type: 'uint256' }],
    outputs: [
      { name: 'client',     type: 'address' },
      { name: 'freelancer', type: 'address' },
      { name: 'amount',     type: 'uint256' },
      { name: 'deadline',   type: 'uint256' },
      { name: 'status',     type: 'uint8'   }, // 0=Funded 1=InProgress 2=Submitted 3=Disputed 4=Complete 5=Refunded
      { name: 'token',      type: 'address' },
    ],
  },

  // ── Events ─────────────────────────────────────────────────────
  {
    name: 'EscrowCreated',
    type: 'event',
    inputs: [
      { name: 'escrowId',   type: 'uint256', indexed: true },
      { name: 'client',     type: 'address', indexed: true },
      { name: 'freelancer', type: 'address', indexed: true },
      { name: 'amount',     type: 'uint256', indexed: false },
    ],
  },
  {
    name: 'PaymentReleased',
    type: 'event',
    inputs: [
      { name: 'escrowId',   type: 'uint256', indexed: true },
      { name: 'freelancer', type: 'address', indexed: true },
      { name: 'amount',     type: 'uint256', indexed: false },
    ],
  },
  {
    name: 'DisputeRaised',
    type: 'event',
    inputs: [
      { name: 'escrowId', type: 'uint256', indexed: true },
      { name: 'raisedBy', type: 'address', indexed: true },
    ],
  },
];

// ── ReputationRegistry ABI (stub) ───────────────────────────────
export const REPUTATION_REGISTRY_ABI = [
  {
    name: 'getProfile',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'wallet', type: 'address' }],
    outputs: [
      { name: 'trustScore',    type: 'uint256' }, // 0–100
      { name: 'jobsCompleted', type: 'uint256' },
      { name: 'disputeCount',  type: 'uint256' },
      { name: 'totalEarned',   type: 'uint256' }, // in wei
      { name: 'memberSince',   type: 'uint256' }, // Unix timestamp
    ],
  },
  {
    name: 'getTrustScore',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'wallet', type: 'address' }],
    outputs: [{ name: 'score', type: 'uint256' }],
  },
  {
    name: 'getStats',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'wallet', type: 'address' }],
    outputs: [
      { name: 'totalJobs',     type: 'uint256' },
      { name: 'completedJobs', type: 'uint256' },
      { name: 'disputeCount',  type: 'uint256' },
      { name: 'disputeRate',   type: 'uint256' }, // basis points
    ],
  },
  {
    name: 'ReputationUpdated',
    type: 'event',
    inputs: [
      { name: 'wallet',     type: 'address', indexed: true },
      { name: 'newScore',   type: 'uint256', indexed: false },
      { name: 'jobOutcome', type: 'uint8',   indexed: false }, // 0=completed 1=disputed
    ],
  },
];
