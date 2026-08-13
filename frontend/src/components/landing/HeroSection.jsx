'use client';

import Link from 'next/link';
import { usePrivy } from '@privy-io/react-auth';
import { ArrowRight, Lock, Zap, ShieldCheck } from 'lucide-react';
import Button from '@/components/ui/Button';

export default function HeroSection() {
  const { authenticated, login } = usePrivy();

  return (
    <section className="relative overflow-hidden py-24 lg:py-32" style={{ backgroundColor: '#FFFAF3' }}>
      {/* Subtle warm grid */}
      <div className="pointer-events-none absolute inset-0 bg-grid-pattern dark:bg-grid-pattern-dark" />

      {/* Soft warm radial glow */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <div className="h-[500px] w-[500px] rounded-full opacity-40 blur-3xl"
          style={{ background: 'radial-gradient(circle, #FFE5BF 0%, transparent 70%)' }} />
      </div>

      <div className="relative mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 text-center">

        {/* Protocol badge */}
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border px-4 py-1.5 animate-fade-in"
          style={{ backgroundColor: '#FFF2DB', borderColor: '#F0D9B5' }}>
          <span className="h-2 w-2 rounded-full bg-[#F62440] animate-pulse flex-shrink-0" />
          <span className="text-xs font-semibold text-[#6B5744] dark:text-[#9A8470] tracking-wide">
            Built on Arbitrum Sepolia · Open Protocol
          </span>
        </div>

        {/* Headline */}
        <h1 className="text-5xl lg:text-[64px] font-bold text-[#1C1410] dark:text-[#F5EDE0] leading-[1.08] tracking-tight mb-6 animate-slide-up">
          Trust Protocol for{' '}
          <span className="text-[#F62440]">
            Cross-Border Work
          </span>
        </h1>

        {/* Sub-headline */}
        <p className="mx-auto max-w-2xl text-lg text-[#6B5744] dark:text-[#9A8470] leading-relaxed mb-10 animate-slide-up" style={{ animationDelay: '0.1s' }}>
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
        <div className="flex flex-wrap items-center justify-center gap-6 text-xs text-[#9A7F65] dark:text-[#6B5A4A] animate-fade-in" style={{ animationDelay: '0.35s' }}>
          {[
            { icon: <Lock className="h-3.5 w-3.5" />, text: 'Non-custodial escrow' },
            { icon: <ShieldCheck className="h-3.5 w-3.5" />, text: 'On-chain reputation' },
            { icon: <Zap className="h-3.5 w-3.5" />, text: '2% protocol fee' },
          ].map(({ icon, text }) => (
            <span key={text} className="flex items-center gap-1.5 font-medium">
              <span className="text-[#C8A87A]">{icon}</span>
              {text}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
