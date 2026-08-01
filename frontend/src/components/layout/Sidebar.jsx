'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { usePrivy } from '@privy-io/react-auth';
import { useRole } from '@/hooks/useRole';
import { formatAddress } from '@/lib/utils';
import {
  LayoutDashboard,
  Briefcase,
  Search,
  Shield,
  AlertTriangle,
  Settings,
  ChevronRight,
} from 'lucide-react';
import MintUSDCButton from '@/components/ui/MintUSDCButton';

const CLIENT_LINKS = [
  { href: '/dashboard',    icon: LayoutDashboard, label: 'Dashboard'   },
  { href: '/jobs/create',  icon: Briefcase,       label: 'Post a Job'  },
];

const FREELANCER_LINKS = [
  { href: '/dashboard',   icon: LayoutDashboard, label: 'Dashboard'    },
  { href: '/jobs/browse', icon: Search,           label: 'Browse Jobs' },
];

const SHARED_LINKS = [
  { href: '/dispute',  icon: AlertTriangle, label: 'Disputes'      },
];

export default function Sidebar() {
  const pathname     = usePathname();
  const { user }     = usePrivy();
  const { isClient, isFreelancer } = useRole();

  const walletAddress =
    user?.wallet?.address ||
    user?.linkedAccounts?.find((a) => a.type === 'wallet')?.address;

  const links = isClient ? CLIENT_LINKS : isFreelancer ? FREELANCER_LINKS : [];
  const allLinks = [...links, ...SHARED_LINKS];

  return (
    <aside className="flex h-full w-60 flex-col border-r border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950">
      {/* Trust passport shortcut */}
      {walletAddress && (
        <Link
          href={`/trust/${walletAddress}`}
          className="m-3 flex items-center gap-3 rounded-xl bg-brand-50 dark:bg-brand-900/20 border border-brand-100 dark:border-brand-800/40 px-4 py-3 hover:bg-brand-100 dark:hover:bg-brand-900/30 transition-colors"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-500">
            <Shield className="h-4.5 w-4.5 text-white" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold text-brand-600 dark:text-brand-400">Trust Passport</p>
            <p className="truncate text-xs text-brand-500/70 dark:text-brand-500/60">
              {formatAddress(walletAddress)}
            </p>
          </div>
          <ChevronRight className="h-4 w-4 text-brand-400" />
        </Link>
      )}

      {/* Navigation */}
      <nav className="flex-1 px-3 py-2 space-y-0.5">
        {allLinks.map(({ href, icon: Icon, label }) => {
          const active = pathname === href || pathname.startsWith(href + '/');
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                active
                  ? 'bg-brand-50 dark:bg-brand-900/20 text-brand-600 dark:text-brand-400'
                  : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <Icon className={`h-4.5 w-4.5 ${active ? 'text-brand-500' : 'text-gray-400 dark:text-gray-500'}`} />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Bottom settings link */}
      <div className="border-t border-gray-100 dark:border-gray-800 p-3">
        <MintUSDCButton />
        <Link href="/settings"
          className="flex items-center gap-3 rounded-lg px-3 py-2.5 mt-2 text-sm font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
        >
          <Settings className="h-4.5 w-4.5" />
          Settings
        </Link>
      </div>
    </aside>
  );
}
