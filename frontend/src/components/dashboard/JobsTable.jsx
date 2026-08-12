'use client';

import { useState } from 'react';
import Link from 'next/link';
import { formatAddress } from '@/lib/utils';
import StatusPill from '@/components/ui/StatusPill';
import TrustBadge from '@/components/trust/TrustBadge';
import { format } from 'date-fns';
import { ExternalLink } from 'lucide-react';

const TABS = ['My Jobs', 'Payments', 'Disputes'];

/**
 * JobsTable — tabbed transaction feed.
 * Shows My Jobs / Payments / Disputes tabs.
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
    <div className="rounded-xl border bg-white dark:bg-[#1A1714] overflow-hidden shadow-card"
      style={{ borderColor: '#F0D9B5' }}>

      {/* Tab header */}
      <div className="flex border-b px-6" style={{ borderColor: '#F0D9B5' }}>
        {TABS.map((tab) => {
          const count =
            tab === 'My Jobs'  ? jobs.length :
            tab === 'Payments' ? jobs.filter((j) => j.status === 'Complete' || j.status === 'Refunded').length :
            jobs.filter((j) => j.status === 'Disputed').length;

          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`relative flex items-center gap-2 px-4 py-3.5 text-sm font-medium transition-colors ${
                activeTab === tab
                  ? 'text-[#F62440] dark:text-[#FF4D63]'
                  : 'text-[#9A7F65] dark:text-[#6B5A4A] hover:text-[#3D2E16] dark:hover:text-[#D4C4B0]'
              }`}
            >
              {tab}
              {count > 0 && (
                <span className={`rounded-md px-1.5 py-0.5 text-xs font-semibold ${
                  activeTab === tab
                    ? 'bg-[#FFE5BF] dark:bg-[#2D2822] text-[#F62440] dark:text-[#FF4D63]'
                    : 'bg-[#FFF2DB] dark:bg-[#221E1A] text-[#9A7F65] dark:text-[#6B5A4A]'
                }`}>
                  {count}
                </span>
              )}
              {activeTab === tab && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#F62440] rounded-t-full" />
              )}
            </button>
          );
        })}
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="h-12 w-12 rounded-xl bg-[#FFF2DB] dark:bg-[#221E1A] flex items-center justify-center mb-4">
            <svg className="h-5 w-5 text-[#C8A87A]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
            </svg>
          </div>
          <p className="text-sm font-medium text-[#6B5744] dark:text-[#9A8470]">No records found</p>
          <p className="mt-1 text-xs text-[#C8A87A] dark:text-[#6B5A4A]">
            {activeTab === 'My Jobs' ? 'Post or browse jobs to get started.' : `No ${activeTab.toLowerCase()} yet.`}
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b" style={{ backgroundColor: '#FFFAF3', borderColor: '#F0D9B5' }}>
                {['Job', 'Budget', 'Deadline', 'Counterparty', 'Status', ''].map((h) => (
                  <th key={h} className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[#C8A87A] dark:text-[#6B5A4A]">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((job, idx) => {
                const counterparty =
                  role === 'CLIENT' ? job.freelancerWallet : job.clientWallet;
                const deadline = job.deadline
                  ? format(new Date(job.deadline), 'MMM d, yyyy')
                  : '—';

                return (
                  <tr key={job.id}
                    className="border-b last:border-0 hover:bg-[#FFFAF3] dark:hover:bg-[#1A1714] transition-colors group"
                    style={{ borderColor: '#FAF0E4' }}>

                    {/* Job title */}
                    <td className="px-5 py-4 max-w-xs">
                      <Link
                        href={`/jobs/${job.id}`}
                        className="text-sm font-semibold text-[#1C1410] dark:text-[#F5EDE0] hover:text-[#F62440] dark:hover:text-[#FF4D63] line-clamp-1 transition-colors"
                      >
                        {job.title}
                      </Link>
                      <p className="text-xs text-[#C8A87A] dark:text-[#6B5A4A] mt-0.5">{job.category}</p>
                    </td>

                    {/* Budget */}
                    <td className="px-5 py-4 whitespace-nowrap">
                      <span className="text-sm font-semibold text-[#1C1410] dark:text-[#F5EDE0]">
                        {job.budget} {job.currency}
                      </span>
                    </td>

                    {/* Deadline */}
                    <td className="px-5 py-4 whitespace-nowrap">
                      <span className="text-sm text-[#9A7F65] dark:text-[#6B5A4A]">{deadline}</span>
                    </td>

                    {/* Counterparty */}
                    <td className="px-5 py-4 whitespace-nowrap">
                      {counterparty ? (
                        <div className="flex items-center gap-2">
                          <div className="h-6 w-6 rounded-full bg-[#FFE5BF] dark:bg-[#2D2822] flex items-center justify-center text-xs font-bold text-[#6B5744] dark:text-[#9A8470] flex-shrink-0">
                            {counterparty.slice(2, 4).toUpperCase()}
                          </div>
                          <span className="text-xs text-[#9A7F65] dark:text-[#6B5A4A]">
                            {formatAddress(counterparty)}
                          </span>
                          <TrustBadge score={job.clientTrustScore} />
                        </div>
                      ) : (
                        <span className="text-xs italic text-[#C8A87A] dark:text-[#6B5A4A]">Open listing</span>
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
                        className="invisible group-hover:visible inline-flex items-center gap-1 text-xs text-[#F62440] dark:text-[#FF4D63] hover:text-[#D91C36] font-medium transition-colors"
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
