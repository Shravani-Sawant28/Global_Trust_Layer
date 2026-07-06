'use strict';

/**
 * controllers/userController.js
 *
 * Business logic for user/wallet management endpoints.
 *
 * Endpoints:
 *  GET  /api/user/:wallet  → getUser
 *  POST /api/user          → saveUser
 *
 * These endpoints are used by:
 *  - AppContext.jsx (getUser on wallet connect to load profile)
 *  - Onboarding page (saveUser after role selection)
 *
 * The X-Wallet-Address header set by the frontend's api.js
 * interceptor is also read as a fallback for wallet identity.
 */

const walletQueries  = require('../db/queries/wallets');
const blockchainSvc  = require('../services/blockchain');

// ─────────────────────────────────────────────────────────────
//  GET /api/user/:wallet
// ─────────────────────────────────────────────────────────────

/**
 * getUser — get or create a wallet profile.
 *
 * Returns the wallet record from DB merged with live on-chain
 * trust score when the contract is available.
 *
 * Params: wallet (validated by validateWalletParam middleware)
 *
 * Response: 200 { user }
 */
exports.getUser = async (req, res, next) => {
  try {
    const { wallet } = req.params;

    // Upsert ensures wallet row always exists for the caller
    let record = await walletQueries.upsertWallet(wallet);

    // Attempt to hydrate trust score from chain
    try {
      const score = await blockchainSvc.getTrustScoreFromChain(wallet);
      await walletQueries.updateTrustScore(wallet, score);
      record = { ...record, trust_score: score };
    } catch {
      // Contract not deployed or wallet is brand new — use DB cached score
    }

    return res.json({ user: formatUser(record) });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────
//  POST /api/user
// ─────────────────────────────────────────────────────────────

/**
 * saveUser — persist wallet role (CLIENT | FREELANCER).
 *
 * Called from the onboarding page after the user selects a role.
 * The frontend also stores role in localStorage; this creates
 * the server-side record for API queries.
 *
 * Request body:
 *  {
 *    wallet: string  (required)
 *    role:   'CLIENT' | 'FREELANCER' | 'BOTH'  (required)
 *  }
 *
 * Response: 200 { user }
 */
exports.saveUser = async (req, res, next) => {
  try {
    const { wallet, role } = req.body;

    if (!wallet) {
      const err = new Error('wallet is required'); err.statusCode = 400; return next(err);
    }
    if (!role || !['CLIENT', 'FREELANCER', 'BOTH'].includes(role)) {
      const err = new Error("role must be 'CLIENT', 'FREELANCER', or 'BOTH'");
      err.statusCode = 400;
      return next(err);
    }

    const record = await walletQueries.upsertWallet(wallet, role);
    return res.json({ user: formatUser(record) });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────
//  Helpers
// ─────────────────────────────────────────────────────────────

function formatUser(record) {
  return {
    wallet:     record.address,
    role:       record.role || null,
    trustScore: record.trust_score || 0,
    cachedAt:   record.cached_at   || null,
    memberSince: record.created_at,
  };
}
