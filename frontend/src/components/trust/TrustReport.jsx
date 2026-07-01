import { Skeleton } from '@/components/ui/Loader';
import StatusPill from '@/components/ui/StatusPill';
import { AlertTriangle, CheckCircle2, Sparkles, Bot } from 'lucide-react';
import { format } from 'date-fns';

/**
 * TrustReport — displays the Gemini AI-generated trust report for a wallet.
 * Shows a loading skeleton while data is being fetched.
 * Shows a "not yet generated" state when no report exists.
 *
 * @param {object}  report    - Trust report from useTrustReport hook
 * @param {boolean} isLoading - Loading state
 */
export default function TrustReport({ report, isLoading }) {
  if (isLoading) {
    return (
      <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-6 space-y-4">
        <div className="flex items-center gap-3">
          <Skeleton className="h-9 w-9 rounded-xl" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-3 w-24" />
          </div>
        </div>
        <Skeleton className="h-20 w-full rounded-xl" />
        <div className="flex gap-2">
          <Skeleton className="h-6 w-20 rounded-full" />
          <Skeleton className="h-6 w-28 rounded-full" />
        </div>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="rounded-2xl border border-dashed border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/30 p-8 text-center">
        <Bot className="mx-auto h-10 w-10 text-gray-300 dark:text-gray-600 mb-3" />
        <p className="text-sm font-semibold text-gray-500 dark:text-gray-400">AI Trust Report</p>
        <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
          Report not yet generated. Connect wallet to trigger analysis.
        </p>
      </div>
    );
  }

  const riskLabel =
    report.riskLevel === 'Low'    ? 'Low Risk'    :
    report.riskLevel === 'Medium' ? 'Medium Risk' : 'High Risk';

  const generatedAt = report.generatedAt
    ? format(new Date(report.generatedAt), 'MMM d, yyyy · HH:mm')
    : null;

  return (
    <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-6">
      {/* Header */}
      <div className="flex items-start justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 dark:bg-brand-900/30">
            <Sparkles className="h-5 w-5 text-brand-500" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">AI Trust Report</h3>
            <p className="text-xs text-gray-400 dark:text-gray-500">Powered by Gemini</p>
          </div>
        </div>
        <StatusPill status={riskLabel} />
      </div>

      {/* Score bar */}
      <div className="mb-4">
        <div className="flex justify-between mb-1.5">
          <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Risk Score</span>
          <span className="text-xs font-bold text-gray-900 dark:text-white">{report.riskScore}/100</span>
        </div>
        <div className="h-2 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
          <div
            className="h-2 rounded-full transition-all duration-1000"
            style={{
              width: `${report.riskScore}%`,
              backgroundColor:
                report.riskLevel === 'Low'    ? '#22c55e' :
                report.riskLevel === 'Medium' ? '#f59e0b' : '#ef4444',
            }}
          />
        </div>
      </div>

      {/* Summary */}
      <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed mb-4">
        {report.summary}
      </p>

      {/* Flags */}
      {report.flags && report.flags.length > 0 && (
        <div className="space-y-2 mb-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-red-500">Risk Flags</p>
          {report.flags.map((flag, i) => (
            <div key={i} className="flex items-start gap-2 rounded-lg bg-red-50 dark:bg-red-900/20 px-3 py-2">
              <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-red-500" />
              <span className="text-xs text-red-700 dark:text-red-400">{flag}</span>
            </div>
          ))}
        </div>
      )}

      {/* No flags */}
      {report.flags && report.flags.length === 0 && (
        <div className="flex items-center gap-2 rounded-lg bg-green-50 dark:bg-green-900/20 px-3 py-2 mb-4">
          <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
          <span className="text-xs text-green-700 dark:text-green-400">No risk flags detected</span>
        </div>
      )}

      {/* Generated timestamp */}
      {generatedAt && (
        <p className="text-xs text-gray-400 dark:text-gray-500 border-t border-gray-100 dark:border-gray-800 pt-3">
          Generated {generatedAt} · Valid for 24 hours
        </p>
      )}
    </div>
  );
}
