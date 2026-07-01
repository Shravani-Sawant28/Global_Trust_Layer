import { X, Check } from 'lucide-react';

const COMPARISON = [
  { feature: 'Platform fee', traditional: '20–30%', gtl: '2%',     gtlWins: true  },
  { feature: 'Reputation ownership', traditional: 'Platform-owned', gtl: 'Your wallet', gtlWins: true  },
  { feature: 'Escrow security',  traditional: 'Centralized', gtl: 'Smart contract', gtlWins: true  },
  { feature: 'Dispute resolution', traditional: 'Platform decides', gtl: 'On-chain record', gtlWins: true  },
  { feature: 'Fraud risk check',  traditional: 'None', gtl: 'AI Trust Report', gtlWins: true  },
  { feature: 'Portable trust',    traditional: 'Siloed', gtl: 'Across any platform', gtlWins: true  },
];

export default function WhyGTLSection() {
  return (
    <section id="why-gtl" className="py-24 bg-gray-50 dark:bg-gray-950">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <p className="text-sm font-semibold uppercase tracking-wider text-brand-500 mb-3">Why GTL</p>
          <h2 className="text-4xl font-bold text-gray-900 dark:text-white tracking-tight">
            Stop paying 20% to platforms that don't even protect you
          </h2>
          <p className="mt-4 text-gray-500 dark:text-gray-400 max-w-xl mx-auto">
            GTL isn't a platform — it's the infrastructure layer underneath platforms. No company controls it. No one can delete your reputation.
          </p>
        </div>

        {/* Comparison card */}
        <div className="rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden shadow-card-md bg-white dark:bg-gray-900">
          {/* Column headers */}
          <div className="grid grid-cols-3 bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-800">
            <div className="px-6 py-4 text-sm font-semibold text-gray-500 dark:text-gray-400">Feature</div>
            <div className="px-6 py-4 text-sm font-semibold text-gray-500 dark:text-gray-400 border-l border-gray-200 dark:border-gray-800">
              Upwork / Traditional
            </div>
            <div className="px-6 py-4 border-l-2 border-brand-200 dark:border-brand-700 bg-brand-50/50 dark:bg-brand-900/10">
              <span className="text-sm font-bold text-brand-600 dark:text-brand-400">GlobalTrust</span>
            </div>
          </div>

          {/* Rows */}
          {COMPARISON.map((row, i) => (
            <div
              key={row.feature}
              className={`grid grid-cols-3 border-b border-gray-100 dark:border-gray-800 last:border-0 ${
                i % 2 === 0 ? '' : 'bg-gray-50/40 dark:bg-gray-800/20'
              }`}
            >
              <div className="px-6 py-4 text-sm font-medium text-gray-700 dark:text-gray-300">
                {row.feature}
              </div>
              <div className="px-6 py-4 border-l border-gray-100 dark:border-gray-800 flex items-center gap-2">
                <X className="h-4 w-4 shrink-0 text-red-400" />
                <span className="text-sm text-gray-500 dark:text-gray-400">{row.traditional}</span>
              </div>
              <div className="px-6 py-4 border-l-2 border-brand-200 dark:border-brand-700 bg-brand-50/30 dark:bg-brand-900/10 flex items-center gap-2">
                <Check className="h-4 w-4 shrink-0 text-brand-500" />
                <span className="text-sm font-semibold text-gray-800 dark:text-gray-100">{row.gtl}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Fee highlight */}
        <div className="mt-8 grid grid-cols-2 gap-4">
          <div className="rounded-2xl border border-red-100 dark:border-red-900/30 bg-red-50 dark:bg-red-900/10 p-6 text-center">
            <p className="text-4xl font-bold text-red-500 mb-1">20–30%</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">Average Upwork platform fee</p>
          </div>
          <div className="rounded-2xl border border-brand-200 dark:border-brand-800/40 bg-brand-50 dark:bg-brand-900/20 p-6 text-center">
            <p className="text-4xl font-bold text-brand-500 mb-1">2%</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">GTL protocol fee — that's it</p>
          </div>
        </div>
      </div>
    </section>
  );
}
