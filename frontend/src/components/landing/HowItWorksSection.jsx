import { Lock, Hammer, Coins, ArrowRight } from 'lucide-react';

const STEPS = [
  {
    number: '01',
    icon: <Lock className="h-6 w-6 text-brand-500" />,
    title: 'Lock Funds',
    description: 'Client locks the full budget in an Arbitrum smart contract. Neither party can touch it without the agreed outcome.',
    color: 'bg-brand-50 dark:bg-brand-900/30',
    border: 'border-brand-100 dark:border-brand-800/40',
  },
  {
    number: '02',
    icon: <Hammer className="h-6 w-6 text-amber-500" />,
    title: 'Do the Work',
    description: 'Freelancer accepts the job, checks the client\'s Trust Passport, and delivers work — knowing funds are secured in escrow.',
    color: 'bg-amber-50 dark:bg-amber-900/20',
    border: 'border-amber-100 dark:border-amber-800/40',
  },
  {
    number: '03',
    icon: <Coins className="h-6 w-6 text-green-500" />,
    title: 'Release & Earn Reputation',
    description: 'Client approves and funds are released instantly. Both wallets receive an immutable on-chain reputation update.',
    color: 'bg-green-50 dark:bg-green-900/20',
    border: 'border-green-100 dark:border-green-800/40',
  },
];

export default function HowItWorksSection() {
  return (
    <section id="how-it-works" className="py-24 bg-white dark:bg-gray-900">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <p className="text-sm font-semibold uppercase tracking-wider text-brand-500 mb-3">
            How It Works
          </p>
          <h2 className="text-4xl font-bold text-gray-900 dark:text-white tracking-tight">
            From agreement to payment in three steps
          </h2>
          <p className="mt-4 text-gray-500 dark:text-gray-400 max-w-xl mx-auto">
            No intermediaries. No platform lock-in. Just a smart contract, a trust score, and two parties who both have skin in the game.
          </p>
        </div>

        {/* Steps */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative">
          {/* Connector lines (desktop) */}
          <div className="hidden md:block absolute top-12 left-[33%] right-[33%] h-0.5 bg-gradient-to-r from-brand-200 via-amber-200 to-green-200 dark:from-brand-800 dark:via-amber-800 dark:to-green-800 z-0" />

          {STEPS.map((step, i) => (
            <div key={step.number} className="relative z-10 flex flex-col items-center text-center">
              {/* Icon container */}
              <div className={`flex h-20 w-20 items-center justify-center rounded-2xl border-2 ${step.color} ${step.border} mb-6 shadow-card`}>
                {step.icon}
              </div>
              <span className="text-xs font-bold tracking-widest text-gray-300 dark:text-gray-600 mb-2">
                STEP {step.number}
              </span>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-3">{step.title}</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed max-w-xs">
                {step.description}
              </p>
              {i < STEPS.length - 1 && (
                <ArrowRight className="mt-6 h-5 w-5 text-gray-200 dark:text-gray-700 md:hidden" />
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
