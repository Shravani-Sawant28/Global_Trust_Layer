'use client';

import { useParams } from 'next/navigation';
import { usePrivy } from '@privy-io/react-auth';
import { useRole } from '@/hooks/useRole';
import {
  useDeliverMilestone,
  useReleaseMilestone,
  useRaiseDispute,
  useMilestone,
  useAcceptJob,
} from '@/hooks/useEscrow';
import { useApp } from '@/context/AppContext';
import { showTxToast } from '@/components/ui/TransactionToast';
import api from '@/lib/api';
import StatusPill from '@/components/ui/StatusPill';
import TrustBadge from '@/components/trust/TrustBadge';
import Button from '@/components/ui/Button';
import Sidebar from '@/components/layout/Sidebar';
import { formatAddress, getExplorerAddressUrl } from '@/lib/utils';
import { format, differenceInDays } from 'date-fns';
import Link from 'next/link';
import {
  ArrowLeft, Calendar, Coins, ExternalLink,
  AlertTriangle, CheckCircle2, Clock, Zap,
} from 'lucide-react';
import { useState, useEffect } from 'react';

/**
 * Job Detail page — shows escrow actions based on role and job status.
 *
 * Client actions: Release Payment, Raise Dispute
 * Freelancer actions: Submit Work, Raise Dispute
 * Anyone: Auto-Release (if 7 days past deadline and status = Funded/InProgress)
 */
