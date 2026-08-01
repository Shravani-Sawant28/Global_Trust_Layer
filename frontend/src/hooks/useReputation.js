
import { useReadContract } from "wagmi";
import { CONTRACTS } from "@/config/contracts";
import { ReputationABI } from "@/abi/ReputationABI";

/**
 * ===========================
 * Reputation Registry Hooks
 * ===========================
 */

/**
 * Trust Score
 */
export function useTrustScore(wallet) {
  return useReadContract({
    address: CONTRACTS.REPUTATION,
    abi: ReputationABI,
    functionName: "getTrustScore",
    args: [wallet],
    query: {
      enabled: !!wallet,
    },
  });
}

export const useClientScore = useTrustScore;
export const useFreelancerScore = useTrustScore;

/**
 * Passport (Profile)
 */
export function useProfile(wallet) {
  return useReadContract({
    address: CONTRACTS.REPUTATION,
    abi: ReputationABI,
    functionName: "getPassport",
    args: [wallet],
    query: {
      enabled: !!wallet,
    },
  });
}

/**
 * Job History
 */
export function useJobHistory(wallet) {
  return useReadContract({
    address: CONTRACTS.REPUTATION,
    abi: ReputationABI,
    functionName: "getJobHistory",
    args: [wallet],
    query: {
      enabled: !!wallet,
    },
  });
}

/**
 * Is New Wallet
 */
export function useIsNewWallet(wallet) {
  return useReadContract({
    address: CONTRACTS.REPUTATION,
    abi: ReputationABI,
    functionName: "isNewWallet",
    args: [wallet],
    query: {
      enabled: !!wallet,
    },
  });
}