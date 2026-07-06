'use strict';

/**
 * routes/user.js
 *
 * Routes:
 *  GET  /api/user/:wallet → getUser   (get or create user record)
 *  POST /api/user         → saveUser  (persist role after onboarding)
 *
 * Called by frontend api.js:
 *  getUser(wallet)        → api.get(`/api/user/${wallet}`)
 *  saveUserRole(w, role)  → api.post('/api/user', { wallet, role })
 */

const express = require('express');
const router  = express.Router();

const { getUser, saveUser }     = require('../controllers/userController');
const { validateWalletParam }   = require('../middleware/validateWallet');

// GET /api/user/:wallet
router.get('/:wallet', validateWalletParam('wallet'), getUser);

// POST /api/user
router.post('/', saveUser);

module.exports = router;
