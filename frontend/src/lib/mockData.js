/**
 * Mock fixture data for offline development.
 *
 * All API hooks fall back to this data when the backend is unavailable.
 * Data is also seeded into localStorage on first load via AppContext.
 */

// ── Status constants ──────────────────────────────────────────────
export const JOB_STATUS = {
  FUNDED:      'Funded',
  IN_PROGRESS: 'In Progress',
  SUBMITTED:   'Submitted',
  DISPUTED:    'Disputed',
  COMPLETE:    'Complete',
  REFUNDED:    'Refunded',
};

// ── Mock wallet addresses ─────────────────────────────────────────
export const MOCK_WALLETS = {
  CLIENT_A:     '0xaBC1234567890abcdef1234567890abcdef12345',
  CLIENT_B:     '0xbCD2345678901bcdef2345678901bcdef234567',
  FREELANCER_A: '0xcDE3456789012cdef3456789012cdef3456789',
  FREELANCER_B: '0xdEF4567890123def4567890123def456789012',
};

// ── Mock jobs ─────────────────────────────────────────────────────
export const MOCK_JOBS = [
  {
    id: 'job_001',
    title: 'Build a Solidity Escrow Contract for DeFi Protocol',
    description:
      'We need an experienced Solidity developer to build a multi-sig escrow contract compatible with ERC-20 tokens. The contract must pass a Slither audit.',
    budget: '1.5',
    currency: 'ETH',
    deadline: '2026-08-15',
    clientWallet: MOCK_WALLETS.CLIENT_A,
    freelancerWallet: null, // public post
    status: JOB_STATUS.FUNDED,
    escrowId: 1,
    milestones: [],
    createdAt: '2026-06-20T10:00:00Z',
    category: 'Blockchain / Solidity',
    clientTrustScore: 88,
  },
  {
    id: 'job_002',
    title: 'Next.js Dashboard UI for Analytics Platform',
    description:
      'Design and implement a responsive analytics dashboard using Next.js 14, Tailwind CSS, and Recharts. Should include dark mode and data table components.',
    budget: '800',
    currency: 'USDC',
    deadline: '2026-07-30',
    clientWallet: MOCK_WALLETS.CLIENT_B,
    freelancerWallet: MOCK_WALLETS.FREELANCER_A,
    status: JOB_STATUS.IN_PROGRESS,
    escrowId: 2,
    milestones: [
      { id: 'm_001', title: 'Figma Designs',    amount: '200', status: 'APPROVED' },
      { id: 'm_002', title: 'Component Library', amount: '300', status: 'SUBMITTED' },
      { id: 'm_003', title: 'Final Integration', amount: '300', status: 'PENDING'   },
    ],
    createdAt: '2026-06-18T09:00:00Z',
    category: 'Frontend / React',
    clientTrustScore: 72,
  },
  {
    id: 'job_003',
    title: 'Smart Contract Security Audit — ERC-721',
    description:
      'Full security audit of our ERC-721 NFT contract. Looking for a certified auditor familiar with Slither, Mythril, and Echidna.',
    budget: '0.8',
    currency: 'ETH',
    deadline: '2026-07-20',
    clientWallet: MOCK_WALLETS.CLIENT_A,
    freelancerWallet: MOCK_WALLETS.FREELANCER_B,
    status: JOB_STATUS.DISPUTED,
    escrowId: 3,
    milestones: [],
    createdAt: '2026-06-10T14:00:00Z',
    category: 'Security / Audit',
    clientTrustScore: 88,
  },
  {
    id: 'job_004',
    title: 'API Integration — Stripe + Webhooks',
    description:
      'Integrate Stripe payment gateway into our Node.js/Express backend. Includes webhook handling, idempotency, and test coverage.',
    budget: '500',
    currency: 'USDC',
    deadline: '2026-07-10',
    clientWallet: MOCK_WALLETS.CLIENT_B,
    freelancerWallet: MOCK_WALLETS.FREELANCER_A,
    status: JOB_STATUS.COMPLETE,
    escrowId: 4,
    milestones: [],
    createdAt: '2026-06-01T08:00:00Z',
    category: 'Backend / Node.js',
    clientTrustScore: 72,
  },
  {
    id: 'job_005',
    title: 'Technical Content Writing — Web3 Explainers (5 articles)',
    description:
      'Write five 1500-word technical explainer articles on DeFi, NFTs, L2s, ZK proofs, and account abstraction for a developer-focused blog.',
    budget: '300',
    currency: 'USDC',
    deadline: '2026-08-01',
    clientWallet: MOCK_WALLETS.CLIENT_A,
    freelancerWallet: null,
    status: JOB_STATUS.FUNDED,
    escrowId: 5,
    milestones: [],
    createdAt: '2026-06-28T11:00:00Z',
    category: 'Writing / Content',
    clientTrustScore: 88,
  },
];

