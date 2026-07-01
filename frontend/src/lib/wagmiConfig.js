import { http, createConfig } from 'wagmi';
import { arbitrumSepolia } from 'wagmi/chains';

/**
 * wagmi v2 config for Arbitrum Sepolia testnet.
 *
 * Transport uses the public RPC. Swap NEXT_PUBLIC_RPC_URL in .env.local
 * for a dedicated Alchemy / Infura endpoint before going to production.
 *
 * NOTE: Privy manages the actual wallet connection; this config is used
 * for contract reads (useReadContract) that don't require a signer.
 */
export const wagmiConfig = createConfig({
  chains: [arbitrumSepolia],
  transports: {
    [arbitrumSepolia.id]: http(
      process.env.NEXT_PUBLIC_RPC_URL ||
      'https://sepolia-rollup.arbitrum.io/rpc'
    ),
  },
  ssr: true, // Required for Next.js App Router
});

export { arbitrumSepolia };
