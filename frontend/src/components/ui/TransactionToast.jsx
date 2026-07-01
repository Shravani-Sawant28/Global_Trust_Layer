'use client';

import toast from 'react-hot-toast';
import { CheckCircle2, ExternalLink, XCircle } from 'lucide-react';
import { getExplorerTxUrl } from '@/lib/utils';

/**
 * showTxToast — displays a transaction result as a rich toast notification.
 *
 * @param {'success'|'error'} type
 * @param {string} txHash - On-chain transaction hash (optional for errors)
 * @param {string} message - Custom message
 */
export function showTxToast(type, txHash, message) {
  if (type === 'success') {
    toast.custom((t) => (
      <div
        className={`flex items-start gap-3 rounded-xl border border-green-200 bg-white dark:bg-gray-900 dark:border-green-800 p-4 shadow-card-md max-w-sm transition-all ${
          t.visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
        }`}
      >
        <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-green-500" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-gray-900 dark:text-white">
            {message || 'Transaction Confirmed'}
          </p>
          {txHash && (
            <a
              href={getExplorerTxUrl(txHash)}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-1 inline-flex items-center gap-1 text-xs text-brand-500 hover:text-brand-600 font-medium"
            >
              View on Arbiscan
              <ExternalLink className="h-3 w-3" />
            </a>
          )}
        </div>
      </div>
    ), { duration: 6000 });
  } else {
    toast.custom((t) => (
      <div
        className={`flex items-start gap-3 rounded-xl border border-red-200 bg-white dark:bg-gray-900 dark:border-red-800 p-4 shadow-card-md max-w-sm transition-all ${
          t.visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
        }`}
      >
        <XCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-500" />
        <div>
          <p className="text-sm font-semibold text-gray-900 dark:text-white">Transaction Failed</p>
          <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">{message || 'Something went wrong. Please try again.'}</p>
        </div>
      </div>
    ), { duration: 5000 });
  }
}

/** 
 * CurrencyToggle — ETH ↔ USDC selector used on Post a Job form.
 */
export function CurrencyToggle({ value, onChange }) {
  return (
    <div className="inline-flex rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 p-1">
      {['ETH', 'USDC'].map((c) => (
        <button
          key={c}
          type="button"
          onClick={() => onChange(c)}
          className={`rounded-md px-4 py-1.5 text-sm font-semibold transition-all ${
            value === c
              ? 'bg-white dark:bg-gray-900 text-brand-600 dark:text-brand-400 shadow-card'
              : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
          }`}
        >
          {c}
        </button>
      ))}
    </div>
  );
}
