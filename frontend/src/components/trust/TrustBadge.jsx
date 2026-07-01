import { trustScoreColor, cn } from '@/lib/utils';
import { Shield } from 'lucide-react';

/**
 * TrustBadge — compact inline badge showing wallet trust score.
 * Used on JobCard, browse list, and table rows.
 *
 * @param {number} score - Trust score 0–100
 * @param {string} className
 */
export default function TrustBadge({ score = 0, className }) {
  const color = trustScoreColor(score);
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 px-2 py-0.5 text-xs font-semibold',
        color,
        className
      )}
      title={`Trust Score: ${score}/100`}
    >
      <Shield className="h-3 w-3" />
      {score}
    </span>
  );
}