export default function JobDetailPage() {
  const { id } = useParams();
  const jobId = Number(id);
  const { user } = usePrivy();
  const { isClient, isFreelancer } = useRole();

  const walletAddress =
    user?.wallet?.address ||
    user?.linkedAccounts?.find((a) => a.type === 'wallet')?.address;

  const { jobs } = useApp();

  const {
    deliverMilestone,
    isPending: sw,
    isSuccess: swOk,
    error: swErr,
  } = useDeliverMilestone();

  const {
    releaseMilestone,
    isPending: rp,
    isSuccess: rpOk,
    error: rpErr,
  } = useReleaseMilestone();
  const { raiseDispute,   isPending: rd, isSuccess: rdOk, error: rdErr } = useRaiseDispute();
  const { acceptJob, isPending: aj, isSuccess: ajOk, error: ajErr } = useAcceptJob();

  const [disputeReason, setDisputeReason] = useState('');
  const [showDisputeForm, setShowDisputeForm] = useState(false);



  const job = jobs.find((j) => String(j.id) === String(id) || String(j.onChainJobId) === String(id) || String(j.escrowId) === String(id));
  const activeJobId = job?.onChainJobId ?? job?.on_chain_job_id ?? job?.escrowId ?? job?.id ?? (id ? Number(id) : undefined);

  const { data: milestone } = useMilestone(activeJobId, 0);

  useEffect(() => {
    console.log("Job Detail Context:", job);
    console.log("Milestone OnChain:", milestone);
  }, [job, milestone]);

  // Toast reactions
  useEffect(() => { if (swOk)  showTxToast('success', null, 'Work submitted on-chain!'); }, [swOk]);
  useEffect(() => { if (rpOk)  showTxToast('success', null, 'Payment released — funds sent to freelancer!'); }, [rpOk]);
  useEffect(() => { if (rdOk)  showTxToast('success', null, 'Dispute raised — funds frozen in escrow.'); }, [rdOk]);
  useEffect(() => {
    if (ajOk) {
      showTxToast('success', null, 'Job accepted successfully!');
      if (job && walletAddress) {
        api.post(`/api/jobs/${job.id}/accept`, { wallet: walletAddress })
           .catch(err => console.warn('Failed to inform backend of accepted job', err));
      }
    }
  }, [ajOk]);
  useEffect(() => {
    if (swErr || rpErr || rdErr || ajErr)
      showTxToast(
        'error',
        null,
        (swErr || rpErr || rdErr || ajErr)?.message
      );
  }, [swErr, rpErr, rdErr, ajErr]);

  if (!job) {
    return (
      <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
        <p className="text-gray-500 dark:text-gray-400">Job not found.</p>
      </div>
    );
  }

  const deadline    = job.deadline ? format(new Date(job.deadline), 'MMM d, yyyy') : '—';
  const daysLeft    = job.deadline ? differenceInDays(new Date(job.deadline), new Date()) : 0;
  const isPastDeadline = daysLeft < 0;
  const canAutoRelease = isPastDeadline && ['Funded', 'In Progress', 'Submitted'].includes(job.status) && daysLeft < -7;

  const iAmClient     = walletAddress === job.clientWallet || isClient;
  const iAmFreelancer = walletAddress === job.freelancerWallet || isFreelancer;

  return (
    <div className="flex h-[calc(100vh-4rem)] overflow-hidden">
      <Sidebar />

      <div className="flex-1 overflow-y-auto bg-[#F9FAFB] dark:bg-[#0F0F11]">
        <div className="max-w-4xl mx-auto px-6 py-8">

          {/* Back */}
          <Link href="/dashboard" className="inline-flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 hover:text-brand-500 dark:hover:text-brand-400 transition-colors mb-6">
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Link>

          {/* Header */}
          <div className="flex items-start justify-between mb-8">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight line-clamp-2">
                  {job.title}
                </h1>
                <StatusPill status={job.status} />
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400">{job.category}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            {/* ── Main ── */}
            <div className="lg:col-span-2 space-y-6">

              {/* Description */}
              <div className="card p-6">
                <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Description</h2>
                <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">
                  {job.description}
                </p>
              </div>

              {/* Milestones */}
              {job.milestones && job.milestones.length > 0 && (
                <div className="card p-6">
                  <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">Milestones</h2>
                  <div className="space-y-3">
                    {job.milestones.map((m, i) => (
                      <div key={m.id} className="flex items-center gap-4 rounded-xl bg-gray-50 dark:bg-gray-800/50 px-4 py-3">
                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-50 dark:bg-brand-900/30 text-xs font-bold text-brand-600 dark:text-brand-400">
                          {i + 1}
                        </span>
                        <p className="flex-1 text-sm font-medium text-gray-800 dark:text-gray-200">{m.title}</p>
                        <span className="text-sm font-semibold text-gray-900 dark:text-white">{m.amount} {job.currency}</span>
                        <StatusPill status={
                          m.status === 'APPROVED' ? 'Complete' :
                          m.status === 'SUBMITTED' ? 'Submitted' :
                          m.status === 'PAID' ? 'Complete' : 'Funded'
                        } />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="card p-6">
                <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">Escrow Actions</h2>

                <div className="space-y-3">
                  {/* Freelancer: Accept Public Job */}
                  {isFreelancer && !job.freelancerWallet && job.status === 'Funded' && (
                    <Button
                      onClick={() => acceptJob(activeJobId)}
                      loading={aj}
                      className="w-full"
                      id="accept-job-btn"
                    >
                      <CheckCircle2 className="h-4 w-4" />
                      Accept Job
                    </Button>
                  )}

                  {/* Freelancer: Submit Work */}
                  {iAmFreelancer && job.status === 'Funded' && job.freelancerWallet && (
                    <Button
                      onClick={() =>
                      deliverMilestone(
                        activeJobId,
                        0,
                        "0x0000000000000000000000000000000000000000000000000000000000000000"
                      )
                    }
                      loading={sw}
                      className="w-full"
                      id="submit-work-btn"
                    >
                      <CheckCircle2 className="h-4 w-4" />
                      Submit Work
                    </Button>
                  )}

                  {/* Client: Release Payment */}
                  {iAmClient && ['In Progress', 'Submitted'].includes(job.status) && (
                    <Button
                      onClick={() => releaseMilestone(activeJobId, 0)}
                      loading={rp}
                      className="w-full"
                      id="release-payment-btn"
                    >
                      <Coins className="h-4 w-4" />
                      Release Payment
                    </Button>
                  )}

                  {/* Raise Dispute */}
                  {['Funded', 'In Progress', 'Submitted'].includes(job.status) && (
                    <>
                      {!showDisputeForm ? (
                        <Button
                          variant="danger"
                          onClick={() => setShowDisputeForm(true)}
                          className="w-full"
                          id="raise-dispute-btn"
                        >
                          <AlertTriangle className="h-4 w-4" />
                          Raise Dispute
                        </Button>
                      ) : (
                        <div className="space-y-3 rounded-xl border border-red-200 dark:border-red-800/40 bg-red-50 dark:bg-red-900/10 p-4">
                          <p className="text-xs font-semibold text-red-700 dark:text-red-400">
                            Raising a dispute will freeze funds in escrow until resolved.
                          </p>
                          <textarea
                            className="textarea"
                            placeholder="Describe the reason for this dispute…"
                            rows={3}
                            value={disputeReason}
                            onChange={(e) => setDisputeReason(e.target.value)}
                          />
                          <div className="flex gap-2">
                            <Button
                              variant="danger"
                              size="sm"
                              loading={rd}
                              onClick={() => raiseDispute(
                                              activeJobId,
                                              0,
                                              disputeReason
                                            )}
                              disabled={!disputeReason.trim()}
                            >
                              Confirm Dispute
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => setShowDisputeForm(false)}>
                              Cancel
                            </Button>
                          </div>
                        </div>
                      )}
                    </>
                  )}

                  {/* Auto-release */}
                  {canAutoRelease && (
                    <div className="rounded-xl border border-amber-200 dark:border-amber-800/40 bg-amber-50 dark:bg-amber-900/10 p-4">
                      <div className="flex items-start gap-2 mb-3">
                        <Zap className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
                        <p className="text-xs text-amber-700 dark:text-amber-400">
                          Deadline passed over 7 days ago with no client response. Auto-release is now available.
                        </p>
                      </div>
                      <Button
                        variant="secondary"
                        size="sm"
                        loading={rp}
                        onClick={() => releaseMilestone(job.onChainJobId || job.escrowId, 0)}
                        id="auto-release-btn"
                      >
                        Trigger Auto-Release
                      </Button>
                    </div>
                  )}

                  {/* Complete state */}
                  {['Complete', 'Refunded'].includes(job.status) && (
                    <div className="flex items-center gap-2 rounded-xl bg-green-50 dark:bg-green-900/20 border border-green-100 dark:border-green-800/40 p-4">
                      <CheckCircle2 className="h-5 w-5 text-green-500" />
                      <p className="text-sm font-medium text-green-700 dark:text-green-400">
                        This job has been {job.status === 'Complete' ? 'completed and payment released' : 'refunded'}.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* ── Sidebar meta ── */}
            <div className="space-y-5">
              {/* Budget */}
              <div className="card p-5">
                <p className="text-xs text-gray-400 dark:text-gray-500 mb-1">Budget in Escrow</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{job.budget} {job.currency}</p>
                <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
                  Freelancer receives {((parseFloat(job.budget) || 0) * 0.98).toFixed(4)} {job.currency} after 2% fee
                </p>
              </div>

              {/* Deadline */}
              <div className="card p-5">
                <div className="flex items-center gap-2 mb-2">
                  <Calendar className="h-4 w-4 text-gray-400" />
                  <p className="text-xs text-gray-400 dark:text-gray-500">Deadline</p>
                </div>
                <p className="text-sm font-semibold text-gray-900 dark:text-white">{deadline}</p>
                {daysLeft > 0 && (
                  <p className="mt-1 text-xs text-green-500">{daysLeft} days remaining</p>
                )}
                {isPastDeadline && (
                  <p className="mt-1 text-xs text-red-500">{Math.abs(daysLeft)} days overdue</p>
                )}
              </div>

              {/* Parties */}
              <div className="card p-5 space-y-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">Parties</p>
                <PartyRow label="Client" wallet={job.clientWallet} score={job.clientTrustScore} />
                {job.freelancerWallet ? (
                  <PartyRow label="Freelancer" wallet={job.freelancerWallet} score={72} />
                ) : (
                  <div>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mb-0.5">Freelancer</p>
                    <p className="text-xs italic text-gray-300 dark:text-gray-600">Open — awaiting acceptance</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function PartyRow({ label, wallet, score }) {
  return (
    <div>
      <p className="text-xs text-gray-400 dark:text-gray-500 mb-1">{label}</p>
      <div className="flex items-center gap-2">
        <div className="h-7 w-7 rounded-full bg-brand-100 dark:bg-brand-900/30 flex items-center justify-center text-xs font-bold text-brand-600 dark:text-brand-400">
          {wallet?.slice(2, 4).toUpperCase()}
        </div>
        <a
          href={getExplorerAddressUrl(wallet)}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs font-medium text-gray-700 dark:text-gray-300 hover:text-brand-500 dark:hover:text-brand-400 flex items-center gap-1 transition-colors"
        >
          {formatAddress(wallet)}
          <ExternalLink className="h-3 w-3" />
        </a>
        <TrustBadge score={score} />
      </div>
    </div>
  );
}
