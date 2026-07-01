import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Merges Tailwind classes safely (handles conflicts).
 * Usage: cn('px-2 py-1', condition && 'bg-brand-500')
 */
export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

/**
 * Shortens a wallet address to 0x1234...5678 format.
 */
export function formatAddress(address) {
  if (!address) return '';
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

/**
 * Formats a wei/bigint amount to a readable ETH string.
 */
export function formatEth(wei) {
  if (!wei) return '0';
  const eth = Number(wei) / 1e18;
  return eth.toFixed(4).replace(/\.?0+$/, '');
}

/**
 * Formats a USDC amount (6 decimals) to a readable string.
 */
export function formatUsdc(amount) {
  if (!amount) return '0';
  return (Number(amount) / 1e6).toFixed(2);
}

/**
 * Returns the Arbiscan URL for a transaction hash.
 */
export function getExplorerTxUrl(txHash) {
  const base = process.env.NEXT_PUBLIC_EXPLORER_URL || 'https://sepolia.arbiscan.io';
  return `${base}/tx/${txHash}`;
}

/**
 * Returns the Arbiscan URL for a wallet address.
 */
export function getExplorerAddressUrl(address) {
  const base = process.env.NEXT_PUBLIC_EXPLORER_URL || 'https://sepolia.arbiscan.io';
  return `${base}/address/${address}`;
}

/**
 * Converts a Date or timestamp to a Unix timestamp (seconds).
 */
export function toUnixTimestamp(date) {
  return Math.floor(new Date(date).getTime() / 1000);
}

/**
 * Returns a trust score colour class based on the score value.
 */
export function trustScoreColor(score) {
  if (score >= 80) return 'text-green-500';
  if (score >= 60) return 'text-brand-500';
  if (score >= 40) return 'text-amber-500';
  return 'text-red-500';
}

/**
 * Returns risk level label + colour from a numeric score.
 */
export function riskLevel(score) {
  if (score >= 75) return { label: 'Low Risk',    color: 'green' };
  if (score >= 50) return { label: 'Medium Risk', color: 'amber' };
  return              { label: 'High Risk',   color: 'red' };
}
