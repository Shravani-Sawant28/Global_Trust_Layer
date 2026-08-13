'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { usePrivy } from '@privy-io/react-auth';
import { useApp } from '@/context/AppContext';
import Button from '@/components/ui/Button';
import { PageLoader } from '@/components/ui/Loader';
import { Shield, Briefcase, Users, CheckCircle2, ArrowRight } from 'lucide-react';

/**
 * Onboarding page — Page 2
 *
 * Flow:
 *  1. User arrives (possibly with ?role=client or ?role=freelancer from hero CTAs).
 *  2. If not authenticated → shows Privy login button.
 *  3. After authentication → shows role selection card.
 *  4. User selects role → saved to localStorage → redirect to dashboard.
 */
function OnboardingContent() {
  const router          = useRouter();
  const searchParams    = useSearchParams();
  const { ready, authenticated, login, user } = usePrivy();
  const { role, setRole } = useApp();
  const [selectedRole, setSelectedRole] = useState(null);
  const [saving, setSaving]             = useState(false);

  // Pre-select role from URL param (?role=client / ?role=freelancer)
  useEffect(() => {
    const urlRole = searchParams.get('role');
    if (urlRole === 'client')     setSelectedRole('CLIENT');
    if (urlRole === 'freelancer') setSelectedRole('FREELANCER');
  }, [searchParams]);

  // Already has role → skip to dashboard
  useEffect(() => {
    if (authenticated && role) {
      router.replace('/dashboard');
    }
  }, [authenticated, role, router]);

  if (!ready) return <PageLoader />;

  const handleConfirm = async () => {
    if (!selectedRole) return;
    setSaving(true);
    setRole(selectedRole);
    // TODO: call saveUserRole(walletAddress, selectedRole) when backend is up
    setTimeout(() => {
      router.push('/dashboard');
    }, 600);
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-[#FFFAF3] dark:bg-[#0F0D0B] flex items-center justify-center p-4">
      <div className="w-full max-w-md">

        {/* Step indicator */}
        <div className="mb-8 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border px-4 py-1.5 mb-4" style={{ backgroundColor: '#FFF2DB', borderColor: '#F0D9B5' }}>
            <span className="h-2 w-2 rounded-full bg-[#F62440]" />
            <span className="text-xs font-semibold text-[#6B5744] dark:text-[#9A8470]">Onboarding</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2 tracking-tight">
            {!authenticated ? 'Connect your wallet' : 'Choose your role'}
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {!authenticated
              ? 'No password needed. Your wallet is your identity.'
              : 'You can always switch later from your profile settings.'}
          </p>
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-card-md p-6">

          {/* ── Step 1: Connect Wallet ── */}
          {!authenticated ? (
            <div className="space-y-5">
              <div className="rounded-lg border px-4 py-4" style={{ backgroundColor: '#FFF2DB', borderColor: '#F0D9B5' }}>
                <div className="flex items-start gap-3 mb-4">
                  <Shield className="mt-0.5 h-5 w-5 text-[#C8A87A] shrink-0" />
                  <div>
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">What connecting means</p>
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                      GTL uses your wallet address as your identity. No username or password — just cryptographic proof that you own the wallet. Your reputation is tied to your address, not a company's servers.
                    </p>
                  </div>
                </div>
                <ul className="space-y-2">
                  {[
                    'Email, Google, or MetaMask — all supported',
                    'Embedded wallet auto-created for email users',
                    'Only you can sign transactions from your wallet',
                  ].map((item) => (
                    <li key={item} className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                      <CheckCircle2 className="h-3.5 w-3.5 text-green-500 shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              <Button onClick={login} size="lg" className="w-full">
                Connect Wallet
                <ArrowRight className="h-4 w-4" />
              </Button>

              <p className="text-center text-xs text-gray-400 dark:text-gray-500">
                GTL never stores your private key · Non-custodial
              </p>
            </div>

          ) : (
            /* ── Step 2: Role Selection ── */
            <div className="space-y-4">
              {[
                {
                  value: 'CLIENT',
                  icon: <Briefcase className="h-6 w-6" />,
                  title: "I'm a Client",
                  subtitle: 'Post jobs, lock escrow funds, approve work',
                  color: 'text-[#F62440]',
                  selectedBorder: 'border-[#F62440]/30 bg-[#FFE5BF] dark:bg-[#2D2822]',
                },
                {
                  value: 'FREELANCER',
                  icon: <Users className="h-6 w-6" />,
                  title: "I'm a Freelancer",
                  subtitle: 'Browse jobs, submit work, earn reputation',
                  color: 'text-green-500',
                  selectedBorder: 'border-green-500 bg-green-50 dark:bg-green-900/20',
                },
              ].map((option) => (
                <button
                  key={option.value}
                  onClick={() => setSelectedRole(option.value)}
                  className={`w-full flex items-center gap-4 rounded-xl border-2 p-4 text-left transition-all duration-150 ${
                    selectedRole === option.value
                      ? option.selectedBorder
                      : 'border-[#F0D9B5] dark:border-[#352E26] hover:border-[#F62440]/30 dark:hover:border-[#F62440]/20'
                  }`}
                >
                  <div className={`flex h-12 w-12 items-center justify-center rounded-xl bg-gray-50 dark:bg-gray-800 ${option.color}`}>
                    {option.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">{option.title}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{option.subtitle}</p>
                  </div>
                  {selectedRole === option.value && (
                    <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0" />
                  )}
                </button>
              ))}

              <Button
                onClick={handleConfirm}
                disabled={!selectedRole}
                loading={saving}
                size="lg"
                className="w-full mt-2"
              >
                Continue to Dashboard
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>

        {/* Footer note */}
        <p className="mt-6 text-center text-xs text-gray-400 dark:text-gray-500">
          By connecting you agree to the GTL open protocol terms. No personal data is stored on GTL servers.
        </p>
      </div>
    </div>
  );
}

export default function OnboardingPage() {
  return (
    <Suspense fallback={<PageLoader />}>
      <OnboardingContent />
    </Suspense>
  );
}
