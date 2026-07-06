-- ============================================================
--  Global Trust Layer — PostgreSQL Schema
--  Migration: 001_initial.sql
--  Run via: npm run migrate
-- ============================================================

-- ─── wallets ──────────────────────────────────────────────
-- Every wallet address that has interacted with GTL.
-- trust_score is a cached value from ReputationRegistry.getPassport().
-- The on-chain value is authoritative; this is for fast reads.

CREATE TABLE IF NOT EXISTS wallets (
  address        VARCHAR(42)  PRIMARY KEY,
  role           VARCHAR(20)  CHECK (role IN ('CLIENT', 'FREELANCER', 'BOTH')),
  trust_score    INTEGER      NOT NULL DEFAULT 0,
  cached_at      TIMESTAMPTZ,
  created_at     TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- ─── jobs ─────────────────────────────────────────────────
-- Off-chain metadata for each job. on_chain_job_id links to
-- the EscrowFactory.jobs mapping (uint256 jobId).

CREATE TABLE IF NOT EXISTS jobs (
  id               SERIAL       PRIMARY KEY,
  on_chain_job_id  INTEGER      UNIQUE,
  client_wallet    VARCHAR(42)  NOT NULL REFERENCES wallets(address),
  freelancer_wallet VARCHAR(42) REFERENCES wallets(address),
  title            TEXT         NOT NULL,
  description      TEXT,
  budget_raw       VARCHAR(100) NOT NULL,
  currency         VARCHAR(10)  NOT NULL DEFAULT 'USDC',
  deadline         TIMESTAMPTZ,
  status           VARCHAR(20)  NOT NULL DEFAULT 'Funded',
  category         VARCHAR(100),
  is_public        BOOLEAN      NOT NULL DEFAULT TRUE,
  created_at       TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_jobs_client_wallet    ON jobs(client_wallet);
CREATE INDEX IF NOT EXISTS idx_jobs_freelancer_wallet ON jobs(freelancer_wallet);
CREATE INDEX IF NOT EXISTS idx_jobs_status           ON jobs(status);
CREATE INDEX IF NOT EXISTS idx_jobs_on_chain_job_id  ON jobs(on_chain_job_id);

-- ─── milestones ────────────────────────────────────────────
-- Individual milestones per job. on_chain_index mirrors the
-- Milestone[] array index in the EscrowFactory Job struct.

CREATE TABLE IF NOT EXISTS milestones (
  id              SERIAL       PRIMARY KEY,
  job_id          INTEGER      NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  on_chain_index  INTEGER      NOT NULL,
  title           TEXT,
  amount_raw      VARCHAR(100) NOT NULL,
  status          VARCHAR(20)  NOT NULL DEFAULT 'PENDING',
  ipfs_hash       TEXT,
  delivered_at    TIMESTAMPTZ,
  created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  UNIQUE (job_id, on_chain_index)
);

CREATE INDEX IF NOT EXISTS idx_milestones_job_id ON milestones(job_id);

-- ─── disputes ──────────────────────────────────────────────
-- Off-chain dispute records. Links to on-chain dispute state
-- via job_id + milestone_index.

CREATE TABLE IF NOT EXISTS disputes (
  id                      SERIAL      PRIMARY KEY,
  job_id                  INTEGER     NOT NULL REFERENCES jobs(id),
  milestone_index         INTEGER     NOT NULL DEFAULT 0,
  raised_by               VARCHAR(42) NOT NULL,
  reason                  TEXT        NOT NULL,
  status                  VARCHAR(20) NOT NULL DEFAULT 'OPEN',
  ai_verdict              TEXT,
  client_proposal_bps     INTEGER,
  freelancer_proposal_bps INTEGER,
  resolved_at             TIMESTAMPTZ,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_disputes_job_id ON disputes(job_id);

-- ─── trust_reports ─────────────────────────────────────────
-- Cached Gemini AI trust reports. expires_at = generated_at + 24h.
-- Controller checks expires_at before calling Gemini again.

CREATE TABLE IF NOT EXISTS trust_reports (
  id           SERIAL       PRIMARY KEY,
  wallet       VARCHAR(42)  NOT NULL REFERENCES wallets(address),
  risk_score   INTEGER      NOT NULL,
  risk_level   VARCHAR(20)  NOT NULL,
  summary      TEXT         NOT NULL,
  flags        JSONB        NOT NULL DEFAULT '[]',
  generated_at TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  expires_at   TIMESTAMPTZ  NOT NULL DEFAULT (NOW() + INTERVAL '24 hours'),
  UNIQUE (wallet)
);

CREATE INDEX IF NOT EXISTS idx_trust_reports_wallet     ON trust_reports(wallet);
CREATE INDEX IF NOT EXISTS idx_trust_reports_expires_at ON trust_reports(expires_at);

-- ─── transactions ──────────────────────────────────────────
-- Immutable audit log of every on-chain transaction event
-- synced by the blockchain event listener.

CREATE TABLE IF NOT EXISTS transactions (
  id           SERIAL       PRIMARY KEY,
  job_id       INTEGER      REFERENCES jobs(id),
  tx_hash      VARCHAR(66)  UNIQUE NOT NULL,
  type         VARCHAR(50)  NOT NULL,
  from_wallet  VARCHAR(42),
  amount_raw   VARCHAR(100),
  block_number BIGINT,
  created_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_transactions_job_id      ON transactions(job_id);
CREATE INDEX IF NOT EXISTS idx_transactions_from_wallet ON transactions(from_wallet);
