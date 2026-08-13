'use strict';

/**
 * config/contract.js
 *
 * Initialises read-only ethers.js contract instances for:
 *  - EscrowStylus (Arbitrum Stylus escrow contract)
 *  - ReputationRegistry
 *
 * The provider is a JsonRpcProvider pointed at RPC_URL.
 * No signer is needed on the backend — all writes happen
 * from the user's wallet via the frontend.
 *
 * Contract addresses come from environment variables:
 *  ESCROW_FACTORY_ADDRESS (now points to new Stylus contract)
 *  REPUTATION_REGISTRY_ADDRESS
 *
 * ABIs are loaded from the /abis directory.
 */

const { ethers } = require('ethers');
const path       = require('path');
const fs         = require('fs');

// ── Load ABIs ────────────────────────────────────────────────
const abiDir = path.join(__dirname, '..', '..', '..', 'abis');

function loadAbi(filename) {
  const filePath = path.join(abiDir, filename);
  if (!fs.existsSync(filePath)) {
    throw new Error(`ABI file not found: ${filePath}`);
  }
  const raw = fs.readFileSync(filePath, 'utf8');
  const parsed = JSON.parse(raw);
  if (!Array.isArray(parsed) || parsed.length === 0) {
    throw new Error(`ABI file is empty or invalid: ${filename}`);
  }
  return parsed;
}

// ── Provider ─────────────────────────────────────────────────
const RPC_URL = process.env.RPC_URL || 'https://sepolia-rollup.arbitrum.io/rpc';

let provider;
let escrowContract;
let reputationContract;
let isContractReady = false;

/**
 * Initialise provider and contract instances.
 * Called once at startup from index.js.
 * Gracefully degrades if addresses are not yet configured.
 */
function initContracts() {
  try {
    provider = new ethers.JsonRpcProvider(RPC_URL);

    const escrowAddress    = process.env.ESCROW_FACTORY_ADDRESS;
    const reputationAddress = process.env.REPUTATION_REGISTRY_ADDRESS;

    const ZERO = '0x0000000000000000000000000000000000000000';

    if (!escrowAddress || escrowAddress === ZERO || !reputationAddress || reputationAddress === ZERO) {
      console.warn('[contracts] Contract addresses not configured — blockchain reads disabled.');
      return;
    }

    const escrowAbi    = loadAbi('EscrowStylus.json');
    const reputationAbi = loadAbi('ReputationRegistry.json');

    escrowContract     = new ethers.Contract(escrowAddress,     escrowAbi,     provider);
    reputationContract = new ethers.Contract(reputationAddress, reputationAbi, provider);
    isContractReady    = true;

    console.log('[contracts] ✅ Contract instances initialised');
    console.log('[contracts]    EscrowStylus:       ', escrowAddress);
    console.log('[contracts]    ReputationRegistry: ', reputationAddress);
  } catch (err) {
    console.error('[contracts] Failed to initialise contracts:', err.message);
  }
}

module.exports = {
  initContracts,
  get provider()          { return provider;          },
  get escrowContract()    { return escrowContract;    },
  get reputationContract(){ return reputationContract;},
  get isContractReady()   { return isContractReady;   },
};
