'use client';

import { useParams } from 'next/navigation';
import { usePrivy } from '@privy-io/react-auth';
import { useApp } from '@/context/AppContext';
import { useRaiseDispute, useAgreeToSplit } from '@/hooks/useEscrow';
import { showTxToast } from '@/components/ui/TransactionToast';
import Button from '@/components/ui/Button';
import Sidebar from '@/components/layout/Sidebar';
import StatusPill from '@/components/ui/StatusPill';
import { formatAddress } from '@/lib/utils';
import { AlertTriangle, Scale, Clock, ArrowLeft } from 'lucide-react';
import { useState, useEffect } from 'react';
import Link from 'next/link';

/**
 * Dispute management page — /dispute/[id]
 *
 * Shows dispute status, allows raising (if not yet raised),
 * and proposes a payment split for agreeToSplit() resolution.
 */
export default function DisputePage() {
  const { id } = useParams();
  const { user } = usePrivy();
  const { jobs } = useApp();

  // Find disputed job (use escrowId as dispute id)
  const job = jobs.find((j) => String(j.escrowId) === id || j.id === id)
    || jobs.find((j) => j.status === 'Disputed');

  const { raiseDispute, isPending: rd, isSuccess: rdOk, error: rdErr } = useRaiseDispute();
  const { agreeToSplit, isPending: sp, isSuccess: spOk, error: spErr } = useAgreeToSplit();

  const [reason,     setReason]     = useState('');
  const [clientPct,  setClientPct]  = useState(50);
  const freelancerPct = 100 - clientPct;

  useEffect(() => { if (rdOk) showTxToast('success', null, 'Dispute raised — funds frozen.'); }, [rdOk]);
  useEffect(() => { if (spOk) showTxToast('success', null, 'Split agreed — settlement in progress!'); }, [spOk]);
  useEffect(() => {
    if (rdErr || spErr) showTxToast('error', null, (rdErr || spErr)?.message);
  }, [rdErr, spErr]);

  if (!job) {
    return (
      <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
        <p className="text-gray-500 dark:text-gray-400">Dispute not found.</p>
      </div>
    );
  }

  const budgetNum = parseFloat(job.budget) * 0.98; // after fee
  const clientShare     = ((clientPct / 100) * budgetNum).toFixed(4);
  const freelancerShare = ((freelancerPct / 100) * budgetNum).toFixed(4);

  return (
    <div className="flex h-[calc(100vh-4rem)] overflow-hidden">
      <Sidebar />

      <div className="flex-1 overflow-y-auto bg-[#F9FAFB] dark:bg-[#0F0F11]">
        <div className="max-w-3xl mx-auto px-6 py-8">

          <Link href="/dashboard" className="inline-flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 hover:text-brand-500 dark:hover:text-brand-400 transition-colors mb-6">
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Link>

          {/* Header */}
          <div className="flex items-center gap-3 mb-8">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-50 dark:bg-red-900/20">
              <AlertTriangle className="h-5 w-5 text-red-500" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">Dispute Management</h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">{job.title}</p>
            </div>
            <StatusPill status={job.status} className="ml-auto" />
          </div>

          <div className="space-y-6">
            {/* Status banner */}
            {job.status === 'Disputed' ? (
              <div className="rounded-2xl border border-red-200 dark:border-red-800/40 bg-red-50 dark:bg-red-900/10 p-5">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-red-700 dark:text-red-400">Funds are frozen in escrow</p>
                    <p className="mt-1 text-xs text-red-600/80 dark:text-red-400/70">
                      {job.budget} {job.currency} is held in the smart contract. It will be released only when both parties agree to a split, or after 30 days (50/50 default).
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="rounded-2xl border border-amber-200 dark:border-amber-800/40 bg-amber-50 dark:bg-amber-900/10 p-5">
                <p className="text-sm text-amber-700 dark:text-amber-400">
                  No active dispute for this job. You can raise one below if needed.
                </p>
              </div>
            )}

            {/* Raise dispute form */}
            {job.status !== 'Disputed' && (
              <div className="card p-6 space-y-4">
                <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Raise a Dispute</h2>
                <textarea
                  className="textarea"
                  rows={4}
                  placeholder="Describe the reason for this dispute clearly. This is recorded permanently on-chain."
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                />
                <Button
                  variant="danger"
                  loading={rd}
                  disabled={!reason.trim()}
                  onClick={() => raiseDispute(job.escrowId, 0, reason)}
                  id="confirm-dispute-btn"
                  className="w-full"
                >
                  <AlertTriangle className="h-4 w-4" />
                  Raise Dispute & Freeze Funds
                </Button>
              </div>
            )}

            {/* Split proposal */}
            {job.status === 'Disputed' && (
              <div className="card p-6 space-y-5">
                <div className="flex items-center gap-2">
                  <Scale className="h-4 w-4 text-brand-500" />
                  <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Propose a Payment Split</h2>
                </div>

                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Drag the slider to propose how to split {job.budget} {job.currency} between both parties. Both must agree for this to execute.
                </p>

                {/* Slider */}
                <div className="space-y-3">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-brand-600 dark:text-brand-400">Client: {clientPct}%</span>
                    <span className="text-green-600 dark:text-green-400">Freelancer: {freelancerPct}%</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    step={5}
                    value={clientPct}
                    onChange={(e) => setClientPct(Number(e.target.value))}
                    className="w-full accent-brand-500"
                    id="split-slider"
                  />
                  {/* Visual split bar */}
                  <div className="flex h-3 rounded-full overflow-hidden">
                    <div className="bg-brand-500 transition-all" style={{ width: `${clientPct}%` }} />
                    <div className="bg-green-500 flex-1 transition-all" />
                  </div>
                </div>

                {/* Amounts */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-xl bg-brand-50 dark:bg-brand-900/20 border border-brand-100 dark:border-brand-800/40 p-4 text-center">
                    <p className="text-xs text-brand-600/70 dark:text-brand-400/70 mb-1">Client receives</p>
                    <p className="text-lg font-bold text-brand-700 dark:text-brand-300">
                      {clientShare} {job.currency}
                    </p>
                  </div>
                  <div className="rounded-xl bg-green-50 dark:bg-green-900/20 border border-green-100 dark:border-green-800/40 p-4 text-center">
                    <p className="text-xs text-green-600/70 dark:text-green-400/70 mb-1">Freelancer receives</p>
                    <p className="text-lg font-bold text-green-700 dark:text-green-300">
                      {freelancerShare} {job.currency}
                    </p>
                  </div>
                </div>

                <Button
                  loading={sp}
                  onClick={() => agreeToSplit(job.escrowId, 0, clientPct * 100)} // basis points
                  id="agree-split-btn"
                  className="w-full"
                >
                  <Scale className="h-4 w-4" />
                  Propose {clientPct}/{freelancerPct} Split
                </Button>
              </div>
            )}

            {/* Default resolution info */}
            <div className="rounded-2xl border border-gray-200 dark:border-gray-800 p-5">
              <div className="flex items-start gap-3">
                <Clock className="h-5 w-5 text-gray-400 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">Default Resolution</p>
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                    If this dispute remains unresolved for 30 days, any party can call <code className="rounded bg-gray-100 dark:bg-gray-800 px-1 py-0.5 font-mono text-xs">defaultResolution()</code> to trigger an automatic 50/50 split of the escrowed funds.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
