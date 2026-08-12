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
              className="mt-1 inline-flex items-center gap-1 text-xs text-[#F62440] hover:text-[#D91C36] font-medium"
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

