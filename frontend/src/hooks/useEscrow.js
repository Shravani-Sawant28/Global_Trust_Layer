import {
  useWriteContract,
  useWaitForTransactionReceipt,
  useReadContract,
} from "wagmi";
import { CONTRACTS } from "@/config/contracts";
import { EscrowABI } from "@/abi/EscrowABI";

/**
 * useEscrow — wagmi hooks for interacting with the GTL Stylus Escrow contract.
 */
export function useCreateEscrow() {
  const { writeContract, data: hash, isPending, error } = useWriteContract();

  const {
    data: receipt,
    isLoading: isConfirming,
    isSuccess,
  } = useWaitForTransactionReceipt({
    hash,
  });

  /**
   * createEscrow — locks funds and creates an escrow on-chain.
   *
   * @param {object} params
   * @param {string}   params.freelancer       - Freelancer wallet address (or '0x0...0' for public)
   * @param {string}   params.deadline         - ISO date string
   * @param {number[]} params.milestoneAmounts - Array of amounts in currency units (empty for single job)
   * @param {'ETH'|'USDC'} params.currency    - Payment currency
   * @param {string}   params.totalAmount      - Total budget as string (e.g. '1.5')
   */
  const createEscrow = ({
  freelancer,
  title,
  milestoneDescriptions,
  milestoneAmounts,
  durationSeconds,
}) => {
    
    writeContract({
      address: CONTRACTS.ESCROW,
      abi: EscrowABI,
      functionName: "createJob",
      args: [
        freelancer,
        title,
        milestoneDescriptions,
        milestoneAmounts.map((a) => BigInt(a)),
        BigInt(durationSeconds),
      ],
    });
  };

  return {
    createEscrow,
    hash,
    receipt,
    isPending,
    isConfirming,
    isSuccess,
    error,
  };
}

export function useFundJob() {
  const { writeContract, data: hash, isPending, error } =
    useWriteContract();

  const {
    isLoading: isConfirming,
    isSuccess,
  } = useWaitForTransactionReceipt({
    hash,
  });

  const fundJob = (jobId) => {
    writeContract({
      address: CONTRACTS.ESCROW,
      abi: EscrowABI,
      functionName: "fundJob",
      args: [BigInt(jobId)],
    });
  };

  return {
    fundJob,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    error,
  };
}

export function useAcceptJob() {
  const { writeContract, data: hash, isPending, error } =
    useWriteContract();

  const {
    isLoading: isConfirming,
    isSuccess,
  } = useWaitForTransactionReceipt({
    hash,
  });

  const acceptJob = (jobId) => {
    writeContract({
      address: CONTRACTS.ESCROW,
      abi: EscrowABI,
      functionName: "acceptJob",
      args: [BigInt(jobId)],
    });
  };

  return {
    acceptJob,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    error,
  };
}

export function useDeliverMilestone() {
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } =
    useWaitForTransactionReceipt({ hash });

  const deliverMilestone = (
    jobId,
    milestoneId,
    deliveryHash
  ) => {
    writeContract({
      address: CONTRACTS.ESCROW,
      abi: EscrowABI,
      functionName: "markDelivered",
      args: [
        BigInt(jobId),
        BigInt(milestoneId),
        deliveryHash,
      ],
    });
  };

  return {
    deliverMilestone,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    error,
  };
}

export function useReleaseMilestone() {
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } =
    useWaitForTransactionReceipt({ hash });

  const releaseMilestone = (
    jobId,
    milestoneId
  ) => {
    writeContract({
      address: CONTRACTS.ESCROW,
      abi: EscrowABI,
      functionName: "releaseMilestone",
      args: [
        BigInt(jobId),
        BigInt(milestoneId),
      ],
    });
  };

  return {
    releaseMilestone,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    error,
  };
}

export function useRaiseDispute() {
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } =
    useWaitForTransactionReceipt({ hash });

  const raiseDispute = (
    jobId,
    milestoneId,
    reason
  ) => {
    writeContract({
      address: CONTRACTS.ESCROW,
      abi: EscrowABI,
      functionName: "raiseDispute",
      args: [
        BigInt(jobId),
        BigInt(milestoneId),
        reason,
      ],
    });
  };

  return {
    raiseDispute,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    error,
  };
}


export function useAgreeToSplit() {
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } =
    useWaitForTransactionReceipt({ hash });

  const agreeToSplit = (
    disputeId,
    milestoneId,
    clientBps
  ) => {
    writeContract({
      address: CONTRACTS.ESCROW,
      abi: EscrowABI,
      functionName: "agreeToSplit",
      args: [
          BigInt(disputeId),
          BigInt(milestoneId),
          BigInt(clientBps),
      ],
    });
  };

  return {
    agreeToSplit,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    error,
  };
}

export function useJobCount() {
  return useReadContract({
    address: CONTRACTS.ESCROW,
    abi: EscrowABI,
    functionName: "jobCounter",
  });
}

export function useJobBasic(jobId) {
  return useReadContract({
    address: CONTRACTS.ESCROW,
    abi: EscrowABI,
    functionName: "getJob",
    args: [BigInt(jobId)],
    query: {
      enabled: jobId !== undefined && jobId !== null,
    },
  });
}

export function useMilestone(jobId, milestoneId) {
  return useReadContract({
    address: CONTRACTS.ESCROW,
    abi: EscrowABI,
    functionName: "getMilestone",
    args: [BigInt(jobId), BigInt(milestoneId)],
    query: {
      enabled:
        jobId !== undefined &&
        milestoneId !== undefined &&
        jobId !== null &&
        milestoneId !== null,
    },
  });
}

