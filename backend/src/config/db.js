'use strict';

const { Pool } = require('pg');

/**
 * PostgreSQL connection pool.
 *
 * Uses DATABASE_URL (connection string) from the environment.
 * All query modules import this pool directly.
 *
 * ssl is disabled for local dev; enable for production cloud DBs
 * by setting PGSSLMODE=require in the environment.
 */
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.PGSSLMODE === 'require'
    ? { rejectUnauthorized: false }
    : false,
  max: 10,               // max pool connections
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

// Surface connection errors early rather than on first query
pool.on('error', (err) => {
  console.error('[DB] Unexpected pool error:', err.message);
});

/**
 * Verify connectivity — called at startup.
 * @returns {Promise<void>}
 */
async function testConnection() {
  const client = await pool.connect();
  try {
    await client.query('SELECT 1');
    console.log('[DB] PostgreSQL connected successfully');
  } finally {
    client.release();
  }
}

module.exports = { pool, testConnection };
