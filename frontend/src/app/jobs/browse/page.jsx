'use client';

import { useState, useMemo } from 'react';
import { usePrivy } from '@privy-io/react-auth';
import { useApp } from '@/context/AppContext';
import { MOCK_JOBS } from '@/lib/mockData';
import JobCard from '@/components/jobs/JobCard';
import Sidebar from '@/components/layout/Sidebar';
import Button from '@/components/ui/Button';
import { Search, SlidersHorizontal, X } from 'lucide-react';

const CATEGORIES = [
  'All Categories',
  'Blockchain / Solidity',
  'Frontend / React',
  'Backend / Node.js',
  'Security / Audit',
  'Writing / Content',
  'Design / UI-UX',
];

const CURRENCIES = ['All', 'ETH', 'USDC'];

/**
 * Browse Jobs page — Freelancer view.
 * Displays open jobs with category and currency filters.
 */
export default function BrowseJobsPage() {
  const { authenticated } = usePrivy();
  const [search,   setSearch]   = useState('');
  const [category, setCategory] = useState('All Categories');
  const [currency, setCurrency] = useState('All');

  const openJobs = MOCK_JOBS.filter((j) => j.status === 'Funded' && !j.freelancerWallet);

  const filtered = useMemo(() => {
    return openJobs.filter((j) => {
      const matchSearch   = !search || j.title.toLowerCase().includes(search.toLowerCase()) || j.description.toLowerCase().includes(search.toLowerCase());
      const matchCategory = category === 'All Categories' || j.category === category;
      const matchCurrency = currency === 'All' || j.currency === currency;
      return matchSearch && matchCategory && matchCurrency;
    });
  }, [search, category, currency, openJobs]);

  return (
    <div className="flex h-[calc(100vh-4rem)] overflow-hidden">
      <Sidebar />

      <div className="flex-1 overflow-y-auto bg-[#F9FAFB] dark:bg-[#0F0F11]">
        <div className="max-w-5xl mx-auto px-6 py-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">Browse Jobs</h1>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {openJobs.length} open jobs available — all with funds locked in escrow
            </p>
          </div>

          {/* Search + Filters */}
          <div className="flex flex-wrap gap-3 mb-6">
            {/* Search */}
            <div className="relative flex-1 min-w-[220px]">
              <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                id="job-search"
                className="input pl-10"
                placeholder="Search jobs…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              {search && (
                <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2">
                  <X className="h-4 w-4 text-gray-400 hover:text-gray-600" />
                </button>
              )}
            </div>

            {/* Category */}
            <div className="relative">
              <select
                id="category-filter"
                className="select pr-8 min-w-[180px]"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
              </select>
            </div>

            {/* Currency */}
            <div className="flex rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-1">
              {CURRENCIES.map((c) => (
                <button
                  key={c}
                  onClick={() => setCurrency(c)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                    currency === c
                      ? 'bg-brand-500 text-white shadow-sm'
                      : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          {/* Results */}
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <SlidersHorizontal className="h-10 w-10 text-gray-200 dark:text-gray-700 mb-4" />
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">No jobs match your filters</p>
              <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">Try clearing filters or check back later</p>
              <Button
                variant="secondary"
                size="sm"
                className="mt-4"
                onClick={() => { setSearch(''); setCategory('All Categories'); setCurrency('All'); }}
              >
                Clear filters
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {filtered.map((job) => <JobCard key={job.id} job={job} />)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
