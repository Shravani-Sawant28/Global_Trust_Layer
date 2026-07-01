import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

/** Full-page loading state */
export function PageLoader() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-950">
      <div className="flex flex-col items-center gap-4">
        <div className="relative h-14 w-14">
          <div className="absolute inset-0 rounded-full border-4 border-brand-100 dark:border-brand-900/40" />
          <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-brand-500 animate-spin" />
        </div>
        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Loading…</p>
      </div>
    </div>
  );
}

/** Inline spinner */
export function Spinner({ className }) {
  return <Loader2 className={cn('h-5 w-5 animate-spin text-brand-500', className)} />;
}

/** Skeleton shimmer block */
export function Skeleton({ className }) {
  return (
    <div
      className={cn(
        'animate-pulse rounded-xl bg-gray-100 dark:bg-gray-800',
        className
      )}
    />
  );
}
