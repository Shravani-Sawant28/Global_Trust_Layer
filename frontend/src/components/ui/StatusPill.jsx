import { cn } from '@/lib/utils';

const JOB_STATUS = {
  'Funded':      { bg: 'bg-blue-100   dark:bg-blue-900/40',   text: 'text-blue-700   dark:text-blue-400',   dot: 'bg-blue-500'   },
  'In Progress': { bg: 'bg-amber-100  dark:bg-amber-900/40',  text: 'text-amber-700  dark:text-amber-400',  dot: 'bg-amber-500'  },
  'Submitted':   { bg: 'bg-violet-100 dark:bg-violet-900/40', text: 'text-violet-700 dark:text-violet-400', dot: 'bg-violet-500' },
  'Disputed':    { bg: 'bg-red-100    dark:bg-red-900/40',    text: 'text-red-700    dark:text-red-400',    dot: 'bg-red-500'    },
  'Complete':    { bg: 'bg-green-100  dark:bg-green-900/40',  text: 'text-green-700  dark:text-green-400',  dot: 'bg-green-500'  },
  'Refunded':    { bg: 'bg-gray-100   dark:bg-gray-800',      text: 'text-gray-600   dark:text-gray-400',   dot: 'bg-gray-400'   },
  'Low Risk':    { bg: 'bg-green-100  dark:bg-green-900/40',  text: 'text-green-700  dark:text-green-400',  dot: 'bg-green-500'  },
  'Medium Risk': { bg: 'bg-amber-100  dark:bg-amber-900/40',  text: 'text-amber-700  dark:text-amber-400',  dot: 'bg-amber-500'  },
  'High Risk':   { bg: 'bg-red-100    dark:bg-red-900/40',    text: 'text-red-700    dark:text-red-400',    dot: 'bg-red-500'    },
};

/**
 * StatusPill — renders a coloured pill badge for a job or risk status.
 *
 * @param {string} status - One of the JOB_STATUS keys above.
 * @param {string} className - Additional classes.
 */
export default function StatusPill({ status, className }) {
  const style = JOB_STATUS[status] || JOB_STATUS['Funded'];

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium',
        style.bg,
        style.text,
        className
      )}
    >
      <span className={cn('h-1.5 w-1.5 rounded-full', style.dot)} />
      {status}
    </span>
  );
}
