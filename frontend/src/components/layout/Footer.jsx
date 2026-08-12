import Link from 'next/link';
import { Shield, Github, Twitter, ExternalLink } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="border-t bg-[#FFFAF3] dark:bg-[#0F0D0B]" style={{ borderColor: '#F0D9B5' }}>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">

          {/* Brand */}
          <div className="md:col-span-1">
            <Link href="/" className="flex items-center gap-2.5 mb-4">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#F62440]">
                <Shield className="h-4 w-4 text-white" />
              </div>
              <span className="text-base font-bold text-[#1C1410] dark:text-[#F5EDE0]">
                Global<span className="text-[#F62440]">Trust</span>
              </span>
            </Link>
            <p className="text-sm text-[#9A7F65] dark:text-[#6B5A4A] leading-relaxed">
              Decentralized trust infrastructure for cross-border freelance work. Built on Arbitrum.
            </p>
          </div>

          {/* Protocol */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-[#C8A87A] dark:text-[#6B5A4A] mb-4">Protocol</h3>
            <ul className="space-y-2.5">
              {[
                { label: 'How It Works', href: '/#how-it-works' },
                { label: 'Trust Passport', href: '/#features' },
                { label: 'Dispute System', href: '/#features' },
                { label: 'Reputation Registry', href: '/#features' },
              ].map((item) => (
                <li key={item.label}>
                  <Link href={item.href} className="text-sm text-[#9A7F65] dark:text-[#6B5A4A] hover:text-[#F62440] dark:hover:text-[#FF4D63] transition-colors">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Developers */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-[#C8A87A] dark:text-[#6B5A4A] mb-4">Developers</h3>
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
                    className="inline-flex items-center gap-1 text-sm text-[#9A7F65] dark:text-[#6B5A4A] hover:text-[#F62440] dark:hover:text-[#FF4D63] transition-colors"
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
            <h3 className="text-xs font-semibold uppercase tracking-wider text-[#C8A87A] dark:text-[#6B5A4A] mb-4">Network</h3>
            <div className="flex items-center gap-2 rounded-lg border px-3 py-2"
              style={{ backgroundColor: '#FFF2DB', borderColor: '#F0D9B5' }}>
              <span className="h-2 w-2 rounded-full bg-green-400 animate-pulse-slow flex-shrink-0" />
              <span className="text-xs font-medium text-[#3D2E16] dark:text-[#D4C4B0]">Arbitrum Sepolia</span>
            </div>
            <div className="mt-3 flex gap-2">
              <a href="https://github.com" target="_blank" rel="noopener noreferrer"
                className="rounded-lg p-2 text-[#C8A87A] dark:text-[#6B5A4A] hover:text-[#3D2E16] dark:hover:text-[#D4C4B0] hover:bg-[#FFE5BF] dark:hover:bg-[#2D2822] transition-colors">
                <Github className="h-4 w-4" />
              </a>
              <a href="https://twitter.com" target="_blank" rel="noopener noreferrer"
                className="rounded-lg p-2 text-[#C8A87A] dark:text-[#6B5A4A] hover:text-[#3D2E16] dark:hover:text-[#D4C4B0] hover:bg-[#FFE5BF] dark:hover:bg-[#2D2822] transition-colors">
                <Twitter className="h-4 w-4" />
              </a>
            </div>
          </div>
        </div>

        <div className="mt-10 border-t pt-6 flex flex-col sm:flex-row items-center justify-between gap-4"
          style={{ borderColor: '#F0D9B5' }}>
          <p className="text-xs text-[#C8A87A] dark:text-[#6B5A4A]">
            © 2026 Global Trust Layer. Open-source protocol on Arbitrum.
          </p>
          <p className="text-xs text-[#C8A87A] dark:text-[#6B5A4A]">
            Contracts audited · 2% protocol fee · Non-custodial
          </p>
        </div>
      </div>
    </footer>
  );
}
