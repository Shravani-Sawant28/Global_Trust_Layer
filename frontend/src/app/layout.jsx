import './globals.css';
import { Inter } from 'next/font/google';
import { Toaster } from 'react-hot-toast';
import ClientProviders from './providers';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'GlobalTrust — Trust Protocol for Cross-Border Work',
  description:
    'Decentralized escrow, on-chain reputation, and AI-powered risk analysis. Freelance globally without trusting anyone blindly.',
  keywords: ['freelance', 'escrow', 'blockchain', 'arbitrum', 'web3', 'trust', 'reputation'],
  openGraph: {
    title: 'GlobalTrust — Trust Protocol for Cross-Border Work',
    description: 'Lock funds. Prove work. Build reputation. All on-chain.',
    type: 'website',
  },
};

/**
 * Root layout — Server Component (Next.js 15 App Router).
 * All client-only providers are isolated in providers.jsx (ClientProviders).
 * This keeps the root layout as a pure server component for best performance.
 */
export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.className} bg-[#FFFAF3] dark:bg-[#0F0D0B] text-[#1C1410] dark:text-[#F5EDE0] antialiased`}>
        <ClientProviders>
          <Toaster
            position="top-right"
            toastOptions={{ style: { background: 'transparent', boxShadow: 'none', padding: 0 } }}
          />
          <main className="min-h-[calc(100vh-4rem)]">
            {children}
          </main>
        </ClientProviders>
      </body>
    </html>
  );
}
