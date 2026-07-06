'use strict';

/**
 * controllers/trustController.js
 *
 * Business logic for the AI trust report endpoint.
 *
 * GET /api/trust/:wallet
 *
 * Flow:
 *  1. Check trust_reports cache (expires after 24h)
 *  2. If cache miss → fetch TrustPassport from ReputationRegistry.getPassport()
 *  3. Call Gemini AI to generate structured trust report
 *  4. Cache the result in trust_reports table
 *  5. Return report to frontend
 *
 * If the contract is not deployed → use zero-passport fallback
 * If Gemini is unavailable       → gemini.js returns a deterministic fallback
 */

const walletQueries     = require('../db/queries/wallets');
const trustReportQueries = require('../db/queries/trustReports');
const blockchainSvc     = require('../services/blockchain');
const geminiSvc         = require('../services/gemini');

/**
 * getTrustReport
 *
 * Params: wallet (validated by validateWalletParam middleware)
 *
 * Response:
 *  {
 *    wallet:      string,
 *    riskScore:   number,  // 0–100
 *    riskLevel:   string,  // 'Low' | 'Medium' | 'High'
 *    summary:     string,
 *    flags:       string[],
 *    generatedAt: string,  // ISO timestamp
 *    cached:      boolean
 *  }
 */
exports.getTrustReport = async (req, res, next) => {
  try {
    const { wallet } = req.params;

    // ── 1. Check cache ─────────────────────────────────────
    const cached = await trustReportQueries.getCachedReport(wallet);
    if (cached) {
      return res.json({
        wallet,
        riskScore:   cached.risk_score,
        riskLevel:   cached.risk_level,
        summary:     cached.summary,
        flags:       cached.flags || [],
        generatedAt: cached.generated_at,
        cached:      true,
      });
    }

    // ── 2. Fetch on-chain passport ─────────────────────────
    let passport = {
      wallet,
      trustScore:       500,
      totalJobs:        0,
      completedJobs:    0,
      disputesInvolved: 0,
      disputesLost:     0,
      lateDeliveries:   0,
      ghostingCount:    0,
      totalVolume:      '0',
      memberSince:      0,
      lastUpdated:      0,
    };

    try {
      passport = await blockchainSvc.getPassportFromChain(wallet);

      // Cache the on-chain trust score in wallets table
      await walletQueries.upsertWallet(wallet);
      await walletQueries.updateTrustScore(wallet, passport.trustScore);
    } catch (chainErr) {
      // Contract not deployed or address is new wallet — use zero-passport
      console.warn(`[trustController] getPassport failed for ${wallet}: ${chainErr.message}`);
    }

    // ── 3. Generate AI report via Gemini ───────────────────
    const report = await geminiSvc.generateTrustReport(wallet, passport);

    // ── 4. Cache result ────────────────────────────────────
    await walletQueries.upsertWallet(wallet);
    const saved = await trustReportQueries.upsertReport(wallet, report);

    // ── 5. Respond ─────────────────────────────────────────
    return res.json({
      wallet,
      riskScore:   report.riskScore,
      riskLevel:   report.riskLevel,
      summary:     report.summary,
      flags:       report.flags,
      generatedAt: saved.generated_at,
      cached:      false,
    });
  } catch (err) {
    next(err);
  }
};
