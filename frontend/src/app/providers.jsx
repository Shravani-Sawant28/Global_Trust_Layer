'use client';

import { PrivyProvider } from '@privy-io/react-auth';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { WagmiProvider } from 'wagmi';
import { ThemeProvider } from '@/context/ThemeContext';
import { AppProvider } from '@/context/AppContext';
import { wagmiConfig } from '@/lib/wagmiConfig';
import { privyConfig } from '@/lib/privyConfig';
import Navbar from '@/components/layout/Navbar';
import { useState } from 'react';

/**
 * ClientProviders — client-only wrapper for all interactive providers.
 * Extracted from layout.jsx so the root layout can remain a server component.
 */
export default function ClientProviders({ children }) {
  // Stable QueryClient instance (avoids re-creation on re-renders)
  const [queryClient] = useState(() => new QueryClient());

  return (
    <ThemeProvider>
      <PrivyProvider
        appId={process.env.NEXT_PUBLIC_PRIVY_APP_ID}
        config={privyConfig}
      >
        <WagmiProvider config={wagmiConfig}>
          <QueryClientProvider client={queryClient}>
            <AppProvider>
              <Navbar />
              {children}
            </AppProvider>
          </QueryClientProvider>
        </WagmiProvider>
      </PrivyProvider>
    </ThemeProvider>
  );
}
