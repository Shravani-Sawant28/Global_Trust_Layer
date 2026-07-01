import Link from 'next/link';
import { formatAddress } from '@/lib/utils';
import StatusPill from '@/components/ui/StatusPill';
import TrustBadge from '@/components/trust/TrustBadge';
import { Calendar, Coins, ArrowRight } from 'lucide-react';
import { format } from 'date-fns';

/**
 * JobCard — displays a single job in the browse list or dashboard feed.
 *
 * @param {object} job - Job object from mockData / API
 * @param {boolean} showActions - Whether to show the "View Details" link
 */
export default function JobCard({ job, showActions = true }) {
  const deadline = job.deadline ? format(new Date(job.deadline), 'MMM d, yyyy') : '—';

  return (
    <div className="group rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5 hover:border-brand-300 dark:hover:border-brand-700 hover:shadow-card-md transition-all duration-200">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white line-clamp-2 group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">
            {job.title}
          </h3>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{job.category}</p>
        </div>
        <StatusPill status={job.status} />
      </div>

      {/* Description */}
      <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 mb-4 leading-relaxed">
        {job.description}
      </p>

      {/* Meta row */}
      <div className="flex items-center gap-4 mb-4">
        <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
          <Coins className="h-3.5 w-3.5 text-brand-500" />
          <span className="font-semibold text-gray-800 dark:text-gray-200">
            {job.budget} {job.currency}
          </span>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
          <Calendar className="h-3.5 w-3.5" />
          {deadline}
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between border-t border-gray-100 dark:border-gray-800 pt-3">
        <div className="flex items-center gap-2">
          <div className="h-6 w-6 rounded-full bg-brand-100 dark:bg-brand-900/30 flex items-center justify-center text-xs font-bold text-brand-600 dark:text-brand-400">
            {job.clientWallet?.slice(2, 4).toUpperCase()}
          </div>
          <span className="text-xs text-gray-500 dark:text-gray-400">{formatAddress(job.clientWallet)}</span>
          <TrustBadge score={job.clientTrustScore} />
        </div>

        {showActions && (
          <Link
            href={`/jobs/${job.id}`}
            className="inline-flex items-center gap-1 text-xs font-semibold text-brand-500 hover:text-brand-600 dark:text-brand-400 dark:hover:text-brand-300 transition-colors"
          >
            View <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        )}
      </div>
    </div>
  );
}
