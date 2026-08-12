'use client';

import { useState, useMemo } from 'react';
import { usePrivy } from '@privy-io/react-auth';
import { useApp } from '@/context/AppContext';
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
  const { jobs } = useApp();
  const [search,   setSearch]   = useState('');
  const [category, setCategory] = useState('All Categories');
  const [currency, setCurrency] = useState('All');

  const openJobs = jobs.filter((j) => j.status === 'Funded' && !j.freelancerWallet);

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

      <div className="flex-1 overflow-y-auto bg-[#FFFAF3] dark:bg-[#0F0D0B]">
        <div className="max-w-5xl mx-auto px-6 py-8">

          {/* Header */}
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-[#1C1410] dark:text-[#F5EDE0] tracking-tight">Browse Jobs</h1>
            <p className="mt-1 text-sm text-[#9A7F65] dark:text-[#6B5A4A]">
              {openJobs.length} open jobs available — all with funds locked in escrow
            </p>
          </div>

          {/* Search + Filters */}
          <div className="flex flex-wrap gap-3 mb-6">
            {/* Search */}
            <div className="relative flex-1 min-w-[220px]">
              <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#C8A87A] dark:text-[#6B5A4A]" />
              <input
                id="job-search"
                className="input pl-10"
                placeholder="Search jobs…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              {search && (
                <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2">
                  <X className="h-4 w-4 text-[#C8A87A] hover:text-[#6B5744] transition-colors" />
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

            {/* Currency toggle */}
            <div className="flex rounded-lg border p-1" style={{ backgroundColor: 'white', borderColor: '#F0D9B5' }}>
              {CURRENCIES.map((c) => (
                <button
                  key={c}
                  onClick={() => setCurrency(c)}
                  className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-all ${
                    currency === c
                      ? 'bg-[#F62440] text-white shadow-sm'
                      : 'text-[#9A7F65] dark:text-[#6B5A4A] hover:text-[#3D2E16] dark:hover:text-[#D4C4B0]'
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          {/* Results count */}
          {search || category !== 'All Categories' || currency !== 'All' ? (
            <p className="text-xs text-[#9A7F65] dark:text-[#6B5A4A] mb-4">
              Showing <span className="font-semibold text-[#3D2E16] dark:text-[#D4C4B0]">{filtered.length}</span> of {openJobs.length} jobs
            </p>
          ) : null}

          {/* Results */}
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="h-16 w-16 rounded-2xl bg-[#FFF2DB] dark:bg-[#221E1A] flex items-center justify-center mb-4">
                <SlidersHorizontal className="h-7 w-7 text-[#C8A87A] dark:text-[#6B5A4A]" />
              </div>
              <p className="text-sm font-semibold text-[#3D2E16] dark:text-[#D4C4B0]">No jobs match your filters</p>
              <p className="mt-1.5 text-xs text-[#9A7F65] dark:text-[#6B5A4A]">Try clearing filters or check back later</p>
              <Button
                variant="secondary"
                size="sm"
                className="mt-5"
                onClick={() => { setSearch(''); setCategory('All Categories'); setCurrency('All'); }}
              >
                Clear filters
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filtered.map((job) => <JobCard key={job.id} job={job} />)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
