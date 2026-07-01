import { Lock, Shield, Sparkles, GitBranch, Vote, Layers } from 'lucide-react';

const FEATURES = [
  {
    icon: <Lock className="h-5 w-5 text-brand-500" />,
    title: 'Escrow Contract',
    description: 'Funds are locked in a Solidity smart contract on Arbitrum. They release automatically on approval or refund on dispute — no bank required.',
    accent: 'bg-brand-50 dark:bg-brand-900/30',
  },
  {
    icon: <Shield className="h-5 w-5 text-green-500" />,
    title: 'Reputation Registry',
    description: 'Every job outcome updates an immutable on-chain trust score. Permanent, portable, and publicly verifiable across every platform that integrates GTL.',
    accent: 'bg-green-50 dark:bg-green-900/20',
  },
  {
    icon: <Sparkles className="h-5 w-5 text-amber-500" />,
    title: 'AI Trust Report',
    description: 'Powered by Gemini. Analyses wallet transaction history, dispute patterns, and on-chain behaviour to produce a Low / Medium / High risk rating.',
    accent: 'bg-amber-50 dark:bg-amber-900/20',
  },
  {
    icon: <GitBranch className="h-5 w-5 text-violet-500" />,
    title: 'Trust Passport',
    description: 'A public profile per wallet — trust score, jobs completed, dispute history, and AI risk summary. Works like a verified professional identity for your wallet.',
    accent: 'bg-violet-50 dark:bg-violet-900/20',
  },
  {
    icon: <Vote className="h-5 w-5 text-red-500" />,
    title: 'Dispute System',
    description: 'Either party raises a dispute at any point. Funds freeze in escrow. Resolution is recorded permanently on-chain — creating a tamper-proof conflict history.',
    accent: 'bg-red-50 dark:bg-red-900/20',
  },
  {
    icon: <Layers className="h-5 w-5 text-blue-500" />,
    title: 'Milestone Payments',
    description: 'Lock the full budget upfront and release funds in tranches as milestones are approved. Perfect for long-term engagements and large contracts.',
    accent: 'bg-blue-50 dark:bg-blue-900/20',
  },
];

export default function FeaturesSection() {
  return (
    <section id="features" className="py-24 bg-white dark:bg-gray-900">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <p className="text-sm font-semibold uppercase tracking-wider text-brand-500 mb-3">Protocol Features</p>
          <h2 className="text-4xl font-bold text-gray-900 dark:text-white tracking-tight">
            Everything needed to transact with a stranger, safely
          </h2>
          <p className="mt-4 text-gray-500 dark:text-gray-400 max-w-xl mx-auto">
            Six protocol primitives that together solve the trust problem for cross-border freelance work — and work for any two-party transaction.
          </p>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {FEATURES.map((f) => (
            <div
              key={f.title}
              className="group rounded-2xl border border-gray-200 dark:border-gray-800 p-6 hover:border-brand-300 dark:hover:border-brand-700 hover:shadow-card-md transition-all duration-200"
            >
              <div className={`mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl ${f.accent}`}>
                {f.icon}
              </div>
              <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-2 group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">
                {f.title}
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
                {f.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
