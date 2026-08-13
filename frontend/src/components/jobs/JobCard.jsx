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
    <div className="group rounded-xl border bg-white dark:bg-[#1A1714] p-5 hover:shadow-card-md transition-all duration-200 hover:border-[#F62440]/25 dark:hover:border-[#F62440]/20"
      style={{ borderColor: '#F0D9B5' }}>

      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-[#1C1410] dark:text-[#F5EDE0] line-clamp-2 leading-snug group-hover:text-[#F62440] dark:group-hover:text-[#FF4D63] transition-colors">
            {job.title}
          </h3>
          <p className="mt-1 text-xs text-[#C8A87A] dark:text-[#6B5A4A] font-medium">{job.category}</p>
        </div>
        <StatusPill status={job.status} />
      </div>

      {/* Description */}
      <p className="text-xs text-[#9A7F65] dark:text-[#6B5A4A] line-clamp-2 mb-4 leading-relaxed">
        {job.description}
      </p>

      {/* Meta row */}
      <div className="flex items-center gap-4 mb-4">
        <div className="flex items-center gap-1.5">
          <Coins className="h-3.5 w-3.5 text-[#C8A87A] dark:text-[#6B5A4A] flex-shrink-0" />
          <span className="text-sm font-bold text-[#1C1410] dark:text-[#F5EDE0]">
            {job.budget} <span className="font-semibold text-[#9A7F65] dark:text-[#6B5A4A] text-xs">{job.currency}</span>
          </span>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-[#9A7F65] dark:text-[#6B5A4A]">
          <Calendar className="h-3.5 w-3.5 flex-shrink-0" />
          {deadline}
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between border-t pt-3.5" style={{ borderColor: '#FAF0E4' }}>
        <div className="flex items-center gap-2">
          <div className="h-6 w-6 rounded-full bg-[#FFE5BF] dark:bg-[#2D2822] flex items-center justify-center text-xs font-bold text-[#6B5744] dark:text-[#9A8470] flex-shrink-0">
            {job.clientWallet?.slice(2, 4).toUpperCase()}
          </div>
          <span className="text-xs text-[#9A7F65] dark:text-[#6B5A4A]">{formatAddress(job.clientWallet)}</span>
          <TrustBadge score={job.clientTrustScore} />
        </div>

        {showActions && (
          <Link
            href={`/jobs/${job.id}`}
            className="inline-flex items-center gap-1 text-xs font-semibold text-[#F62440] dark:text-[#FF4D63] hover:text-[#D91C36] dark:hover:text-[#F62440] transition-colors"
          >
            View <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        )}
      </div>
    </div>
  );
}
