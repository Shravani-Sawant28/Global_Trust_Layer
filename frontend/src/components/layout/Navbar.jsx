'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { usePrivy } from '@privy-io/react-auth';
import { useTheme } from '@/context/ThemeContext';
import { useRole } from '@/hooks/useRole';
import { formatAddress } from '@/lib/utils';
import Button from '@/components/ui/Button';
import {
  Shield,
  Sun,
  Moon,
  LogOut,
  LayoutDashboard,
  Briefcase,
  Search,
  ChevronDown,
} from 'lucide-react';
import { useState } from 'react';

export default function Navbar() {
  const pathname = usePathname();
  const { theme, toggleTheme } = useTheme();
  const { ready, authenticated, user, login, logout } = usePrivy();
  const { isClient, isFreelancer } = useRole();
  const [menuOpen, setMenuOpen] = useState(false);

  const walletAddress =
    user?.wallet?.address ||
    user?.linkedAccounts?.find((a) => a.type === 'wallet')?.address;

  const isLanding = pathname === '/';

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-[#FFFAF3]/95 dark:bg-[#0F0D0B]/95 backdrop-blur-md"
      style={{ borderColor: '#F0D9B5' }}>
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">

        {/* ── Logo ── */}
        <Link href="/" className="flex items-center gap-2.5 group flex-shrink-0">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#F62440] shadow-brand group-hover:shadow-brand-lg transition-shadow">
            <Shield className="h-4 w-4 text-white" />
          </div>
          <span className="text-base font-bold text-[#1C1410] dark:text-[#F5EDE0] tracking-tight">
            Global<span className="text-[#F62440]">Trust</span>
          </span>
        </Link>

        {/* ── Nav Links (authenticated) ── */}
        {authenticated && (
          <nav className="hidden md:flex items-center gap-0.5">
            <NavLink href="/dashboard" icon={<LayoutDashboard className="h-4 w-4" />} label="Dashboard" active={pathname.startsWith('/dashboard')} />
            {isClient && (
              <NavLink href="/jobs/create" icon={<Briefcase className="h-4 w-4" />} label="Post a Job" active={pathname.startsWith('/jobs/create')} />
            )}
            {isFreelancer && (
              <NavLink href="/jobs/browse" icon={<Search className="h-4 w-4" />} label="Browse Jobs" active={pathname.startsWith('/jobs/browse')} />
            )}
          </nav>
        )}

        {/* ── Right section ── */}
        <div className="flex items-center gap-2">
          {/* Dark mode toggle */}
          <button
            onClick={toggleTheme}
            aria-label="Toggle dark mode"
            className="rounded-lg p-2 text-[#6B5744] dark:text-[#9A8470] hover:bg-[#FFE5BF] dark:hover:bg-[#2D2822] transition-colors"
          >
            {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>

          {!ready ? (
            <div className="h-9 w-28 animate-pulse rounded-lg bg-[#FFE5BF] dark:bg-[#221E1A]" />
          ) : authenticated && walletAddress ? (
            /* Wallet menu */
            <div className="relative">
              <button
                onClick={() => setMenuOpen((v) => !v)}
                className="flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium text-[#3D2E16] dark:text-[#D4C4B0] hover:bg-[#FFF2DB] dark:hover:bg-[#221E1A] transition-colors"
                style={{ borderColor: '#F0D9B5' }}
              >
                <span className="h-6 w-6 rounded-full bg-[#FFE5BF] dark:bg-[#2D2822] flex items-center justify-center">
                  <Shield className="h-3.5 w-3.5 text-[#F62440] dark:text-[#FF4D63]" />
                </span>
                <span className="hidden sm:inline">{formatAddress(walletAddress)}</span>
                <ChevronDown className={`h-3.5 w-3.5 text-[#9A7F65] transition-transform ${menuOpen ? 'rotate-180' : ''}`} />
              </button>

              {menuOpen && (
                <div className="absolute right-0 mt-2 w-52 rounded-xl border bg-white dark:bg-[#1A1714] shadow-card-md py-1.5 animate-fade-in"
                  style={{ borderColor: '#F0D9B5' }}>
                  <Link
                    href={`/trust/${walletAddress}`}
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-[#3D2E16] dark:text-[#D4C4B0] hover:bg-[#FFF2DB] dark:hover:bg-[#221E1A] transition-colors"
                  >
                    <Shield className="h-4 w-4 text-[#F62440]" />
                    Trust Passport
                  </Link>
                  <div className="my-1 border-t" style={{ borderColor: '#F0D9B5' }} />
                  <button
                    onClick={() => { logout(); setMenuOpen(false); }}
                    className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                  >
                    <LogOut className="h-4 w-4" />
                    Disconnect
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Button onClick={login} size="md">
              Connect Wallet
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}

function NavLink({ href, icon, label, active }) {
  return (
    <Link
      href={href}
      className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
        active
          ? 'bg-[#FFE5BF] dark:bg-[#2D2822] text-[#F62440] dark:text-[#FF4D63]'
          : 'text-[#6B5744] dark:text-[#9A8470] hover:bg-[#FFF2DB] dark:hover:bg-[#221E1A] hover:text-[#3D2E16] dark:hover:text-[#F5EDE0]'
      }`}
    >
      {icon}
      {label}
    </Link>
  );
}
