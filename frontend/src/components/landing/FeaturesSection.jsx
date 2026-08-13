import { Lock, Shield, Sparkles, GitBranch, Vote, Layers } from 'lucide-react';

const FEATURES = [
  {
    icon: <Lock className="h-5 w-5 text-[#F62440]" />,
    title: 'Escrow Contract',
    description: 'Funds are locked in a Solidity smart contract on Arbitrum. They release automatically on approval or refund on dispute — no bank required.',
    iconBg: { backgroundColor: '#FFF2DB', borderColor: '#FFE5BF' },
  },
  {
    icon: <Shield className="h-5 w-5 text-green-600" />,
    title: 'Reputation Registry',
    description: 'Every job outcome updates an immutable on-chain trust score. Permanent, portable, and publicly verifiable across every platform that integrates GTL.',
    iconBg: { backgroundColor: '#F0FDF4', borderColor: '#BBF7D0' },
  },
  {
    icon: <Sparkles className="h-5 w-5 text-amber-600" />,
    title: 'AI Trust Report',
    description: 'Powered by Gemini. Analyses wallet transaction history, dispute patterns, and on-chain behaviour to produce a Low / Medium / High risk rating.',
    iconBg: { backgroundColor: '#FFFBF0', borderColor: '#FDE68A' },
  },
  {
    icon: <GitBranch className="h-5 w-5 text-violet-600" />,
    title: 'Trust Passport',
    description: 'A public profile per wallet — trust score, jobs completed, dispute history, and AI risk summary. Works like a verified professional identity for your wallet.',
    iconBg: { backgroundColor: '#FAF5FF', borderColor: '#DDD6FE' },
  },
  {
    icon: <Vote className="h-5 w-5 text-red-600" />,
    title: 'Dispute System',
    description: 'Either party raises a dispute at any point. Funds freeze in escrow. Resolution is recorded permanently on-chain — creating a tamper-proof conflict history.',
    iconBg: { backgroundColor: '#FFF5F5', borderColor: '#FCA5A5' },
  },
  {
    icon: <Layers className="h-5 w-5 text-blue-600" />,
    title: 'Milestone Payments',
    description: 'Lock the full budget upfront and release funds in tranches as milestones are approved. Perfect for long-term engagements and large contracts.',
    iconBg: { backgroundColor: '#EFF6FF', borderColor: '#BFDBFE' },
  },
];

export default function FeaturesSection() {
  return (
    <section id="features" className="py-24 bg-white dark:bg-[#1A1714]">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="text-center mb-16">
          <p className="text-xs font-semibold uppercase tracking-widest text-[#F62440] mb-3">Protocol Features</p>
          <h2 className="text-3xl lg:text-4xl font-bold text-[#1C1410] dark:text-[#F5EDE0] tracking-tight">
            Everything needed to transact with a stranger, safely
          </h2>
          <p className="mt-4 text-[#9A7F65] dark:text-[#6B5A4A] max-w-xl mx-auto leading-relaxed">
            Six protocol primitives that together solve the trust problem for cross-border freelance work — and work for any two-party transaction.
          </p>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {FEATURES.map((f) => (
            <div
              key={f.title}
              className="group rounded-xl border p-6 hover:shadow-card-md transition-all duration-200 hover:border-[#F62440]/20"
              style={{ borderColor: '#F0D9B5' }}
            >
              <div
                className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-lg border"
                style={f.iconBg}
              >
                {f.icon}
              </div>
              <h3 className="text-base font-semibold text-[#1C1410] dark:text-[#F5EDE0] mb-2 group-hover:text-[#F62440] dark:group-hover:text-[#FF4D63] transition-colors">
                {f.title}
              </h3>
              <p className="text-sm text-[#9A7F65] dark:text-[#6B5A4A] leading-relaxed">
                {f.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
