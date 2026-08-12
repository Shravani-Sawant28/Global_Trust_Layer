import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

/** Full-page loading state */
export function PageLoader() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#FFFAF3] dark:bg-[#0F0D0B]">
      <div className="flex flex-col items-center gap-4">
        <div className="relative h-14 w-14">
          <div className="absolute inset-0 rounded-full border-4 border-[#FFE5BF] dark:border-[#2D2822]" />
          <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-[#F62440] animate-spin" />
        </div>
        <p className="text-sm font-medium text-[#9A7F65] dark:text-[#6B5A4A]">Loading…</p>
      </div>
    </div>
  );
}

/** Inline spinner */
export function Spinner({ className }) {
  return <Loader2 className={cn('h-5 w-5 animate-spin text-[#F62440]', className)} />;
}

/** Skeleton shimmer block */
export function Skeleton({ className }) {
  return (
    <div
      className={cn(
        'animate-pulse rounded-lg bg-[#FFE5BF] dark:bg-[#2D2822]',
        className
      )}
    />
  );
}
