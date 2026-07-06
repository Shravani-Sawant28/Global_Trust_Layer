'use strict';

/**
 * services/gemini.js
 *
 * Google Gemini AI integration for generating Trust Reports.
 *
 * Uses the @google/generative-ai SDK with the gemini-1.5-flash model.
 * The prompt is built from the on-chain TrustPassport data returned
 * by ReputationRegistry.getPassport() — no assumptions are made
 * about the data shape beyond what the contract defines.
 *
 * Risk scoring logic:
 *  - Base score: trustScore from chain (0–1000, mapped to 0–100)
 *  - Penalty: -10 per ghosting, -5 per dispute lost, -3 per late delivery
 *  - Cap: 0–100
 */

const { GoogleGenerativeAI } = require('@google/generative-ai');

let genAI;

/**
 * Initialise the Gemini client.
 * Called lazily on first use so startup doesn't fail without an API key.
 */
function getClient() {
  if (!genAI) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      const err = new Error('GEMINI_API_KEY is not set. Cannot generate AI trust reports.');
      err.statusCode = 503;
      throw err;
    }
    genAI = new GoogleGenerativeAI(key);
  }
  return genAI;
}

/**
 * Map a raw trustScore (0–1000 from contract, starting at 500) to 0–100.
 *
 * The contract starts every wallet at 500 and caps at no defined max
 * (though practically bounded). We map 0–1000 → 0–100.
 */
function normaliseScore(rawScore) {
  const score = Math.min(Math.max(Number(rawScore), 0), 1000);
  return Math.round(score / 10);
}

/**
 * Determine risk level from a 0–100 score.
 *
 * @param {number} score
 * @returns {'Low'|'Medium'|'High'}
 */
function getRiskLevel(score) {
  if (score >= 75) return 'Low';
  if (score >= 50) return 'Medium';
  return 'High';
}

/**
 * Build a structured prompt for Gemini from the on-chain TrustPassport.
 *
 * @param {string} wallet
 * @param {object} passport  - TrustPassport struct fields from ReputationRegistry
 * @returns {string}
 */
function buildPrompt(wallet, passport) {
  const {
    trustScore       = 500,
    totalJobs        = 0,
    completedJobs    = 0,
    disputesInvolved = 0,
    disputesLost     = 0,
    lateDeliveries   = 0,
    ghostingCount    = 0,
    totalVolume      = '0',
    memberSince      = 0,
  } = passport;

  const completionRate = totalJobs > 0
    ? ((completedJobs / totalJobs) * 100).toFixed(1)
    : '0.0';

  const disputeRate = totalJobs > 0
    ? ((disputesInvolved / totalJobs) * 100).toFixed(1)
    : '0.0';

  const volumeUsdc = (BigInt(String(totalVolume)) / 1_000_000n).toString();

  const memberSinceDate = memberSince > 0
    ? new Date(Number(memberSince) * 1000).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    : 'Unknown';

  return `
You are a blockchain trust analyst for Global Trust Layer (GTL), a decentralised escrow and reputation protocol on Arbitrum.

Analyse the following on-chain reputation data for wallet ${wallet} and produce a structured trust report.

=== ON-CHAIN TRUST PASSPORT DATA ===
Trust Score (raw, 0-1000):  ${trustScore}
Member Since:               ${memberSinceDate}
Total Jobs:                 ${totalJobs}
Completed Jobs:             ${completedJobs}
Completion Rate:            ${completionRate}%
Disputes Involved:          ${disputesInvolved}
Disputes Lost:              ${disputesLost}
Late Deliveries:            ${lateDeliveries}
Ghosting Count:             ${ghostingCount}
Total Volume (USDC):        ${volumeUsdc}
Dispute Rate:               ${disputeRate}%

=== CONTEXT ===
- GTL network average dispute rate: ~8%
- "Ghosting" = freelancer never delivered, client was refunded, -100 trust score penalty each
- "Dispute Lost" = dispute resolved 100% against this party, -50 trust score penalty each
- A trust score of 500 is the starting value for new wallets
- Scores above 700 indicate consistently good behaviour; below 300 is high risk

=== YOUR TASK ===
Respond ONLY with a valid JSON object in this exact format (no markdown, no explanation):
{
  "summary": "<2-3 sentence plain English summary of this wallet's trust profile>",
  "flags": ["<flag1>", "<flag2>"]
}

Rules:
- The summary must reference actual numbers from the data above
- flags is an array of strings; each flag is a short (< 80 chars) risk warning
- If there are no red flags, return flags as an empty array []
- Do NOT invent data not present in the passport above
- Be objective and professional
`.trim();
}

/**
 * Generate a trust report for a wallet using its on-chain TrustPassport.
 *
 * If Gemini is unavailable, returns a fallback report so the frontend
 * always gets a valid response.
 *
 * @param {string} wallet   - Ethereum address
 * @param {object} passport - TrustPassport from ReputationRegistry.getPassport()
 * @returns {Promise<{riskScore: number, riskLevel: string, summary: string, flags: string[]}>}
 */
async function generateTrustReport(wallet, passport) {
  const riskScore = normaliseScore(passport.trustScore || 500);
  const riskLevel = getRiskLevel(riskScore);

  try {
    const client = getClient();
    const model  = client.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const prompt = buildPrompt(wallet, passport);

    const result   = await model.generateContent(prompt);
    const text     = result.response.text().trim();

    // Parse the JSON response from Gemini
    let parsed;
    try {
      parsed = JSON.parse(text);
    } catch {
      // Gemini sometimes wraps in markdown — strip it
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsed = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('Gemini response was not valid JSON');
      }
    }

    return {
      riskScore,
      riskLevel,
      summary: parsed.summary || 'Trust report generated.',
      flags:   Array.isArray(parsed.flags) ? parsed.flags : [],
    };
  } catch (err) {
    console.warn('[gemini] AI generation failed, using fallback:', err.message);

    // Deterministic fallback — still useful for the frontend
    const { totalJobs = 0, completedJobs = 0, disputesInvolved = 0, ghostingCount = 0 } = passport;
    const flags = [];
    if (ghostingCount > 0) flags.push(`${ghostingCount} ghosting incident(s) on record`);
    if (disputesInvolved > 0) flags.push(`Involved in ${disputesInvolved} dispute(s)`);
    if (totalJobs === 0)      flags.push('No completed jobs on GTL yet');

    const summary = totalJobs === 0
      ? `This wallet (${wallet.slice(0, 8)}…) has no job history on Global Trust Layer. Starting trust score applies.`
      : `This wallet has completed ${completedJobs} of ${totalJobs} jobs on GTL with a trust score of ${riskScore}/100. ${disputesInvolved > 0 ? `Involved in ${disputesInvolved} dispute(s).` : 'No disputes on record.'}`;

    return { riskScore, riskLevel, summary, flags };
  }
}

module.exports = { generateTrustReport };
