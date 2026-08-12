'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { usePrivy } from '@privy-io/react-auth';
import { useRole } from '@/hooks/useRole';
import { useApp } from '@/context/AppContext';
import {
  useClientScore,
  useFreelancerScore,
} from '@/hooks/useReputation';
import { PageLoader } from '@/components/ui/Loader';
import Sidebar from '@/components/layout/Sidebar';
import StatsCard from '@/components/dashboard/StatsCard';
import JobsTable from '@/components/dashboard/JobsTable';
import TrustScore from '@/components/trust/TrustScore';
import Button from '@/components/ui/Button';
import Link from 'next/link';
import { formatAddress } from '@/lib/utils';
import {
  Briefcase, Coins, Shield, AlertTriangle,
  Plus, Search, Clock, CheckCircle2,
} from 'lucide-react';

/**
 * Dashboard page — Page 3
 *
 * Role-aware: shows different stats and quick actions for
 * CLIENT vs FREELANCER. Guard redirects unauthenticated users.
 */
export default function DashboardPage() {
  const router  = useRouter();
  const { ready, authenticated, user } = usePrivy();
  const { role, isClient, isFreelancer, isHydrated } = useRole();
  const { jobs, profile } = useApp();

  const walletAddress =
    user?.wallet?.address ||
    user?.linkedAccounts?.find((a) => a.type === 'wallet')?.address;

  // ── Auth guard ──────────────────────────────────────────────────
  useEffect(() => {
    if (ready && !authenticated) router.replace('/onboarding');
  }, [ready, authenticated, router]);

  // ── Role guard ──────────────────────────────────────────────────
  useEffect(() => {
    if (ready && authenticated && isHydrated && !role) {
      router.replace('/onboarding');
    }
  }, [ready, authenticated, isHydrated, role, router]);

  // Reputation (from mock or on-chain)
  const { data: clientScore } = useClientScore(walletAddress);
  const { data: freelancerScore } = useFreelancerScore(walletAddress);

  const trustScore = Number(
    isClient
      ? (clientScore ?? profile?.trustScore ?? 0)
      : (freelancerScore ?? profile?.trustScore ?? 0)
  );

  if (!ready || !isHydrated) return <PageLoader />;
  if (!authenticated || !role) return null;

  // ── Filter jobs by role ─────────────────────────────────────────
  const myJobs = jobs.filter((j) =>
    isClient
      ? j.clientWallet === walletAddress || true // show all mocks for demo
      : j.freelancerWallet === walletAddress || j.status !== 'Funded' // show assigned mocks
  );

  // ── Stats ───────────────────────────────────────────────────────
  const lockedAmount = myJobs
    .filter((j) => ['Funded', 'In Progress', 'Submitted'].includes(j.status))
    .reduce((s, j) => s + parseFloat(j.budget || 0), 0)
    .toFixed(2);

  const completedCount = myJobs.filter((j) => j.status === 'Complete').length;
  const disputeCount   = myJobs.filter((j) => j.status === 'Disputed').length;
  const activeCount    = myJobs.filter((j) => ['Funded', 'In Progress', 'Submitted'].includes(j.status)).length;

  return (
    <div className="flex h-[calc(100vh-4rem)] overflow-hidden">
      {/* ── Sidebar ── */}
      <Sidebar />

      {/* ── Main content ── */}
      <div className="flex-1 overflow-y-auto bg-[#FFFAF3] dark:bg-[#0F0D0B]">
        <div className="max-w-6xl mx-auto px-6 py-8">

          {/* ── Page header ── */}
          <div className="flex items-start justify-between mb-8">
            <div>
              <h1 className="text-2xl font-bold text-[#1C1410] dark:text-[#F5EDE0] tracking-tight">
                {isClient ? 'Client Dashboard' : 'Freelancer Dashboard'}
              </h1>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                {walletAddress ? formatAddress(walletAddress) : 'Loading wallet…'} ·{' '}
                <span className="font-medium text-[#F62440] dark:text-[#FF4D63]">
                  {isClient ? 'Client' : 'Freelancer'}
                </span>
              </p>
            </div>

            {/* Primary CTA */}
            {isClient ? (
              <Link href="/jobs/create">
                <Button size="md">
                  <Plus className="h-4 w-4" />
                  Post a New Job
                </Button>
              </Link>
            ) : (
              <Link href="/jobs/browse">
                <Button size="md">
                  <Search className="h-4 w-4" />
                  Browse Open Jobs
                </Button>
              </Link>
            )}
          </div>

          {/* ── Trust score + stats grid ── */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-5 mb-8">

            {/* Trust score card */}
            <div className="lg:col-span-1 rounded-xl border bg-white dark:bg-[#1A1714] p-6 flex flex-col items-center justify-center shadow-card" style={{ borderColor: '#F0D9B5' }}>
              <TrustScore score={trustScore} size="md" />
              <Link
                href={walletAddress ? `/trust/${walletAddress}` : '#'}
                className="mt-4 text-xs font-medium text-[#F62440] hover:text-[#D91C36] dark:text-[#FF4D63] flex items-center gap-1 transition-colors"
              >
                <Shield className="h-3.5 w-3.5" />
                View Trust Passport
              </Link>
            </div>

            {/* Stats */}
            <div className="lg:col-span-3 grid grid-cols-3 gap-5">
              <StatsCard
                title={isClient ? 'Locked in Escrow' : 'Active Jobs'}
                value={isClient ? `${lockedAmount} USDC` : activeCount}
                sub={isClient ? `across ${activeCount} active jobs` : 'currently working on'}
                icon={<Coins className="h-5 w-5 text-[#C8A87A]" />}
                accent="bg-[#FFF2DB] dark:bg-[#2D2822]"
              />
              <StatsCard
                title="Completed"
                value={completedCount}
                sub={isClient ? 'jobs successfully delivered' : 'jobs completed'}
                icon={<CheckCircle2 className="h-5 w-5 text-green-600" />}
                accent="bg-green-50 dark:bg-green-900/20"
              />
              <StatsCard
                title="Disputes"
                value={disputeCount}
                sub={disputeCount === 0 ? 'Clean record 🎉' : 'need attention'}
                icon={<AlertTriangle className="h-5 w-5 text-red-500" />}
                accent="bg-red-50 dark:bg-red-900/20"
              />
            </div>
          </div>

          {/* ── Quick actions (freelancer only) ── */}
          {isFreelancer && (
            <div className="mb-8 rounded-xl border p-5" style={{ backgroundColor: '#FFF2DB', borderColor: '#F0D9B5' }}>
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold text-[#3D2E16] dark:text-[#D4C4B0]">Ready for new work?</p>
                  <p className="mt-0.5 text-xs text-[#9A7F65] dark:text-[#6B5A4A]">
                    Browse open jobs posted by verified clients.
                  </p>
                </div>
                <Link href="/jobs/browse" className="flex-shrink-0">
                  <Button size="sm" variant="secondary">
                    Browse Jobs →
                  </Button>
                </Link>
              </div>
            </div>
          )}

          {/* ── Jobs table ── */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-[#1C1410] dark:text-[#F5EDE0]">
                {isClient ? 'My Posted Jobs' : 'My Work'}
              </h2>
              {isClient && (
                <Link href="/jobs/create" className="text-xs font-medium text-[#F62440] hover:text-[#D91C36] dark:text-[#FF4D63] flex items-center gap-1 transition-colors">
                  <Plus className="h-3.5 w-3.5" />
                  New Job
                </Link>
              )}
            </div>
            <JobsTable
              jobs={myJobs}
              walletAddress={walletAddress}
              role={role}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
