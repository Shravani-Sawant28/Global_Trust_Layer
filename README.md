# Global Trust Layer

> Trust infrastructure for cross-border payments and freelance work, built on Arbitrum.

---

## What is Global Trust Layer?

Global Trust Layer (GTL) is a decentralized trust protocol that combines blockchain-based escrow, on-chain reputation, and AI-powered risk analysis to enable safe transactions between strangers — without intermediaries, without platform lock-in, and without excessive fees.


---

## The Problem

Freelancers and clients transacting across borders face three unsolved problems:

- **No payment safety** — clients can ghost after delivery, freelancers can disappear after advance payment
- **No portable reputation** — trust built on Upwork stays on Upwork, trust built on Fiverr stays on Fiverr
- **No fraud detection** — no way to know if a wallet has scammed others before

GTL solves all three with a single protocol layer.

---

## How It Works

```
Client locks funds in escrow (Arbitrum smart contract)
            ↓
Freelancer checks client Trust Passport + AI risk report
            ↓
Freelancer accepts job and completes work
            ↓
Client approves — funds released to freelancer
            ↓
Both wallets receive permanent reputation update on-chain
```

---

## Core Features

| Feature | Description |
|---|---|
| Escrow Contract | Locks client funds before work begins. Releases on approval or auto-releases after grace period. |
| Reputation Registry | Every job outcome updates an immutable on-chain trust score for both parties. |
| AI Trust Report | Gemini analyses wallet history and generates a risk report before any transaction. |
| Trust Passport | Public profile per wallet — score, history, AI summary. Shareable link. |
| Dispute System | Either party raises a dispute. Funds freeze. Resolved via mutual agreement, AI arbitration, or 50/50 default. |
| Milestone Payments | Lock full amount upfront, release in tranches as milestones complete. |

---

## Tech Stack

| Layer | Technology |
|---|---|
| Blockchain | Arbitrum Sepolia (testnet) |
| Smart Contracts | Solidity 0.8.19 + OpenZeppelin |
| Contract Dev | Hardhat |
| Frontend | Next.js 14, Tailwind CSS |
| Wallet Connection | RainbowKit + wagmi |
| Backend | Node.js + Express |
| Database | PostgreSQL |
| AI Layer | Google Gemini API |
| Blockchain Client | ethers.js |

---

## Folder Structure

