'use strict';

/**
 * migrate.js — runs the initial SQL migration against the PostgreSQL database.
 *
 * Usage: npm run migrate
 *
 * This script reads 001_initial.sql and executes it as a single transaction.
 * Safe to re-run: all CREATE statements use IF NOT EXISTS.
 */

require('dotenv').config();

const fs   = require('fs');
const path = require('path');
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.PGSSLMODE === 'require'
    ? { rejectUnauthorized: false }
    : false,
});

async function migrate() {
  const sqlPath = path.join(__dirname, 'migrations', '001_initial.sql');
  const sql     = fs.readFileSync(sqlPath, 'utf8');

  const client = await pool.connect();
  try {
    console.log('[migrate] Running 001_initial.sql …');
    await client.query('BEGIN');
    await client.query(sql);
    await client.query('COMMIT');
    console.log('[migrate] ✅ Migration complete.');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('[migrate] ❌ Migration failed:', err.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

migrate();
