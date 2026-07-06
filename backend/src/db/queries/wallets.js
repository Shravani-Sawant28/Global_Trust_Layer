'use strict';

/**
 * db/queries/wallets.js
 *
 * All SQL operations against the `wallets` table.
 * Every wallet is upserted on first contact so foreign key
 * references from jobs/disputes always resolve.
 */

const { pool } = require('../../config/db');

/**
 * Upsert a wallet record.
 * Creates it if it doesn't exist; updates role if provided.
 *
 * @param {string} address  - Ethereum address (checksummed or lowercase)
 * @param {string} [role]   - 'CLIENT' | 'FREELANCER' | 'BOTH'
 * @returns {Promise<object>} wallet row
 */
async function upsertWallet(address, role) {
  const addr = address.toLowerCase();

  if (role) {
    const { rows } = await pool.query(
      `INSERT INTO wallets (address, role)
       VALUES ($1, $2)
       ON CONFLICT (address)
       DO UPDATE SET role = EXCLUDED.role
       RETURNING *`,
      [addr, role]
    );
    return rows[0];
  }

  // No role — just ensure the row exists
  const { rows } = await pool.query(
    `INSERT INTO wallets (address)
     VALUES ($1)
     ON CONFLICT (address) DO NOTHING
     RETURNING *`,
    [addr]
  );

  if (rows.length > 0) return rows[0];

  // Row already existed — fetch it
  const existing = await pool.query(
    'SELECT * FROM wallets WHERE address = $1',
    [addr]
  );
  return existing.rows[0];
}

/**
 * Get a single wallet record.
 *
 * @param {string} address
 * @returns {Promise<object|null>}
 */
async function getWallet(address) {
  const { rows } = await pool.query(
    'SELECT * FROM wallets WHERE address = $1',
    [address.toLowerCase()]
  );
  return rows[0] || null;
}

/**
 * Cache the on-chain trust score for a wallet.
 *
 * @param {string} address
 * @param {number} score
 * @returns {Promise<void>}
 */
async function updateTrustScore(address, score) {
  await pool.query(
    `UPDATE wallets
     SET trust_score = $2, cached_at = NOW()
     WHERE address = $1`,
    [address.toLowerCase(), score]
  );
}

module.exports = { upsertWallet, getWallet, updateTrustScore };
