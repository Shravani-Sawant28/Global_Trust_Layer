/**
 * Privy configuration object.
 *
 * Pass this to <PrivyProvider config={privyConfig}> in layout.jsx.
 *
 * Auth methods enabled:
 *  - Email OTP (passwordless)
 *  - Google OAuth
 *  - GitHub OAuth
 *  - MetaMask / external wallets
 *  - Privy embedded wallet (auto-created for email/social users)
 *
 * TODO: Set NEXT_PUBLIC_PRIVY_APP_ID in .env.local before running.
 */
export const privyConfig = {
  loginMethods: ['email', 'google', 'github', 'wallet'],

  appearance: {
    theme: 'light',
    accentColor: '#6366F1',
    logo: '/logo.svg',
    showWalletLoginFirst: false,
  },

  embeddedWallets: {
    createOnLogin: 'users-without-wallets', // Auto-create for email/social users
    requireUserPasswordOnCreate: false,
    noPromptOnSignature: false,
  },

  // Arbitrum Sepolia as the default network
  defaultChain: {
    id: 421614,
    name: 'Arbitrum Sepolia',
    network: 'arbitrum-sepolia',
    nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
    rpcUrls: {
      default: { http: [process.env.NEXT_PUBLIC_RPC_URL || 'https://sepolia-rollup.arbitrum.io/rpc'] },
    },
    blockExplorers: {
      default: { name: 'Arbiscan', url: 'https://sepolia.arbiscan.io' },
    },
    testnet: true,
  },

  supportedChains: [
    {
      id: 421614,
      name: 'Arbitrum Sepolia',
      network: 'arbitrum-sepolia',
      nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
      rpcUrls: {
        default: { http: [process.env.NEXT_PUBLIC_RPC_URL || 'https://sepolia-rollup.arbitrum.io/rpc'] },
      },
      blockExplorers: {
        default: { name: 'Arbiscan', url: 'https://sepolia.arbiscan.io' },
      },
      testnet: true,
    },
  ],
};
