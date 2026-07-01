import { useReadContract } from 'wagmi';
import { CONTRACT_ADDRESSES, REPUTATION_REGISTRY_ABI } from '@/lib/contracts';
import { MOCK_PROFILES } from '@/lib/mockData';

/**
 * useReputation — reads trust data from the on-chain ReputationRegistry.
 *
 * Falls back to mock data when the contract address is the zero address
 * (i.e., not yet deployed). This allows the frontend to work fully
 * offline during development.
 */

const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';
const isDeployed   = CONTRACT_ADDRESSES.REPUTATION_REGISTRY !== ZERO_ADDRESS;

/**
 * Returns the full reputation profile for a wallet.
 * Fallback: MOCK_PROFILES[wallet] if contract not deployed.
 */
export function useProfile(wallet) {
  const onChain = useReadContract({
    address:      CONTRACT_ADDRESSES.REPUTATION_REGISTRY,
    abi:          REPUTATION_REGISTRY_ABI,
    functionName: 'getProfile',
    args:         [wallet],
    enabled:      !!wallet && isDeployed,
  });

  if (!isDeployed) {
    const mock = MOCK_PROFILES[wallet] || {
      trustScore:    0,
      jobsCompleted: 0,
      disputeCount:  0,
      totalEarned:   0n,
      memberSince:   BigInt(Math.floor(Date.now() / 1000)),
    };
    return { data: mock, isLoading: false, error: null };
  }

  return onChain;
}

/**
 * Returns just the trust score (0–100) for a wallet.
 * Useful for badges on job cards and tables.
 */
export function useTrustScore(wallet) {
  const onChain = useReadContract({
    address:      CONTRACT_ADDRESSES.REPUTATION_REGISTRY,
    abi:          REPUTATION_REGISTRY_ABI,
    functionName: 'getTrustScore',
    args:         [wallet],
    enabled:      !!wallet && isDeployed,
  });

  if (!isDeployed) {
    const mock = MOCK_PROFILES[wallet];
    return { data: mock?.trustScore ?? 0, isLoading: false, error: null };
  }

  return onChain;
}

/**
 * Returns aggregate stats for a wallet.
 */
export function useStats(wallet) {
  const onChain = useReadContract({
    address:      CONTRACT_ADDRESSES.REPUTATION_REGISTRY,
    abi:          REPUTATION_REGISTRY_ABI,
    functionName: 'getStats',
    args:         [wallet],
    enabled:      !!wallet && isDeployed,
  });

  if (!isDeployed) {
    const mock = MOCK_PROFILES[wallet];
    return {
      data: {
        totalJobs:     (mock?.jobsCompleted || 0) + (mock?.disputeCount || 0),
        completedJobs:  mock?.jobsCompleted || 0,
        disputeCount:   mock?.disputeCount  || 0,
        disputeRate:    mock ? Math.round((mock.disputeCount / (mock.jobsCompleted + mock.disputeCount || 1)) * 10000) : 0,
      },
      isLoading: false,
      error: null,
    };
  }

  return onChain;
}
