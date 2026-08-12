import { Lock, Hammer, Coins, ArrowRight } from 'lucide-react';

const STEPS = [
  {
    number: '01',
    icon: <Lock className="h-6 w-6 text-[#F62440]" />,
    title: 'Lock Funds',
    description: 'Client locks the full budget in an Arbitrum smart contract. Neither party can touch it without the agreed outcome.',
    iconBg: { backgroundColor: '#FFF2DB', borderColor: '#FFE5BF' },
  },
  {
    number: '02',
    icon: <Hammer className="h-6 w-6 text-amber-600" />,
    title: 'Do the Work',
    description: "Freelancer accepts the job, checks the client's Trust Passport, and delivers work — knowing funds are secured in escrow.",
    iconBg: { backgroundColor: '#FFFBF0', borderColor: '#FDE68A' },
  },
  {
    number: '03',
    icon: <Coins className="h-6 w-6 text-green-600" />,
    title: 'Release & Earn Reputation',
    description: 'Client approves and funds are released instantly. Both wallets receive an immutable on-chain reputation update.',
    iconBg: { backgroundColor: '#F0FDF4', borderColor: '#BBF7D0' },
  },
];

export default function HowItWorksSection() {
  return (
    <section id="how-it-works" className="py-24 bg-white dark:bg-[#0F0D0B]">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="text-center mb-16">
          <p className="text-xs font-semibold uppercase tracking-widest text-[#F62440] mb-3">
            How It Works
          </p>
          <h2 className="text-3xl lg:text-4xl font-bold text-[#1C1410] dark:text-[#F5EDE0] tracking-tight">
            From agreement to payment in three steps
          </h2>
          <p className="mt-4 text-[#9A7F65] dark:text-[#6B5A4A] max-w-xl mx-auto leading-relaxed">
            No intermediaries. No platform lock-in. Just a smart contract, a trust score, and two parties who both have skin in the game.
          </p>
        </div>

        {/* Steps */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
          {/* Connector line (desktop) */}
          <div className="hidden md:block absolute top-11 left-[33%] right-[33%] h-px z-0"
            style={{ background: 'linear-gradient(to right, #F0D9B5, #F0D9B5)' }} />

          {STEPS.map((step, i) => (
            <div key={step.number} className="relative z-10 flex flex-col items-center text-center">
              {/* Icon container */}
              <div
                className="flex h-[88px] w-[88px] items-center justify-center rounded-2xl border-2 mb-6 shadow-warm"
                style={step.iconBg}
              >
                {step.icon}
              </div>
              <span className="text-xs font-bold tracking-widest text-[#C8A87A] dark:text-[#6B5A4A] mb-2">
                STEP {step.number}
              </span>
              <h3 className="text-lg font-bold text-[#1C1410] dark:text-[#F5EDE0] mb-3">{step.title}</h3>
              <p className="text-sm text-[#9A7F65] dark:text-[#6B5A4A] leading-relaxed max-w-xs">
                {step.description}
              </p>
              {i < STEPS.length - 1 && (
                <ArrowRight className="mt-6 h-5 w-5 text-[#F0D9B5] dark:text-[#2D2822] md:hidden" />
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
