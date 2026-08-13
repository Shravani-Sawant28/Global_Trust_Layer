import {
  useWriteContract,
  useWaitForTransactionReceipt,
  useReadContract,
  usePublicClient,
  useAccount,
} from "wagmi";
import { parseEther } from "viem";
import toast from "react-hot-toast";
import { CONTRACTS } from "@/config/contracts";
import { EscrowABI } from "@/abi/EscrowABI";

const MIN_ETH = parseEther("0.005");

function useSafeEscrowWrite() {
  const publicClient = usePublicClient();
  const { address } = useAccount();
  const { writeContractAsync, data: hash, isPending, error } = useWriteContract();
  const { data: receipt, isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const executeSafe = async (functionName, args) => {
    if (!address) {
      toast.error("Wallet not connected");
      return;
    }
    
    // 1. Balance Check
    try {
      const balance = await publicClient.getBalance({ address });
      if (balance < MIN_ETH) {
        toast.error("Insufficient testnet ETH on Arbitrum Sepolia for gas (min 0.005 ETH).");
        return;
      }
    } catch (e) {
      console.error("Balance check failed", e);
    }

    // 2. Simulate
    let request;
    try {
      const sim = await publicClient.simulateContract({
        address: CONTRACTS.ESCROW,
        abi: EscrowABI,
        functionName,
        args,
        account: address,
      });
      request = sim.request;
    } catch (error) {
      console.error("Simulation error", error);
      const errorMsg = error.cause?.data?.errorName || error.shortMessage || error.details || error.message || "Unknown revert reason";
      toast.error(`Simulation failed: ${errorMsg}`);
      return;
    }

    // 3. Execute
    try {
      const txHash = await writeContractAsync(request);
      return txHash;
    } catch (error) {
      console.error("Execution error", error);
      toast.error(`Transaction failed: ${error.shortMessage || error.message}`);
    }
  };

  return { executeSafe, hash, receipt, isPending, isConfirming, isSuccess, error };
}

export function useCreateEscrow() {
  const { executeSafe, hash, receipt, isPending, isConfirming, isSuccess, error } = useSafeEscrowWrite();

  const createEscrow = async ({
    freelancer,
    title,
    milestoneDescriptions,
    milestoneAmounts,
    durationSeconds,
  }) => {
    await executeSafe("createJob", [
      freelancer,
      title,
      milestoneDescriptions,
      milestoneAmounts.map((a) => BigInt(a)),
      BigInt(durationSeconds),
    ]);
  };

  return { createEscrow, hash, receipt, isPending, isConfirming, isSuccess, error };
}

export function useFundJob() {
  const { executeSafe, hash, isPending, isConfirming, isSuccess, error } = useSafeEscrowWrite();

  const fundJob = async (jobId) => {
    if (jobId === undefined || jobId === null || jobId === '') {
      console.error("fundJob called with invalid jobId:", jobId);
      return;
    }
    await executeSafe("fundJob", [BigInt(jobId)]);
  };

  return { fundJob, hash, isPending, isConfirming, isSuccess, error };
}

export function useAcceptJob() {
  const { executeSafe, hash, isPending, isConfirming, isSuccess, error } = useSafeEscrowWrite();

  const acceptJob = async (jobId) => {
    if (jobId === undefined || jobId === null || jobId === '') {
      console.error("acceptJob called with invalid jobId:", jobId);
      return;
    }
    await executeSafe("acceptJob", [BigInt(jobId)]);
  };

  return { acceptJob, hash, isPending, isConfirming, isSuccess, error };
}

export function useDeliverMilestone() {
  const { executeSafe, hash, isPending, isConfirming, isSuccess, error } = useSafeEscrowWrite();

  const deliverMilestone = async (jobId, milestoneId, deliveryHash) => {
    if (jobId === undefined || jobId === null || jobId === '' || milestoneId === undefined || milestoneId === null) {
      console.error("deliverMilestone called with invalid parameters:", { jobId, milestoneId });
      return;
    }
    await executeSafe("markDelivered", [BigInt(jobId), BigInt(milestoneId), deliveryHash]);
  };

  return { deliverMilestone, hash, isPending, isConfirming, isSuccess, error };
}

export function useReleaseMilestone() {
  const { executeSafe, hash, isPending, isConfirming, isSuccess, error } = useSafeEscrowWrite();

  const releaseMilestone = async (jobId, milestoneId) => {
    if (jobId === undefined || jobId === null || jobId === '' || milestoneId === undefined || milestoneId === null) {
      console.error("releaseMilestone called with invalid parameters:", { jobId, milestoneId });
      return;
    }
    await executeSafe("releaseMilestone", [BigInt(jobId), BigInt(milestoneId)]);
  };

  return { releaseMilestone, hash, isPending, isConfirming, isSuccess, error };
}

export function useRaiseDispute() {
  const { executeSafe, hash, isPending, isConfirming, isSuccess, error } = useSafeEscrowWrite();

  const raiseDispute = async (jobId, milestoneId, reason) => {
    if (jobId === undefined || jobId === null || jobId === '' || milestoneId === undefined || milestoneId === null) {
      console.error("raiseDispute called with invalid parameters:", { jobId, milestoneId });
      return;
    }
    await executeSafe("raiseDispute", [BigInt(jobId), BigInt(milestoneId), reason]);
  };

  return { raiseDispute, hash, isPending, isConfirming, isSuccess, error };
}

export function useAgreeToSplit() {
  const { executeSafe, hash, isPending, isConfirming, isSuccess, error } = useSafeEscrowWrite();

  const agreeToSplit = async (disputeId, milestoneId, clientBps) => {
    if (disputeId === undefined || disputeId === null || disputeId === '' || milestoneId === undefined || milestoneId === null || clientBps === undefined || clientBps === null) {
      console.error("agreeToSplit called with invalid parameters:", { disputeId, milestoneId, clientBps });
      return;
    }
    await executeSafe("agreeToSplit", [BigInt(disputeId), BigInt(milestoneId), BigInt(clientBps)]);
  };

  return { agreeToSplit, hash, isPending, isConfirming, isSuccess, error };
}

export function useJobCount() {
  return useReadContract({
    address: CONTRACTS.ESCROW,
    abi: EscrowABI,
    functionName: "jobCounter",
  });
}

export function useJobBasic(jobId) {
  const isValid = jobId !== undefined && jobId !== null && jobId !== '' && !isNaN(Number(jobId));
  return useReadContract({
    address: CONTRACTS.ESCROW,
    abi: EscrowABI,
    functionName: "getJob",
    args: isValid ? [BigInt(jobId)] : undefined,
    query: {
      enabled: isValid,
    },
  });
}

export function useMilestone(jobId, milestoneId) {
  const isValid =
    jobId !== undefined &&
    jobId !== null &&
    jobId !== '' &&
    !isNaN(Number(jobId)) &&
    milestoneId !== undefined &&
    milestoneId !== null &&
    milestoneId !== '' &&
    !isNaN(Number(milestoneId));
  return useReadContract({
    address: CONTRACTS.ESCROW,
    abi: EscrowABI,
    functionName: "getMilestone",
    args: isValid ? [BigInt(jobId), BigInt(milestoneId)] : undefined,
    query: {
      enabled: isValid,
    },
  });
}