// ── Mock reputation profiles ───────────────────────────────────────
export const MOCK_PROFILES = {
  [MOCK_WALLETS.CLIENT_A]: {
    wallet: MOCK_WALLETS.CLIENT_A,
    trustScore: 88,
    jobsCompleted: 14,
    disputeCount: 1,
    totalEarned: '0',   // clients don't earn
    totalSpent: '22.4',
    memberSince: '2025-01-15T00:00:00Z',
    role: 'CLIENT',
  },
  [MOCK_WALLETS.CLIENT_B]: {
    wallet: MOCK_WALLETS.CLIENT_B,
    trustScore: 72,
    jobsCompleted: 6,
    disputeCount: 2,
    totalEarned: '0',
    totalSpent: '8100',
    memberSince: '2025-06-10T00:00:00Z',
    role: 'CLIENT',
  },
  [MOCK_WALLETS.FREELANCER_A]: {
    wallet: MOCK_WALLETS.FREELANCER_A,
    trustScore: 95,
    jobsCompleted: 31,
    disputeCount: 0,
    totalEarned: '18.7',
    totalSpent: '0',
    memberSince: '2024-11-01T00:00:00Z',
    role: 'FREELANCER',
  },
  [MOCK_WALLETS.FREELANCER_B]: {
    wallet: MOCK_WALLETS.FREELANCER_B,
    trustScore: 61,
    jobsCompleted: 8,
    disputeCount: 3,
    totalEarned: '4.2',
    totalSpent: '0',
    memberSince: '2025-03-20T00:00:00Z',
    role: 'FREELANCER',
  },
};

// ── Mock AI trust reports ─────────────────────────────────────────
export const MOCK_TRUST_REPORTS = {
  [MOCK_WALLETS.CLIENT_A]: {
    wallet: MOCK_WALLETS.CLIENT_A,
    riskScore: 88,
    riskLevel: 'Low',
    summary:
      'This wallet has a strong payment history across 14 completed jobs with only one dispute on record — resolved in the client\'s favour. On-chain activity shows consistent, timely fund releases with no signs of bad-faith behaviour.',
    flags: [],
    generatedAt: '2026-07-01T05:00:00Z',
  },
  [MOCK_WALLETS.FREELANCER_B]: {
    wallet: MOCK_WALLETS.FREELANCER_B,
    riskScore: 61,
    riskLevel: 'Medium',
    summary:
      'This wallet shows moderate risk. Three disputes in 8 jobs (37.5% dispute rate) is above the GTL network average of 8%. Two disputes remain unresolved beyond 30 days. Recommended: request milestone-based payment structure.',
    flags: ['High dispute rate (37.5%)', 'Two long-running unresolved disputes'],
    generatedAt: '2026-07-01T05:00:00Z',
  },
};

// ── Mock transaction feed ──────────────────────────────────────────
export const MOCK_TRANSACTIONS = [
  {
    id: 'tx_001',
    type: 'Escrow Created',
    jobTitle: 'Solidity Escrow Contract',
    amount: '1.5 ETH',
    txHash: '0xabc123def456789abc123def456789abc123def456789abc123def4567890001',
    status: JOB_STATUS.FUNDED,
    timestamp: '2026-06-20T10:05:00Z',
  },
  {
    id: 'tx_002',
    type: 'Payment Released',
    jobTitle: 'Stripe API Integration',
    amount: '500 USDC',
    txHash: '0xbcd234ef5678901bcd234ef5678901bcd234ef5678901bcd234ef56789010002',
    status: JOB_STATUS.COMPLETE,
    timestamp: '2026-07-10T16:30:00Z',
  },
  {
    id: 'tx_003',
    type: 'Dispute Raised',
    jobTitle: 'Smart Contract Security Audit',
    amount: '0.8 ETH',
    txHash: '0xcde345f0678901cde345f0678901cde345f0678901cde345f067890123450003',
    status: JOB_STATUS.DISPUTED,
    timestamp: '2026-06-25T09:00:00Z',
  },
];