```
global-trust-layer/
│
├── contracts/                          # Solidity smart contracts
│   ├── EscrowFactory.sol               # Job creation, fund locking, payment release, disputes
│   ├── ReputationRegistry.sol          # On-chain trust scores per wallet
│   └── interfaces/
│       └── IReputationRegistry.sol     # Interface for cross-contract calls
│
├── scripts/
│   └── deploy.js                       # Deploys both contracts to Arbitrum Sepolia
│
├── test/
│   ├── escrow.test.js                  # All EscrowFactory test cases
│   └── reputation.test.js              # All ReputationRegistry test cases
│
├── hardhat.config.js                   # Hardhat network and compiler config
├── .env                                # Root env — private key, RPC URL
├── .gitignore
│
├── backend/
│   ├── src/
│   │   ├── index.js                    # Express server entry point
│   │   │
│   │   ├── config/
│   │   │   ├── db.js                   # PostgreSQL connection pool
│   │   │   └── contract.js             # Loads ABIs and contract instances
│   │   │
│   │   ├── routes/
│   │   │   ├── jobs.js                 # /api/jobs endpoints
│   │   │   ├── trust.js                # /api/trust/:wallet endpoint
│   │   │   └── dispute.js              # /api/dispute endpoints
│   │   │
│   │   ├── controllers/
│   │   │   ├── jobController.js        # Job business logic
│   │   │   ├── trustController.js      # Trust report generation logic
│   │   │   └── disputeController.js    # Dispute management logic
│   │   │
│   │   ├── db/
│   │   │   ├── migrations/
│   │   │   │   └── 001_initial.sql     # Creates all PostgreSQL tables
│   │   │   └── queries/
│   │   │       ├── jobs.js             # SQL queries for jobs table
│   │   │       ├── disputes.js         # SQL queries for disputes table
│   │   │       ├── wallets.js          # SQL queries for wallets table
│   │   │       └── milestones.js       # SQL queries for milestones table
│   │   │
│   │   ├── services/
│   │   │   ├── gemini.js               # Gemini API integration
│   │   │   ├── blockchain.js           # ethers.js contract interactions
│   │   │   └── listener.js             # Listens to on-chain events, updates DB
│   │   │
│   │   └── middleware/
│   │       └── errorHandler.js         # Global error handling
│   │
│   ├── .env                            # Backend env variables
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── app/                        # Next.js App Router pages
│   │   │   ├── page.jsx                # Landing page
│   │   │   ├── layout.jsx              # Root layout with wallet providers
│   │   │   ├── onboarding/
│   │   │   │   └── page.jsx            # Connect wallet + role selection
│   │   │   ├── dashboard/
│   │   │   │   └── page.jsx            # User dashboard
│   │   │   ├── jobs/
│   │   │   │   ├── create/
│   │   │   │   │   └── page.jsx        # Post a job (client)
│   │   │   │   ├── browse/
│   │   │   │   │   └── page.jsx        # Browse jobs (freelancer)
│   │   │   │   └── [id]/
│   │   │   │       └── page.jsx        # Job detail page
│   │   │   ├── trust/
│   │   │   │   └── [wallet]/
│   │   │   │       └── page.jsx        # Trust Passport — public wallet profile
│   │   │   └── dispute/
│   │   │       └── [id]/
│   │   │           └── page.jsx        # Dispute management page
│   │   │
│   │   ├── components/
│   │   │   ├── layout/
│   │   │   │   ├── Navbar.jsx
│   │   │   │   └── Footer.jsx
│   │   │   ├── jobs/
│   │   │   │   ├── JobCard.jsx         # Single job preview card
│   │   │   │   ├── JobList.jsx         # List of job cards
│   │   │   │   ├── JobForm.jsx         # Create job form
│   │   │   │   └── JobStatus.jsx       # Job progress status bar
│   │   │   ├── trust/
│   │   │   │   ├── TrustScore.jsx      # Trust score display
│   │   │   │   ├── TrustReport.jsx     # AI trust report display
│   │   │   │   └── TrustBadge.jsx      # Small score badge for job cards
│   │   │   ├── dispute/
│   │   │   │   ├── DisputeForm.jsx     # Evidence submission form
│   │   │   │   └── SplitProposal.jsx   # Payment split UI
│   │   │   └── ui/
│   │   │       ├── Button.jsx
│   │   │       ├── Modal.jsx
│   │   │       ├── Loader.jsx
│   │   │       └── TransactionToast.jsx
│   │   │
│   │   ├── hooks/
│   │   │   ├── useEscrow.js            # wagmi hooks for EscrowFactory
│   │   │   ├── useReputation.js        # wagmi hooks for ReputationRegistry
│   │   │   └── useTrustReport.js       # Fetches AI report from backend
│   │   │
│   │   ├── lib/
│   │   │   ├── wagmiConfig.js          # wagmi and RainbowKit setup
│   │   │   ├── contracts.js            # Contract addresses and ABIs
│   │   │   └── api.js                  # Axios instance for backend calls
│   │   │
│   │   └── styles/
│   │       └── globals.css
│   │
│   ├── public/
│   │   └── logo.svg
│   │
│   ├── .env.local
│   ├── next.config.js
│   └── package.json
│
├── abis/
│   ├── EscrowFactory.json              # Generated after npx hardhat compile
│   └── ReputationRegistry.json         # Generated after npx hardhat compile
│
└── README.md
```

---

## Database Schema

GTL uses PostgreSQL with six tables:

| Table | Purpose |
|---|---|
| `wallets` | Every wallet that has used GTL — stores cached trust scores |
| `jobs` | All jobs posted — links to client and freelancer wallets |
| `milestones` | Individual milestones for milestone-based jobs |
| `disputes` | All disputes raised — stores evidence, AI verdict, final resolution |
| `trust_reports` | Cached AI trust reports — expires after 24 hours |
| `transactions` | Audit log of every on-chain transaction |

---

## Smart Contracts

### EscrowFactory

Handles the full job lifecycle on-chain.

| Function | Who Calls | What It Does |
|---|---|---|
| `createEscrow()` | Client | Creates job, locks funds in contract |
| `submitWork()` | Freelancer | Marks work as submitted |
| `releasePayment()` | Client | Approves work, releases funds minus 2% fee |
| `refundClient()` | Client | Refunds client if freelancer ghosted after deadline |
| `autoRelease()` | Anyone | Auto-releases payment 7 days after deadline if client silent |
| `raiseDispute()` | Client or Freelancer | Freezes funds, opens dispute |
| `agreeToSplit()` | Both parties | Executes agreed split resolution |
| `defaultResolution()` | Anyone | 50/50 split after 30 days of unresolved dispute |

### ReputationRegistry

Stores immutable trust scores per wallet.

| Function | Who Calls | What It Does |
|---|---|---|
| `updateReputation()` | EscrowFactory only | Updates scores after job outcome |
| `getProfile()` | Anyone | Returns full profile for any wallet |
| `getTrustScore()` | Anyone | Returns just the trust score |
| `getStats()` | Anyone | Returns key stats summary |

