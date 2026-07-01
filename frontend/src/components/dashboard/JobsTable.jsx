'use client';

import { useState } from 'react';
import Link from 'next/link';
import { formatAddress } from '@/lib/utils';
import StatusPill from '@/components/ui/StatusPill';
import TrustBadge from '@/components/trust/TrustBadge';
import { format } from 'date-fns';
import { MoreVertical, ExternalLink } from 'lucide-react';

const TABS = ['My Jobs', 'Payments', 'Disputes'];

/**
 * JobsTable — tabbed transaction feed matching the Open Money-style
 * screenshot reference. Shows My Jobs / Payments / Disputes tabs.
 *
 * @param {object[]} jobs         - Full job list for the wallet
 * @param {string}   walletAddress - Current user's wallet
 * @param {'CLIENT'|'FREELANCER'} role
 */
export default function JobsTable({ jobs = [], walletAddress, role }) {
  const [activeTab, setActiveTab] = useState('My Jobs');

  // ── Filter jobs per tab ───────────────────────────────────────
  const filtered = jobs.filter((j) => {
    if (activeTab === 'My Jobs') return true;
    if (activeTab === 'Payments') return j.status === 'Complete' || j.status === 'Refunded';
    if (activeTab === 'Disputes') return j.status === 'Disputed';
    return true;
  });

  return (
    <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 overflow-hidden">
      {/* Tab header */}
      <div className="flex border-b border-gray-100 dark:border-gray-800 px-6">
        {TABS.map((tab) => {
          const count =
            tab === 'My Jobs'  ? jobs.length :
            tab === 'Payments' ? jobs.filter((j) => j.status === 'Complete' || j.status === 'Refunded').length :
            jobs.filter((j) => j.status === 'Disputed').length;

          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`relative flex items-center gap-2 px-4 py-4 text-sm font-medium transition-colors ${
                activeTab === tab
                  ? 'text-brand-600 dark:text-brand-400'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
              }`}
            >
              {tab}
              {count > 0 && (
                <span className={`rounded-full px-1.5 py-0.5 text-xs font-semibold ${
                  activeTab === tab
                    ? 'bg-brand-100 dark:bg-brand-900/40 text-brand-600 dark:text-brand-400'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400'
                }`}>
                  {count}
                </span>
              )}
              {activeTab === tab && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-500 rounded-t-full" />
              )}
            </button>
          );
        })}
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <p className="text-sm font-medium text-gray-400 dark:text-gray-500">No records found</p>
          <p className="mt-1 text-xs text-gray-300 dark:text-gray-600">
            {activeTab === 'My Jobs' ? 'Post or browse jobs to get started.' : `No ${activeTab.toLowerCase()} yet.`}
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/30">
                {['Job', 'Budget', 'Deadline', 'Counterparty', 'Status', ''].map((h) => (
                  <th key={h} className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-gray-800/50">
              {filtered.map((job) => {
                const counterparty =
                  role === 'CLIENT' ? job.freelancerWallet : job.clientWallet;
                const deadline = job.deadline
                  ? format(new Date(job.deadline), 'MMM d, yyyy')
                  : '—';

                return (
                  <tr key={job.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors group">
                    {/* Job title */}
                    <td className="px-5 py-4 max-w-xs">
                      <Link
                        href={`/jobs/${job.id}`}
                        className="text-sm font-medium text-gray-900 dark:text-white hover:text-brand-600 dark:hover:text-brand-400 line-clamp-1 transition-colors"
                      >
                        {job.title}
                      </Link>
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{job.category}</p>
                    </td>

                    {/* Budget */}
                    <td className="px-5 py-4 whitespace-nowrap">
                      <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                        {job.budget} {job.currency}
                      </span>
                    </td>

                    {/* Deadline */}
                    <td className="px-5 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-500 dark:text-gray-400">{deadline}</span>
                    </td>

                    {/* Counterparty */}
                    <td className="px-5 py-4 whitespace-nowrap">
                      {counterparty ? (
                        <div className="flex items-center gap-2">
                          <div className="h-6 w-6 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-xs font-bold text-gray-600 dark:text-gray-300">
                            {counterparty.slice(2, 4).toUpperCase()}
                          </div>
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {formatAddress(counterparty)}
                          </span>
                          <TrustBadge score={job.clientTrustScore} />
                        </div>
                      ) : (
                        <span className="text-xs text-gray-300 dark:text-gray-600 italic">Open listing</span>
                      )}
                    </td>

                    {/* Status */}
                    <td className="px-5 py-4 whitespace-nowrap">
                      <StatusPill status={job.status} />
                    </td>

                    {/* Actions */}
                    <td className="px-5 py-4">
                      <Link
                        href={`/jobs/${job.id}`}
                        className="invisible group-hover:visible inline-flex items-center gap-1 text-xs text-brand-500 hover:text-brand-600 dark:text-brand-400 font-medium"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
