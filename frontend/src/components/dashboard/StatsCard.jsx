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
export default function StatsCard({ title, value, sub, icon, accent = 'bg-[#FFF2DB] dark:bg-[#2D2822]' }) {
  return (
    <div className="rounded-xl border bg-white dark:bg-[#1A1714] p-5 shadow-card" style={{ borderColor: '#F0D9B5' }}>
      <div className="flex items-start justify-between mb-4">
        <p className="text-sm font-medium text-[#9A7F65] dark:text-[#6B5A4A]">{title}</p>
        <div className={cn('flex h-9 w-9 items-center justify-center rounded-lg flex-shrink-0', accent)}>
          {icon}
        </div>
      </div>
      <p className="text-2xl font-bold text-[#1C1410] dark:text-[#F5EDE0] tabular-nums tracking-tight">{value}</p>
      {sub && <p className="mt-1 text-xs text-[#C8A87A] dark:text-[#6B5A4A]">{sub}</p>}
    </div>
  );
}
