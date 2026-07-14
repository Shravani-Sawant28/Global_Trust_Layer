'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { usePrivy } from '@privy-io/react-auth';
import { useRole } from '@/hooks/useRole';
import {
    useCreateEscrow,
    useFundJob,
} from "@/hooks/useEscrow";
import { useApproveUSDC } from "@/hooks/useUSDC";
import { showTxToast } from '@/components/ui/TransactionToast';
import Button from '@/components/ui/Button';
import Sidebar from '@/components/layout/Sidebar';
import StatusPill from '@/components/ui/StatusPill';
import { PageLoader } from '@/components/ui/Loader';
import {
  Plus,
  Trash2,
  Calendar,
  Wallet,
  FileText,
  Info,
  DollarSign,
  Users,
  Eye,
} from 'lucide-react';
import { format } from 'date-fns';
import { decodeEventLog } from "viem";
import { EscrowABI } from "@/abi/EscrowABI";

/**
 * Post a Job page — Page 4 (Client only)
 *
 * Two-column layout:
 *  Left:  Form (title, description, budget, deadline, freelancer, milestones)
 *  Right: Live preview panel (invoice-style summary)
 *
 * On submit → calls createEscrow() smart contract write → shows tx toast.
 */
export default function CreateJobPage() {
  const router = useRouter();
  const { ready, authenticated, user } = usePrivy();
  const { isClient, isHydrated } = useRole();

  // ── Form state ─────────────────────────────────────────────────
  const [title,       setTitle]       = useState('');
  const [description, setDescription] = useState('');
  const [budget,      setBudget]      = useState('');
  const [currency] = useState("USDC");
  const [deadline,    setDeadline]    = useState('');
  const [freelancer,  setFreelancer]  = useState('');
  const [isPublic,    setIsPublic]    = useState(true);
  const [milestoneOn, setMilestoneOn] = useState(false);
  const [milestones,  setMilestones]  = useState([
    { id: 1, title: '', amount: '' },
  ]);
  const [errors, setErrors] = useState({});
  const [createdJobId, setCreatedJobId] = useState(null);

  // ── Contract hook ───────────────────────────────────────────────
  const {
    createEscrow,
    hash,
    receipt,
    isPending,
    isConfirming,
    isSuccess,
    error,
  } = useCreateEscrow();

  const {
      approve,
      isPending: approvePending,
      isConfirming: approveConfirming,
      isSuccess: approveSuccess,
  } = useApproveUSDC();

  const {
      fundJob,
      isPending: fundPending,
      isConfirming: fundConfirming,
      isSuccess: fundSuccess,
  } = useFundJob();

  // ── Guards ──────────────────────────────────────────────────────
  useEffect(() => {
    if (ready && !authenticated) router.replace('/onboarding');
    if (ready && authenticated && isHydrated && !isClient) router.replace('/dashboard');
  }, [ready, authenticated, isClient, isHydrated, router]);

  // ── Toast on tx result ──────────────────────────────────────────
  useEffect(() => {
    if (isSuccess && hash) {
      showTxToast('success', hash, 'Job created successfully!');
    }
    if (error) {
      showTxToast('error', null, error.message);
    }
  }, [isSuccess, hash, error]);

  useEffect(() => {
    if (!receipt) return;

    try {
      const log = receipt.logs.find((log) => {
        try {
          const decoded = decodeEventLog({
            abi: EscrowABI,
            data: log.data,
            topics: log.topics,
          });

          return decoded.eventName === "JobCreated";
        } catch {
          return false;
        }
      });

      if (!log) return;

      const decoded = decodeEventLog({
        abi: EscrowABI,
        data: log.data,
        topics: log.topics,
      });

      const jobId = decoded.args.job_id;

      setCreatedJobId(jobId);

      // approve(
      //   BigInt(
      //     Math.round(Number(budget) * 1_000_000)
      //   )
      // );

      console.log("Created Job ID:", jobId.toString());
    } catch (err) {
      console.error(err);
    }
  }, [receipt]);

  useEffect(() => {
      if (!createdJobId) return;

      fundJob(BigInt(createdJobId));
  }, [createdJobId]);

  useEffect(() => {
      if (!fundSuccess) return;

      showTxToast(
          "success",
          null,
          "Escrow funded successfully!"
      );

      router.push(`/jobs/${createdJobId}`);
  }, [fundSuccess]);

  // ── Milestone helpers ───────────────────────────────────────────
  const addMilestone = () =>
    setMilestones((p) => [...p, { id: Date.now(), title: '', amount: '' }]);

  const removeMilestone = (id) =>
    setMilestones((p) => p.filter((m) => m.id !== id));

  const updateMilestone = (id, field, value) =>
    setMilestones((p) => p.map((m) => m.id === id ? { ...m, [field]: value } : m));

  const milestoneTotal = milestones.reduce((s, m) => s + parseFloat(m.amount || 0), 0);
  const budgetNum      = parseFloat(budget || 0);
  const milestonesDiff = milestoneOn ? Math.abs(milestoneTotal - budgetNum).toFixed(4) : '0';
  const milestonesOk   = !milestoneOn || Math.abs(milestoneTotal - budgetNum) < 0.00001;

  // ── Validation ──────────────────────────────────────────────────
  const validate = () => {
    const e = {};
    if (!title.trim())      e.title       = 'Job title is required';
    if (!description.trim()) e.description = 'Description is required';
    if (!budget || budgetNum <= 0) e.budget = 'Enter a valid budget';
    if (!deadline)          e.deadline    = 'Deadline is required';
    if (!isPublic && !freelancer.match(/^0x[0-9a-fA-F]{40}$/))
      e.freelancer = 'Enter a valid wallet address';
    if (milestoneOn && !milestonesOk)
      e.milestones = `Milestone total (${milestoneTotal}) must equal budget (${budget})`;
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  // ── Submit ──────────────────────────────────────────────────────
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;

    const freelancerAddr = isPublic
      ? '0x0000000000000000000000000000000000000000'
      : freelancer;

    const milestoneDescriptions = milestoneOn
      ? milestones.map((m) => m.title)
      : ["Complete Job"];

    const milestoneAmounts = milestoneOn
      ? milestones.map((m) => Math.round(Number(m.amount) * 1_000_000))
      : [Math.round(Number(budget) * 1_000_000)];

    const durationSeconds = Math.max(
      0,
      Math.floor(
        (new Date(deadline).getTime() - Date.now()) / 1000
      )
    );

    createEscrow({
      freelancer: freelancerAddr,
      title,
      milestoneDescriptions,
      milestoneAmounts,
      durationSeconds,
    });
  };

  if (!ready || !isHydrated) return <PageLoader />;

  const formattedDeadline = deadline ? format(new Date(deadline), 'MMM d, yyyy') : '—';

  return (
    <div className="flex h-[calc(100vh-4rem)] overflow-hidden">
      <Sidebar />

      <div className="flex-1 overflow-y-auto bg-[#F9FAFB] dark:bg-[#0F0F11]">
        <div className="max-w-6xl mx-auto px-6 py-8">

          {/* Header */}
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">Post a Job</h1>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Create an escrow job. Funds will be locked after approving USDC and funding the escrow.
            </p>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

              {/* ── LEFT COLUMN: Form ── */}
              <div className="lg:col-span-3 space-y-6">

                {/* Basic info card */}
                <div className="card p-6 space-y-5">
                  <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                    <FileText className="h-4 w-4 text-brand-500" />
                    Job Details
                  </h2>

                  {/* Title */}
                  <div>
                    <label className="label">Job Title *</label>
                    <input
                      id="job-title"
                      className="input"
                      placeholder="e.g. Build a Solidity Escrow Contract"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                    />
                    {errors.title && <p className="mt-1.5 text-xs text-red-500">{errors.title}</p>}
                  </div>

                  {/* Description */}
                  <div>
                    <label className="label">Description *</label>
                    <textarea
                      id="job-description"
                      className="textarea min-h-[120px]"
                      placeholder="Describe the scope, deliverables, and acceptance criteria clearly…"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                    />
                    {errors.description && <p className="mt-1.5 text-xs text-red-500">{errors.description}</p>}
                  </div>
                </div>

                {/* Budget card */}
                <div className="card p-6 space-y-5">
                  <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-brand-500" />
                    Budget & Payment
                  </h2>

                  {/* Currency + amount */}
                  <div>
                    <label className="label">Budget *</label>
                    <div className="flex gap-3">
                      <div className="px-4 py-2 rounded-lg border">
                          USDC
                      </div>
                      <div className="flex-1">
                        <input
                          id="job-budget"
                          type="number"
                          step="any"
                          min="0"
                          className="input"
                          placeholder="500"
                          value={budget}
                          onChange={(e) => setBudget(e.target.value)}
                        />
                      </div>
                    </div>
                    {errors.budget && <p className="mt-1.5 text-xs text-red-500">{errors.budget}</p>}
                    <p className="mt-2 text-xs text-gray-400 dark:text-gray-500 flex items-center gap-1">
                      <Info className="h-3.5 w-3.5" />
                      Includes 2% GTL protocol fee deducted on release
                    </p>
                  </div>

                  {/* Deadline */}
                  <div>
                    <label className="label">Deadline *</label>
                    <div className="relative">
                      <input
                        id="job-deadline"
                        type="date"
                        className="input pr-10"
                        min={new Date().toISOString().split('T')[0]}
                        value={deadline}
                        onChange={(e) => setDeadline(e.target.value)}
                      />
                      <Calendar className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    </div>
                    {errors.deadline && <p className="mt-1.5 text-xs text-red-500">{errors.deadline}</p>}
                  </div>
                </div>

                {/* Freelancer card */}
                <div className="card p-6 space-y-4">
                  <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                    <Users className="h-4 w-4 text-brand-500" />
                    Hiring
                  </h2>

                  {/* Public / Direct toggle */}
                  <div className="flex gap-3">
                    {['Post Publicly', 'Hire Directly'].map((opt) => {
                      const pub = opt === 'Post Publicly';
                      return (
                        <button
                          key={opt}
                          type="button"
                          onClick={() => setIsPublic(pub)}
                          className={`flex-1 rounded-xl border py-2.5 text-sm font-medium transition-all ${
                            isPublic === pub
                              ? 'border-brand-400 dark:border-brand-600 bg-brand-50 dark:bg-brand-900/20 text-brand-600 dark:text-brand-400'
                              : 'border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:border-gray-300'
                          }`}
                        >
                          {opt}
                        </button>
                      );
                    })}
                  </div>

                  {/* Freelancer address (direct hire) */}
                  {!isPublic && (
                    <div>
                      <label className="label">Freelancer Wallet Address *</label>
                      <div className="relative">
                        <input
                          id="freelancer-address"
                          className="input pl-10"
                          placeholder="0x..."
                          value={freelancer}
                          onChange={(e) => setFreelancer(e.target.value)}
                        />
                        <Wallet className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      </div>
                      {errors.freelancer && <p className="mt-1.5 text-xs text-red-500">{errors.freelancer}</p>}
                    </div>
                  )}
                </div>

                {/* Milestones card */}
                <div className="card p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                      Split into Milestones?
                    </h2>
                    {/* Toggle switch */}
                    <button
                      type="button"
                      onClick={() => setMilestoneOn((v) => !v)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        milestoneOn ? 'bg-brand-500' : 'bg-gray-200 dark:bg-gray-700'
                      }`}
                      role="switch"
                      aria-checked={milestoneOn}
                      id="milestone-toggle"
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                          milestoneOn ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>

                  {milestoneOn && (
                    <div className="space-y-3">
                      {milestones.map((m, i) => (
                        <div key={m.id} className="flex items-center gap-3">
                          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-50 dark:bg-brand-900/30 text-xs font-bold text-brand-600 dark:text-brand-400">
                            {i + 1}
                          </span>
                          <input
                            className="input flex-1"
                            placeholder="Milestone name"
                            value={m.title}
                            onChange={(e) => updateMilestone(m.id, 'title', e.target.value)}
                          />
                          <div className="flex items-center gap-1.5">
                            <input
                              type="number"
                              step="any"
                              min="0"
                              className="input w-28 text-right"
                              placeholder="Amount"
                              value={m.amount}
                              onChange={(e) => updateMilestone(m.id, 'amount', e.target.value)}
                            />
                            <span className="text-xs font-medium text-gray-400">{currency}</span>
                          </div>
                          {milestones.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeMilestone(m.id)}
                              className="rounded-lg p-1.5 text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      ))}

                      <button
                        type="button"
                        onClick={addMilestone}
                        className="flex items-center gap-2 text-sm font-medium text-brand-500 hover:text-brand-600 dark:text-brand-400 dark:hover:text-brand-300 transition-colors"
                      >
                        <Plus className="h-4 w-4" />
                        Add milestone
                      </button>

                      {/* Sum validation */}
                      <div className={`flex items-center justify-between rounded-xl p-3 text-xs font-medium ${
                        milestonesOk
                          ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400'
                          : 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400'
                      }`}>
                        <span>Milestone total</span>
                        <span>
                          {milestoneTotal.toFixed(4)} / {budget || 0} {currency}
                          {!milestonesOk && ` (diff: ${milestonesDiff})`}
                        </span>
                      </div>
                      {errors.milestones && <p className="text-xs text-red-500">{errors.milestones}</p>}
                    </div>
                  )}
                </div>

                {/* Submit */}
                <Button
                  type="submit"
                  size="lg"
                  loading={
                      isPending ||
                      isConfirming ||
                      approvePending ||
                      approveConfirming ||
                      fundPending ||
                      fundConfirming
                  }
                  className="w-full"
                  id="submit-job"
                >
                  {
                    isPending
                    ? "Confirm Create Job..."

                    : isConfirming
                    ? "Creating Job..."

                    : approvePending
                    ? "Approve USDC..."

                    : approveConfirming
                    ? "Waiting for Approval..."

                    : fundPending
                    ? "Fund Escrow..."

                    : fundConfirming
                    ? "Funding Escrow..."

                    : "Create Job"
                  }
                </Button>
                <p className="text-center text-xs text-gray-400 dark:text-gray-500">
                  This will open a MetaMask popup to confirm the transaction.
                </p>
              </div>

              {/* ── RIGHT COLUMN: Preview panel ── */}
              <div className="lg:col-span-2 sticky top-6 self-start">
                <div className="card p-6 space-y-5">
                  <div className="flex items-center gap-2 border-b border-gray-100 dark:border-gray-800 pb-4">
                    <Eye className="h-4 w-4 text-brand-500" />
                    <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Job Preview</h2>
                  </div>

                  {/* Status */}
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-400 dark:text-gray-500">Status</span>
                    <StatusPill status="Created" />
                  </div>

                  {/* Title */}
                  <div>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mb-1">Job Title</p>
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">
                      {title || <span className="text-gray-300 dark:text-gray-600 font-normal italic">Enter a title…</span>}
                    </p>
                  </div>

                  {/* Description */}
                  {description && (
                    <div>
                      <p className="text-xs text-gray-400 dark:text-gray-500 mb-1">Description</p>
                      <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed line-clamp-4">
                        {description}
                      </p>
                    </div>
                  )}

                  {/* Divider */}
                  <div className="border-t border-gray-100 dark:border-gray-800" />

                  {/* Budget / Deadline */}
                  <div className="space-y-3">
                    <PreviewRow label="Budget" value={budget ? `${budget} ${currency}` : '—'} />
                    <PreviewRow label="Deadline" value={formattedDeadline} />
                    <PreviewRow label="Hiring" value={isPublic ? 'Public listing' : (freelancer ? formatAddr(freelancer) : '—')} />
                    <PreviewRow label="Milestones" value={milestoneOn ? `${milestones.length} milestone${milestones.length > 1 ? 's' : ''}` : 'Single payment'} />
                  </div>

                  {/* Milestone breakdown */}
                  {milestoneOn && milestones.some((m) => m.title || m.amount) && (
                    <>
                      <div className="border-t border-gray-100 dark:border-gray-800" />
                      <div className="space-y-2">
                        {milestones.map((m, i) => (
                          <div key={m.id} className="flex justify-between items-center">
                            <span className="text-xs text-gray-500 dark:text-gray-400 truncate flex-1">
                              {i + 1}. {m.title || `Milestone ${i + 1}`}
                            </span>
                            <span className="text-xs font-semibold text-gray-800 dark:text-gray-200 ml-3 shrink-0">
                              {m.amount || 0} {currency}
                            </span>
                          </div>
                        ))}
                      </div>
                    </>
                  )}

                  {/* Subtotal / Total */}
                  <div className="border-t border-gray-200 dark:border-gray-700 pt-4 space-y-2">
                    <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
                      <span>Subtotal</span>
                      <span>{budget || 0} {currency}</span>
                    </div>
                    <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
                      <span>GTL fee (2%)</span>
                      <span>−{((parseFloat(budget) || 0) * 0.02).toFixed(4)} {currency}</span>
                    </div>
                    <div className="flex justify-between text-sm font-bold text-gray-900 dark:text-white pt-1 border-t border-gray-100 dark:border-gray-800">
                      <span>Freelancer receives</span>
                      <span>{((parseFloat(budget) || 0) * 0.98).toFixed(4)} {currency}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

function PreviewRow({ label, value }) {
  return (
    <div className="flex justify-between items-start">
      <span className="text-xs text-gray-400 dark:text-gray-500">{label}</span>
      <span className="text-xs font-semibold text-gray-800 dark:text-gray-200 text-right max-w-[60%] break-all">{value}</span>
    </div>
  );
}

function formatAddr(addr) {
  if (!addr || addr.length < 10) return addr;
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}
