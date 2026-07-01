import { cn } from '@/lib/utils';

/**
 * StatsCard — metric card used on the dashboard.
 *
 * @param {string}    title   - Label above the number
 * @param {string}    value   - The big number / metric
 * @param {string}    sub     - Small sub-label below the value
 * @param {ReactNode} icon    - Lucide icon element
 * @param {string}    accent  - Tailwind color class for icon background
 */
export default function StatsCard({ title, value, sub, icon, accent = 'bg-brand-50 dark:bg-brand-900/30' }) {
  return (
    <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5 shadow-card">
      <div className="flex items-start justify-between mb-4">
        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</p>
        <div className={cn('flex h-9 w-9 items-center justify-center rounded-xl', accent)}>
          {icon}
        </div>
      </div>
      <p className="text-2xl font-bold text-gray-900 dark:text-white tabular-nums">{value}</p>
      {sub && <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">{sub}</p>}
    </div>
  );
}
