'use strict';

/**
 * db/queries/trustReports.js
 *
 * All SQL operations against the `trust_reports` table.
 *
 * Reports are cached per wallet with a 24-hour TTL.
 * The trustController checks getCachedReport() first before
 * calling the Gemini API to avoid unnecessary API costs.
 */

const { pool } = require('../../config/db');

/**
 * Retrieve a cached trust report if it hasn't expired.
 *
 * @param {string} wallet
 * @returns {Promise<object|null>} report row or null if expired/missing
 */
async function getCachedReport(wallet) {
  const { rows } = await pool.query(
    `SELECT * FROM trust_reports
     WHERE wallet = $1 AND expires_at > NOW()`,
    [wallet.toLowerCase()]
  );
  return rows[0] || null;
}

/**
 * Upsert a trust report (insert or overwrite existing).
 * Resets the 24-hour expiry on every upsert.
 *
 * @param {string} wallet
 * @param {object} report
 * @param {number} report.riskScore
 * @param {string} report.riskLevel
 * @param {string} report.summary
 * @param {string[]} report.flags
 * @returns {Promise<object>} upserted row
 */
async function upsertReport(wallet, report) {
  const { riskScore, riskLevel, summary, flags = [] } = report;

  const { rows } = await pool.query(
    `INSERT INTO trust_reports (wallet, risk_score, risk_level, summary, flags, generated_at, expires_at)
     VALUES ($1, $2, $3, $4, $5, NOW(), NOW() + INTERVAL '24 hours')
     ON CONFLICT (wallet)
     DO UPDATE SET
       risk_score   = EXCLUDED.risk_score,
       risk_level   = EXCLUDED.risk_level,
       summary      = EXCLUDED.summary,
       flags        = EXCLUDED.flags,
       generated_at = NOW(),
       expires_at   = NOW() + INTERVAL '24 hours'
     RETURNING *`,
    [wallet.toLowerCase(), riskScore, riskLevel, summary, JSON.stringify(flags)]
  );
  return rows[0];
}

module.exports = { getCachedReport, upsertReport };
