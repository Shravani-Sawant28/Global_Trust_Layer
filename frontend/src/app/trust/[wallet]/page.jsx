'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useProfile } from '@/hooks/useReputation';
import { useTrustReport } from '@/hooks/useTrustReport';
import TrustScore from '@/components/trust/TrustScore';
import TrustReport from '@/components/trust/TrustReport';
import StatusPill from '@/components/ui/StatusPill';
import { Skeleton } from '@/components/ui/Loader';
import { formatAddress, getExplorerAddressUrl, trustScoreColor } from '@/lib/utils';
import { format } from 'date-fns';
import { MOCK_JOBS } from '@/lib/mockData';
import {
  ArrowLeft, ExternalLink, Briefcase, Shield,
  AlertTriangle, Coins, Calendar, Globe,
} from 'lucide-react';

/**
 * Trust Passport page — public, accessible by anyone.
 * Shows the on-chain reputation profile for any wallet address.
 *
 * URL: /trust/[wallet]
 */
export default function TrustPassportPage() {
  const { wallet } = useParams();

  const { data: profile, isLoading: profileLoading } = useProfile(wallet);
  const { data: report,  isLoading: reportLoading  } = useTrustReport(wallet);

  // Find jobs associated with this wallet (from mock data)
  const walletJobs = MOCK_JOBS.filter(
    (j) => j.clientWallet === wallet || j.freelancerWallet === wallet
  );

  const memberSince = profile?.memberSince
    ? typeof profile.memberSince === 'bigint'
      ? format(new Date(Number(profile.memberSince) * 1000), 'MMM yyyy')
      : format(new Date(profile.memberSince), 'MMM yyyy')
    : '—';

  const totalEarned = typeof profile?.totalEarned === 'bigint'
    ? (Number(profile.totalEarned) / 1e18).toFixed(2)
    : profile?.totalEarned || '0';

  return (
    <div className="min-h-screen bg-[#F9FAFB] dark:bg-[#0F0F11]">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-8">

        {/* Back */}
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 hover:text-brand-500 dark:hover:text-brand-400 transition-colors mb-6"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Link>

        {/* ── Profile header ── */}
        <div className="card p-8 mb-6">
          <div className="flex items-start gap-6">
            {/* Avatar */}
            <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-brand-100 dark:bg-brand-900/40 text-2xl font-black text-brand-600 dark:text-brand-400">
              {wallet?.slice(2, 4).toUpperCase()}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-3 mb-2">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">
                  {formatAddress(wallet)}
                </h1>
                {profile?.role && (
                  <span className="rounded-full bg-brand-50 dark:bg-brand-900/30 border border-brand-100 dark:border-brand-800/40 px-3 py-0.5 text-xs font-semibold text-brand-600 dark:text-brand-400">
                    {profile.role}
                  </span>
                )}
              </div>
              <a
                href={getExplorerAddressUrl(wallet)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs text-gray-400 dark:text-gray-500 hover:text-brand-500 dark:hover:text-brand-400 transition-colors mb-4"
              >
                <Globe className="h-3.5 w-3.5" />
                {wallet}
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
              <div className="flex flex-wrap gap-4">
                <MetaPill icon={<Calendar className="h-3.5 w-3.5" />} label={`Member since ${memberSince}`} />
                <MetaPill icon={<Briefcase className="h-3.5 w-3.5" />} label={`${profile?.jobsCompleted || 0} jobs completed`} />
                <MetaPill icon={<AlertTriangle className="h-3.5 w-3.5" />} label={`${profile?.disputeCount || 0} disputes`} />
                {profile?.role === 'FREELANCER' && (
                  <MetaPill icon={<Coins className="h-3.5 w-3.5" />} label={`${totalEarned} ETH earned`} />
                )}
              </div>
            </div>

            {/* Trust Score ring */}
            <div className="shrink-0">
              {profileLoading ? (
                <Skeleton className="h-24 w-24 rounded-full" />
              ) : (
                <TrustScore score={profile?.trustScore || 0} size="lg" />
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* ── Left: Stats + Job History ── */}
          <div className="lg:col-span-2 space-y-6">

            {/* Stats cards */}
            <div className="grid grid-cols-3 gap-4">
              {[
                { label: 'Trust Score', value: profileLoading ? '—' : profile?.trustScore ?? 0, color: trustScoreColor(profile?.trustScore ?? 0) },
                { label: 'Jobs Done',   value: profileLoading ? '—' : profile?.jobsCompleted ?? 0, color: 'text-gray-900 dark:text-white' },
                { label: 'Disputes',    value: profileLoading ? '—' : profile?.disputeCount ?? 0,  color: (profile?.disputeCount || 0) > 0 ? 'text-red-500' : 'text-green-500' },
              ].map((s) => (
                <div key={s.label} className="card p-4 text-center">
                  {profileLoading ? (
                    <Skeleton className="h-7 w-12 mx-auto mb-2" />
                  ) : (
                    <p className={`text-3xl font-bold tabular-nums ${s.color}`}>{s.value}</p>
                  )}
                  <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">{s.label}</p>
                </div>
              ))}
            </div>

            {/* Job history */}
            <div className="card overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800">
                <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Job History</h2>
              </div>

              {walletJobs.length === 0 ? (
                <div className="py-12 text-center">
                  <Shield className="mx-auto h-8 w-8 text-gray-200 dark:text-gray-700 mb-3" />
                  <p className="text-sm text-gray-400 dark:text-gray-500">No job history yet</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-50 dark:divide-gray-800/50">
                  {walletJobs.map((job) => (
                    <Link key={job.id} href={`/jobs/${job.id}`} className="flex items-center gap-4 px-6 py-4 hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors group">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-white group-hover:text-brand-600 dark:group-hover:text-brand-400 line-clamp-1 transition-colors">
                          {job.title}
                        </p>
                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{job.category}</p>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                          {job.budget} {job.currency}
                        </span>
                        <StatusPill status={job.status} />
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* ── Right: AI Trust Report ── */}
          <div className="lg:col-span-1">
            <TrustReport report={report} isLoading={reportLoading} />
          </div>
        </div>
      </div>
    </div>
  );
}

function MetaPill({ icon, label }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
      <span className="text-brand-400">{icon}</span>
      {label}
    </span>
  );
}
