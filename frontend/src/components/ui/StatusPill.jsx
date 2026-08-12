import { cn } from '@/lib/utils';

// Semantic status colors — preserved for meaning, not branding
const JOB_STATUS = {
  'Funded':      { bg: 'bg-blue-50   dark:bg-blue-900/30',   text: 'text-blue-700   dark:text-blue-400',   dot: 'bg-blue-500'   },
  'In Progress': { bg: 'bg-amber-50  dark:bg-amber-900/30',  text: 'text-amber-700  dark:text-amber-400',  dot: 'bg-amber-500'  },
  'Submitted':   { bg: 'bg-violet-50 dark:bg-violet-900/30', text: 'text-violet-700 dark:text-violet-400', dot: 'bg-violet-500' },
  'Disputed':    { bg: 'bg-red-50    dark:bg-red-900/30',    text: 'text-red-700    dark:text-red-400',    dot: 'bg-red-500'    },
  'Complete':    { bg: 'bg-green-50  dark:bg-green-900/30',  text: 'text-green-700  dark:text-green-400',  dot: 'bg-green-500'  },
  'Refunded':    { bg: 'bg-[#FFF2DB] dark:bg-[#2D2822]',     text: 'text-[#6B5744]  dark:text-[#9A8470]',  dot: 'bg-[#C8A87A]'  },
  'Created':     { bg: 'bg-[#FFF2DB] dark:bg-[#2D2822]',     text: 'text-[#6B5744]  dark:text-[#9A8470]',  dot: 'bg-[#C8A87A]'  },
  'Low Risk':    { bg: 'bg-green-50  dark:bg-green-900/30',  text: 'text-green-700  dark:text-green-400',  dot: 'bg-green-500'  },
  'Medium Risk': { bg: 'bg-amber-50  dark:bg-amber-900/30',  text: 'text-amber-700  dark:text-amber-400',  dot: 'bg-amber-500'  },
  'High Risk':   { bg: 'bg-red-50    dark:bg-red-900/30',    text: 'text-red-700    dark:text-red-400',    dot: 'bg-red-500'    },
};

/**
 * StatusPill — renders a coloured pill badge for a job or risk status.
 * Semantic colors are intentionally preserved (green=complete, red=dispute, amber=in-progress).
 *
 * @param {string} status - One of the JOB_STATUS keys above.
 * @param {string} className - Additional classes.
 */
export default function StatusPill({ status, className }) {
  const style = JOB_STATUS[status] || JOB_STATUS['Created'];

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-semibold whitespace-nowrap',
        style.bg,
        style.text,
        className
      )}
    >
      <span className={cn('h-1.5 w-1.5 rounded-full flex-shrink-0', style.dot)} />
      {status}
    </span>
  );
}
