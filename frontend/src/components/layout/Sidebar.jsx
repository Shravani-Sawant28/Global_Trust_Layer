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
    <aside className="flex h-full w-60 flex-col border-r bg-[#FFFAF3] dark:bg-[#0F0D0B]"
      style={{ borderColor: '#F0D9B5' }}>

      {/* Trust passport shortcut */}
      {walletAddress && (
        <Link
          href={`/trust/${walletAddress}`}
          className="m-3 flex items-center gap-3 rounded-xl border px-4 py-3 hover:bg-[#FFE5BF] dark:hover:bg-[#2D2822] transition-colors group"
          style={{ backgroundColor: '#FFF2DB', borderColor: '#F0D9B5' }}
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#F62440] shadow-brand flex-shrink-0">
            <Shield className="h-4 w-4 text-white" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold text-[#F62440] dark:text-[#FF4D63]">Trust Passport</p>
            <p className="truncate text-xs text-[#9A7F65] dark:text-[#6B5A4A]">
              {formatAddress(walletAddress)}
            </p>
          </div>
          <ChevronRight className="h-4 w-4 text-[#C8A87A] dark:text-[#6B5A4A] flex-shrink-0 group-hover:text-[#F62440] transition-colors" />
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
                  ? 'bg-[#FFE5BF] dark:bg-[#2D2822] text-[#F62440] dark:text-[#FF4D63]'
                  : 'text-[#6B5744] dark:text-[#9A8470] hover:bg-[#FFF2DB] dark:hover:bg-[#221E1A] hover:text-[#3D2E16] dark:hover:text-[#F5EDE0]'
              }`}
            >
              <Icon className={`h-4 w-4 flex-shrink-0 ${
                active ? 'text-[#F62440] dark:text-[#FF4D63]' : 'text-[#C8A87A] dark:text-[#6B5A4A]'
              }`} />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Bottom settings link */}
      <div className="border-t p-3" style={{ borderColor: '#F0D9B5' }}>
        <MintUSDCButton />
        <Link href="/settings"
          className="flex items-center gap-3 rounded-lg px-3 py-2.5 mt-2 text-sm font-medium text-[#9A7F65] dark:text-[#6B5A4A] hover:bg-[#FFF2DB] dark:hover:bg-[#221E1A] hover:text-[#3D2E16] dark:hover:text-[#F5EDE0] transition-colors"
        >
          <Settings className="h-4 w-4 text-[#C8A87A] dark:text-[#4A3E32]" />
          Settings
        </Link>
      </div>
    </aside>
  );
}
