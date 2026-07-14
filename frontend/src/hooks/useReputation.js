import { useReadContract } from "wagmi";
import { CONTRACTS } from "@/config/contracts";
import { ReputationABI } from "@/abi/ReputationABI";

/**
 * ===========================
 * Reputation Registry Hooks
 * ===========================
 */

/**
 * Client Trust Score
 */
export function useClientScore(wallet) {
  return useReadContract({
    address: CONTRACTS.REPUTATION,
    abi: ReputationABI,
    functionName: "getClientScore",
    args: [wallet],
    query: {
      enabled: !!wallet,
    },
  });
}

/**
 * Freelancer Trust Score
 */
export function useFreelancerScore(wallet) {
  return useReadContract({
    address: CONTRACTS.REPUTATION,
    abi: ReputationABI,
    functionName: "getFreelancerScore",
    args: [wallet],
    query: {
      enabled: !!wallet,
    },
  });
}

/**
 * Juror Trust Score
 */
export function useJurorScore(wallet) {
  return useReadContract({
    address: CONTRACTS.REPUTATION,
    abi: ReputationABI,
    functionName: "getJurorScore",
    args: [wallet],
    query: {
      enabled: !!wallet,
    },
  });
}

/**
 * Client Passport
 */
export function useClientPassport(wallet) {
  return useReadContract({
    address: CONTRACTS.REPUTATION,
    abi: ReputationABI,
    functionName: "getClientPassport",
    args: [wallet],
    query: {
      enabled: !!wallet,
    },
  });
}

/**
 * Freelancer Passport
 */
export function useFreelancerPassport(wallet) {
  return useReadContract({
    address: CONTRACTS.REPUTATION,
    abi: ReputationABI,
    functionName: "getFreelancerPassport",
    args: [wallet],
    query: {
      enabled: !!wallet,
    },
  });
}

/**
 * Juror Passport
 */
export function useJurorPassport(wallet) {
  return useReadContract({
    address: CONTRACTS.REPUTATION,
    abi: ReputationABI,
    functionName: "getJurorPassport",
    args: [wallet],
    query: {
      enabled: !!wallet,
    },
  });
}