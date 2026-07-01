import { useState, useEffect } from 'react';
import { getTrustReport } from '@/lib/api';
import { MOCK_TRUST_REPORTS } from '@/lib/mockData';

/**
 * useTrustReport — fetches the Gemini AI trust report for a wallet.
 *
 * First attempts to fetch from the real backend (/api/trust/:wallet).
 * Falls back to MOCK_TRUST_REPORTS if the backend is unavailable.
 *
 * TODO: Remove mock fallback once the backend AI route is live.
 */
export function useTrustReport(wallet) {
  const [data, setData]       = useState(null);
  const [isLoading, setLoading] = useState(false);
  const [error, setError]     = useState(null);

  useEffect(() => {
    if (!wallet) return;

    let cancelled = false;
    setLoading(true);
    setError(null);

    getTrustReport(wallet)
      .then((report) => {
        if (!cancelled) setData(report);
      })
      .catch(() => {
        // ── Backend unavailable — fall back to mock ──────────────
        if (!cancelled) {
          const mock = MOCK_TRUST_REPORTS[wallet] || {
            wallet,
            riskScore:  50,
            riskLevel:  'Medium',
            summary:    'No trust history found for this wallet. This wallet has not yet completed any jobs on GTL.',
            flags:      ['No on-chain job history'],
            generatedAt: new Date().toISOString(),
          };
          setData(mock);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, [wallet]);

  return { data, isLoading, error };
}
