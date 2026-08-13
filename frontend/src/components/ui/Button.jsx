import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

/**
 * Button — GTL primary button component.
 *
 * Variants:
 *  - primary  : filled brand red #F62440 (default) — for CTAs
 *  - secondary: warm-bordered neutral — for secondary actions
 *  - ghost    : no border, subtle hover
 *  - danger   : semantic destructive action (distinct red shade)
 *
 * Sizes: sm | md (default) | lg
 */
export default function Button({
  children,
  variant  = 'primary',
  size     = 'md',
  loading  = false,
  disabled = false,
  className,
  ...props
}) {
  const base = 'inline-flex items-center justify-center gap-2 rounded-lg font-semibold transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#F62440] focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50';

  const variants = {
    primary:
      'bg-[#F62440] text-white hover:bg-[#D91C36] active:bg-[#B5162C] shadow-brand hover:shadow-brand-lg',
    secondary:
      'border border-[#F0D9B5] dark:border-[#352E26] bg-white dark:bg-[#1A1714] text-[#3D2E16] dark:text-[#D4C4B0] hover:bg-[#FFF2DB] dark:hover:bg-[#2D2822] hover:border-[#F62440]/30',
    ghost:
      'bg-transparent text-[#6B5744] dark:text-[#9A8470] hover:bg-[#FFF2DB] dark:hover:bg-[#221E1A] hover:text-[#3D2E16] dark:hover:text-[#F5EDE0]',
    danger:
      'bg-red-600 text-white hover:bg-red-700 active:bg-red-800 focus-visible:ring-red-500',
  };

  const sizes = {
    sm: 'h-8  px-3.5 text-xs',
    md: 'h-10 px-4   text-sm',
    lg: 'h-11 px-5   text-sm',
  };

  return (
    <button
      disabled={disabled || loading}
      className={cn(base, variants[variant], sizes[size], className)}
      {...props}
    >
      {loading && <Loader2 className="h-4 w-4 animate-spin" />}
      {children}
    </button>
  );
}
