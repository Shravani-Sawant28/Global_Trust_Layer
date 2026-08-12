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
      <div className="rounded-xl border bg-white dark:bg-[#1A1714] p-6 space-y-4" style={{ borderColor: '#F0D9B5' }}>
        <div className="flex items-center gap-3">
          <Skeleton className="h-10 w-10 rounded-lg" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-3 w-24" />
          </div>
        </div>
        <Skeleton className="h-20 w-full rounded-lg" />
        <div className="flex gap-2">
          <Skeleton className="h-6 w-20 rounded-md" />
          <Skeleton className="h-6 w-28 rounded-md" />
        </div>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="rounded-xl border-2 border-dashed bg-[#FFF2DB] dark:bg-[#221E1A] p-8 text-center"
        style={{ borderColor: '#F0D9B5' }}>
        <div className="h-12 w-12 rounded-xl bg-[#FFE5BF] dark:bg-[#2D2822] flex items-center justify-center mx-auto mb-3">
          <Bot className="h-6 w-6 text-[#C8A87A] dark:text-[#6B5A4A]" />
        </div>
        <p className="text-sm font-semibold text-[#3D2E16] dark:text-[#D4C4B0]">AI Trust Report</p>
        <p className="mt-1.5 text-xs text-[#9A7F65] dark:text-[#6B5A4A] leading-relaxed">
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
    <div className="rounded-xl border bg-white dark:bg-[#1A1714] p-6" style={{ borderColor: '#F0D9B5' }}>
      {/* Header */}
      <div className="flex items-start justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#FFF2DB] dark:bg-[#2D2822]">
            <Sparkles className="h-5 w-5 text-[#C8A87A] dark:text-[#9A8470]" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-[#1C1410] dark:text-[#F5EDE0]">AI Trust Report</h3>
            <p className="text-xs text-[#C8A87A] dark:text-[#6B5A4A]">Powered by Gemini</p>
          </div>
        </div>
        <StatusPill status={riskLabel} />
      </div>

      {/* Score bar */}
      <div className="mb-4">
        <div className="flex justify-between mb-1.5">
          <span className="text-xs font-medium text-[#9A7F65] dark:text-[#6B5A4A]">Risk Score</span>
          <span className="text-xs font-bold text-[#1C1410] dark:text-[#F5EDE0]">{report.riskScore}/100</span>
        </div>
        <div className="h-1.5 rounded-full bg-[#FFE5BF] dark:bg-[#2D2822] overflow-hidden">
          <div
            className="h-1.5 rounded-full transition-all duration-1000"
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
      <p className="text-sm text-[#3D2E16] dark:text-[#D4C4B0] leading-relaxed mb-4">
        {report.summary}
      </p>

      {/* Flags */}
      {report.flags && report.flags.length > 0 && (
        <div className="space-y-2 mb-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-red-600 dark:text-red-400">Risk Flags</p>
          {report.flags.map((flag, i) => (
            <div key={i} className="flex items-start gap-2 rounded-lg bg-red-50 dark:bg-red-900/20 px-3 py-2.5">
              <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-red-500" />
              <span className="text-xs text-red-700 dark:text-red-400 leading-relaxed">{flag}</span>
            </div>
          ))}
        </div>
      )}

      {/* No flags */}
      {report.flags && report.flags.length === 0 && (
        <div className="flex items-center gap-2 rounded-lg bg-green-50 dark:bg-green-900/20 px-3 py-2.5 mb-4">
          <CheckCircle2 className="h-3.5 w-3.5 text-green-500 flex-shrink-0" />
          <span className="text-xs text-green-700 dark:text-green-400">No risk flags detected</span>
        </div>
      )}

      {/* Generated timestamp */}
      {generatedAt && (
        <p className="text-xs text-[#C8A87A] dark:text-[#6B5A4A] border-t pt-3"
          style={{ borderColor: '#F0D9B5' }}>
          Generated {generatedAt} · Valid for 24 hours
        </p>
      )}
    </div>
  );
}
