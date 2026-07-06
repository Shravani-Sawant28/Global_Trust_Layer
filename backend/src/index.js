'use strict';

/**
 * src/index.js — Express server entry point
 *
 * Startup sequence:
 *  1. Load .env
 *  2. Initialise contract instances (non-blocking — logs warning if not configured)
 *  3. Connect to PostgreSQL — fail fast if DB is down
 *  4. Start Express with all routes and middleware
 *  5. Start blockchain event listeners (non-blocking)
 */

require('dotenv').config();

const express    = require('express');
const cors       = require('cors');
const helmet     = require('helmet');

const { testConnection }  = require('./config/db');
const { initContracts }   = require('./config/contract');
const { startListeners }  = require('./services/listener');
const errorHandler        = require('./middleware/errorHandler');
const { defaultRateLimiter } = require('./middleware/rateLimit');

// ── Routes ───────────────────────────────────────────────────
const jobRoutes     = require('./routes/jobs');
const trustRoutes   = require('./routes/trust');
const disputeRoutes = require('./routes/dispute');
const userRoutes    = require('./routes/user');

const app  = express();
const PORT = process.env.PORT || 3001;

// ── Security & parsing middleware ────────────────────────────
app.use(helmet());

// CORS — allow the Next.js frontend origin
const allowedOrigins = [
  process.env.FRONTEND_URL || 'http://localhost:3000',
  'http://localhost:3000',
  'http://localhost:3001',
];
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (server-to-server, curl, Postman)
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`CORS: origin ${origin} not allowed`));
    }
  },
  methods:     ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'X-Wallet-Address'],
  credentials: true,
}));

app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: false }));

// Apply default rate limiter to all routes
app.use(defaultRateLimiter);

// ── Health check ─────────────────────────────────────────────
app.get('/health', async (req, res) => {
  const { pool }   = require('./config/db');
  const { isContractReady } = require('./config/contract');

  let dbStatus = 'disconnected';
  try {
    await pool.query('SELECT 1');
    dbStatus = 'connected';
  } catch { /* ignore */ }

  res.json({
    status:    'OK',
    db:        dbStatus,
    chain:     isContractReady ? 'connected' : 'not_configured',
    timestamp: new Date().toISOString(),
  });
});

// ── API routes ───────────────────────────────────────────────
app.use('/api/jobs',    jobRoutes);
app.use('/api/trust',   trustRoutes);
app.use('/api/dispute', disputeRoutes);
app.use('/api/user',    userRoutes);

// 404 for unmatched routes
app.use((req, res, next) => {
  const err = new Error(`Route not found: ${req.method} ${req.originalUrl}`);
  err.statusCode = 404;
  next(err);
});

// ── Global error handler (must be last) ──────────────────────
app.use(errorHandler);

// ── Startup sequence ─────────────────────────────────────────
async function start() {
  console.log('================================================');
  console.log('  Global Trust Layer — Backend API');
  console.log('================================================');

  // Step 1: Init contract instances (safe to fail)
  initContracts();

  // Step 2: Verify database connectivity (fatal if fails)
  await testConnection();

  // Step 3: Start HTTP server
  app.listen(PORT, () => {
    console.log(`[server] ✅ Listening on http://localhost:${PORT}`);
    console.log(`[server]    Health: http://localhost:${PORT}/health`);
    console.log('================================================');
  });

  // Step 4: Start blockchain event listeners (non-blocking)
  startListeners();
}

start().catch((err) => {
  console.error('[server] Fatal startup error:', err.message);
  process.exit(1);
});
