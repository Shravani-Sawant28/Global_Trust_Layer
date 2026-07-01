'use client';

import Link from 'next/link';
import { usePrivy } from '@privy-io/react-auth';
import { ArrowRight, Lock, Zap, ShieldCheck } from 'lucide-react';
import Button from '@/components/ui/Button';

export default function HeroSection() {
  const { authenticated, login } = usePrivy();

  return (
    <section className="relative overflow-hidden bg-[#F9FAFB] dark:bg-gray-950 py-24 lg:py-32">
      {/* Grid background */}
      <div className="pointer-events-none absolute inset-0 bg-grid-pattern dark:bg-grid-pattern-dark" />

      {/* Radial glow */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <div className="h-[600px] w-[600px] rounded-full bg-brand-500/5 dark:bg-brand-500/10 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 text-center">
        {/* Protocol badge */}
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-brand-200 dark:border-brand-800/50 bg-brand-50 dark:bg-brand-900/20 px-4 py-1.5 animate-fade-in">
          <span className="h-2 w-2 rounded-full bg-brand-500 animate-pulse" />
          <span className="text-xs font-semibold text-brand-600 dark:text-brand-400 tracking-wide">
            Built on Arbitrum Sepolia · Open Protocol
          </span>
        </div>

        {/* Headline */}
        <h1 className="text-5xl lg:text-7xl font-bold text-gray-900 dark:text-white leading-[1.08] tracking-tight mb-6 animate-slide-up">
          Trust Protocol for{' '}
          <span className="bg-gradient-to-r from-brand-500 to-brand-400 bg-clip-text text-transparent">
            Cross-Border Work
          </span>
        </h1>

        {/* Sub-headline */}
        <p className="mx-auto max-w-2xl text-lg text-gray-500 dark:text-gray-400 leading-relaxed mb-10 animate-slide-up" style={{ animationDelay: '0.1s' }}>
          Lock funds in escrow. Prove work on-chain. Build a portable reputation that follows your wallet everywhere — without paying 20% to a platform.
        </p>

        {/* CTAs */}
        <div className="flex flex-wrap items-center justify-center gap-3 mb-16 animate-slide-up" style={{ animationDelay: '0.2s' }}>
          {authenticated ? (
            <Link href="/dashboard">
              <Button size="lg">
                Go to Dashboard <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          ) : (
            <>
              <Link href="/onboarding?role=client" onClick={(e) => { e.preventDefault(); login(); }}>
                <Button size="lg" id="cta-client">
                  I'm a Client <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link href="/onboarding?role=freelancer" onClick={(e) => { e.preventDefault(); login(); }}>
                <Button size="lg" variant="secondary" id="cta-freelancer">
                  I'm a Freelancer
                </Button>
              </Link>
            </>
          )}
        </div>

        {/* Trust signals */}
        <div className="flex flex-wrap items-center justify-center gap-6 text-xs text-gray-400 dark:text-gray-500 animate-fade-in" style={{ animationDelay: '0.35s' }}>
          {[
            { icon: <Lock className="h-3.5 w-3.5" />, text: 'Non-custodial escrow' },
            { icon: <ShieldCheck className="h-3.5 w-3.5" />, text: 'On-chain reputation' },
            { icon: <Zap className="h-3.5 w-3.5" />, text: '2% protocol fee' },
          ].map(({ icon, text }) => (
            <span key={text} className="flex items-center gap-1.5 font-medium">
              <span className="text-brand-500">{icon}</span>
              {text}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
