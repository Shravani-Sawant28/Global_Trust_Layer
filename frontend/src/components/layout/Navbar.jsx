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
    <header className="sticky top-0 z-40 w-full border-b border-gray-200/80 dark:border-gray-800/80 bg-white/80 dark:bg-gray-950/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">

        {/* ── Logo ── */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-500 shadow-brand group-hover:shadow-brand-lg transition-shadow">
            <Shield className="h-4.5 w-4.5 text-white" />
          </div>
          <span className="text-base font-bold text-gray-900 dark:text-white tracking-tight">
            Global<span className="text-brand-500">Trust</span>
          </span>
        </Link>

        {/* ── Nav Links (authenticated) ── */}
        {authenticated && (
          <nav className="hidden md:flex items-center gap-1">
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
            className="rounded-lg p-2 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            {theme === 'dark' ? <Sun className="h-4.5 w-4.5" /> : <Moon className="h-4.5 w-4.5" />}
          </button>

          {!ready ? (
            <div className="h-9 w-28 animate-pulse rounded-xl bg-gray-100 dark:bg-gray-800" />
          ) : authenticated && walletAddress ? (
            /* Wallet menu */
            <div className="relative">
              <button
                onClick={() => setMenuOpen((v) => !v)}
                className="flex items-center gap-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                <span className="h-6 w-6 rounded-full bg-brand-100 dark:bg-brand-900/40 flex items-center justify-center">
                  <Shield className="h-3.5 w-3.5 text-brand-600 dark:text-brand-400" />
                </span>
                {formatAddress(walletAddress)}
                <ChevronDown className={`h-3.5 w-3.5 text-gray-400 transition-transform ${menuOpen ? 'rotate-180' : ''}`} />
              </button>

              {menuOpen && (
                <div className="absolute right-0 mt-2 w-52 rounded-xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-card-md py-1 animate-fade-in">
                  <Link
                    href={`/trust/${walletAddress}`}
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800"
                  >
                    <Shield className="h-4 w-4 text-brand-500" />
                    Trust Passport
                  </Link>
                  <div className="my-1 border-t border-gray-100 dark:border-gray-800" />
                  <button
                    onClick={() => { logout(); setMenuOpen(false); }}
                    className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
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
          ? 'bg-brand-50 dark:bg-brand-900/20 text-brand-600 dark:text-brand-400'
          : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white'
      }`}
    >
      {icon}
      {label}
    </Link>
  );
}
