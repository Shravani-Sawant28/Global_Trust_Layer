import Link from 'next/link';
import { Shield, Github, Twitter, ExternalLink } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">

          {/* Brand */}
          <div className="md:col-span-1">
            <Link href="/" className="flex items-center gap-2.5 mb-4">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-500">
                <Shield className="h-4.5 w-4.5 text-white" />
              </div>
              <span className="text-base font-bold text-gray-900 dark:text-white">
                Global<span className="text-brand-500">Trust</span>
              </span>
            </Link>
            <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
              Decentralized trust infrastructure for cross-border freelance work. Built on Arbitrum.
            </p>
          </div>

          {/* Protocol */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-4">Protocol</h3>
            <ul className="space-y-2.5">
              {[
                { label: 'How It Works', href: '/#how-it-works' },
                { label: 'Trust Passport', href: '/#features' },
                { label: 'Dispute System', href: '/#features' },
                { label: 'Reputation Registry', href: '/#features' },
              ].map((item) => (
                <li key={item.label}>
                  <Link href={item.href} className="text-sm text-gray-500 dark:text-gray-400 hover:text-brand-500 dark:hover:text-brand-400 transition-colors">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Developers */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-4">Developers</h3>
            <ul className="space-y-2.5">
              {[
                { label: 'GitHub', href: 'https://github.com', external: true },
                { label: 'Smart Contracts', href: 'https://sepolia.arbiscan.io', external: true },
                { label: 'API Docs', href: '#', external: false },
              ].map((item) => (
                <li key={item.label}>
                  <a
                    href={item.href}
                    target={item.external ? '_blank' : undefined}
                    rel={item.external ? 'noopener noreferrer' : undefined}
                    className="inline-flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400 hover:text-brand-500 dark:hover:text-brand-400 transition-colors"
                  >
                    {item.label}
                    {item.external && <ExternalLink className="h-3 w-3" />}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Network */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-4">Network</h3>
            <div className="flex items-center gap-2 rounded-lg bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 px-3 py-2">
              <span className="h-2 w-2 rounded-full bg-green-400 animate-pulse-slow" />
              <span className="text-xs font-medium text-gray-600 dark:text-gray-300">Arbitrum Sepolia</span>
            </div>
            <div className="mt-3 flex gap-2">
              <a href="https://github.com" target="_blank" rel="noopener noreferrer"
                className="rounded-lg p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                <Github className="h-4 w-4" />
              </a>
              <a href="https://twitter.com" target="_blank" rel="noopener noreferrer"
                className="rounded-lg p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                <Twitter className="h-4 w-4" />
              </a>
            </div>
          </div>
        </div>

        <div className="mt-10 border-t border-gray-100 dark:border-gray-800 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-gray-400 dark:text-gray-500">
            © 2026 Global Trust Layer. Open-source protocol on Arbitrum.
          </p>
          <p className="text-xs text-gray-400 dark:text-gray-500">
            Contracts audited · 2% protocol fee · Non-custodial
          </p>
        </div>
      </div>
    </footer>
  );
}
