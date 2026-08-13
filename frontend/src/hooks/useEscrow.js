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

// Map of custom error names to user-friendly messages
const ERROR_MESSAGES = {
  Unauthorized: "Your wallet is not authorized for this action.",
  InvalidAddress: "Invalid address provided.",
  InvalidJob: "This blockchain job does not exist.",
  InvalidMilestone: "This milestone does not exist.",
  InvalidAmount: "Invalid amount provided.",
  InvalidState: "This job is not currently in a state where this action is allowed.",
  AlreadyFunded: "This job has already been funded.",
  AlreadyReleased: "This milestone has already been released.",
  AlreadyDelivered: "This milestone has already been delivered.",
  AlreadyRegistered: "You are already registered as a juror.",
  JobNotFound: "This blockchain job does not exist.",
  MilestoneNotFound: "This milestone does not exist.",
  NotJobParty: "You are not a client or freelancer for this job.",
  DisputeAlreadyExists: "A dispute already exists for this milestone.",
  DisputeNotFound: "This dispute does not exist.",
  DisputeStageMismatch: "This dispute is not in the expected stage for this action.",
  InvalidBps: "Invalid basis points provided (must be 0-10000).",
  CommitWindowClosed: "The commitment window for voting has closed.",
  RevealWindowNotOpen: "The reveal window has not opened yet.",
  RevealWindowClosed: "The reveal window has closed.",
  CommitmentMismatch: "Your vote commitment does not match your reveal.",
  AlreadyCommitted: "You have already committed a vote in this dispute.",
  AlreadyRevealed: "You have already revealed your vote.",
  VotingClosed: "Voting has closed for this dispute.",
  VotingNotStarted: "Voting has not started for this dispute.",
  JurorNotEligible: "You are not eligible to vote in this dispute.",
  InsufficientStake: "You do not have sufficient stake to perform this action.",
};

function formatErrorMessage(error) {
  const errorName = error.cause?.data?.errorName || error.shortMessage;
  
  if (ERROR_MESSAGES[errorName]) {
    return `${errorName}: ${ERROR_MESSAGES[errorName]}`;
  }
  
  return error.shortMessage || error.details || error.message || "Unknown revert reason";
}

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
      const errorMsg = formatErrorMessage(error);
      toast.error(`Simulation failed: ${errorMsg}`);
      return;
    }

    // 3. Execute
    try {
      const fees = await publicClient.estimateFeesPerGas();

      const txHash = await writeContractAsync({
        ...request,
        maxFeePerGas: fees.maxFeePerGas * 2n,
        maxPriorityFeePerGas: fees.maxPriorityFeePerGas,
      });
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
  const publicClient = usePublicClient();

  const fundJob = async (jobId) => {
    if (jobId === undefined || jobId === null || jobId === '') {
      console.error("fundJob called with invalid jobId:", jobId);
      toast.error("Invalid blockchain job ID. Please refresh and try again.");
      return;
    }
    
    // Pre-transaction validation: verify job exists on blockchain
    try {
      const jobData = await publicClient.readContract({
        address: CONTRACTS.ESCROW,
        abi: EscrowABI,
        functionName: "getJobBasic",
        args: [BigInt(jobId)],
      });
      
      if (!jobData) {
        toast.error(`Job #${jobId} does not exist on blockchain. Please wait for synchronization.`);
        console.error("[ESCROW VALIDATION] Job not found on blockchain:", jobId);
        return;
      }
      
      console.log("[ESCROW VALIDATION] Job exists on blockchain:", { jobId, jobData });
    } catch (err) {
      toast.error(`Failed to verify job exists on blockchain: ${err.message}`);
      console.error("[ESCROW VALIDATION] Error checking job:", err);
      return;
    }
    
    await executeSafe("fundJob", [BigInt(jobId)]);
  };

  return { fundJob, hash, isPending, isConfirming, isSuccess, error };
}

export function useAcceptJob() {
  const { executeSafe, hash, isPending, isConfirming, isSuccess, error } = useSafeEscrowWrite();
  const publicClient = usePublicClient();

  const acceptJob = async (jobId) => {
    if (jobId === undefined || jobId === null || jobId === '') {
      console.error("acceptJob called with invalid jobId:", jobId);
      toast.error("Invalid blockchain job ID. Please refresh and try again.");
      return;
    }
    
    // Pre-transaction validation: verify job exists on blockchain
    try {
      const jobData = await publicClient.readContract({
        address: CONTRACTS.ESCROW,
        abi: EscrowABI,
        functionName: "getJobBasic",
        args: [BigInt(jobId)],
      });
      
      if (!jobData) {
        toast.error(`Job #${jobId} does not exist on blockchain. Please wait for synchronization.`);
        console.error("[ESCROW VALIDATION] Job not found on blockchain:", jobId);
        return;
      }
      
      console.log("[ESCROW VALIDATION] Job exists on blockchain:", { jobId, jobData });
    } catch (err) {
      toast.error(`Failed to verify job exists on blockchain: ${err.message}`);
      console.error("[ESCROW VALIDATION] Error checking job:", err);
      return;
    }
    
    await executeSafe("acceptJob", [BigInt(jobId)]);
  };

  return { acceptJob, hash, isPending, isConfirming, isSuccess, error };
}

export function useDeliverMilestone() {
  const { executeSafe, hash, isPending, isConfirming, isSuccess, error } = useSafeEscrowWrite();
  const publicClient = usePublicClient();

  const deliverMilestone = async (jobId, milestoneId, deliveryHash) => {
    if (jobId === undefined || jobId === null || jobId === '' || milestoneId === undefined || milestoneId === null) {
      console.error("deliverMilestone called with invalid parameters:", { jobId, milestoneId });
      toast.error("Invalid parameters. Please refresh and try again.");
      return;
    }
    
    // Pre-transaction validation: verify job exists on blockchain
    try {
      const jobData = await publicClient.readContract({
        address: CONTRACTS.ESCROW,
        abi: EscrowABI,
        functionName: "getJobBasic",
        args: [BigInt(jobId)],
      });
      
      if (!jobData) {
        toast.error(`Job #${jobId} does not exist on blockchain. Please wait for synchronization.`);
        console.error("[ESCROW VALIDATION] Job not found on blockchain:", jobId);
        return;
      }
      
      console.log("[ESCROW VALIDATION] Job exists on blockchain:", { jobId, milestoneId, jobData });
    } catch (err) {
      toast.error(`Failed to verify job exists on blockchain: ${err.message}`);
      console.error("[ESCROW VALIDATION] Error checking job:", err);
      return;
    }
    
    await executeSafe("deliverMilestone", [
      BigInt(jobId),
      BigInt(milestoneId),
      deliveryHash,
    ]);
  };

  return { deliverMilestone, hash, isPending, isConfirming, isSuccess, error };
}

export function useReleaseMilestone() {
  const { executeSafe, hash, isPending, isConfirming, isSuccess, error } = useSafeEscrowWrite();
  const publicClient = usePublicClient();

  const releaseMilestone = async (jobId, milestoneId) => {
    if (jobId === undefined || jobId === null || jobId === '' || milestoneId === undefined || milestoneId === null) {
      console.error("releaseMilestone called with invalid parameters:", { jobId, milestoneId });
      toast.error("Invalid parameters. Please refresh and try again.");
      return;
    }
    
    // Pre-transaction validation: verify job exists on blockchain
    try {
      const jobData = await publicClient.readContract({
        address: CONTRACTS.ESCROW,
        abi: EscrowABI,
        functionName: "getJobBasic",
        args: [BigInt(jobId)],
      });
      
      if (!jobData) {
        toast.error(`Job #${jobId} does not exist on blockchain. Please wait for synchronization.`);
        console.error("[ESCROW VALIDATION] Job not found on blockchain:", jobId);
        return;
      }
      
      console.log("[ESCROW VALIDATION] Job exists on blockchain:", { jobId, milestoneId, jobData });
    } catch (err) {
      toast.error(`Failed to verify job exists on blockchain: ${err.message}`);
      console.error("[ESCROW VALIDATION] Error checking job:", err);
      return;
    }
    
    await executeSafe("releaseMilestone", [BigInt(jobId), BigInt(milestoneId)]);
  };

  return { releaseMilestone, hash, isPending, isConfirming, isSuccess, error };
}

export function useRaiseDispute() {
  const { executeSafe, hash, isPending, isConfirming, isSuccess, error } = useSafeEscrowWrite();
  const publicClient = usePublicClient();

  const raiseDispute = async (jobId, milestoneId, reason) => {
    if (jobId === undefined || jobId === null || jobId === '' || milestoneId === undefined || milestoneId === null) {
      console.error("raiseDispute called with invalid parameters:", { jobId, milestoneId });
      toast.error("Invalid parameters. Please refresh and try again.");
      return;
    }
    
    // Pre-transaction validation: verify job exists on blockchain
    try {
      const jobData = await publicClient.readContract({
        address: CONTRACTS.ESCROW,
        abi: EscrowABI,
        functionName: "getJobBasic",
        args: [BigInt(jobId)],
      });
      
      if (!jobData) {
        toast.error(`Job #${jobId} does not exist on blockchain. Please wait for synchronization.`);
        console.error("[ESCROW VALIDATION] Job not found on blockchain:", jobId);
        return;
      }
      
      console.log("[ESCROW VALIDATION] Job exists on blockchain:", { jobId, milestoneId, reason, jobData });
    } catch (err) {
      toast.error(`Failed to verify job exists on blockchain: ${err.message}`);
      console.error("[ESCROW VALIDATION] Error checking job:", err);
      return;
    }
    
    await executeSafe("raiseDispute", [BigInt(jobId), BigInt(milestoneId), reason]);
  };

  return { raiseDispute, hash, isPending, isConfirming, isSuccess, error };
}

export function useProposeSettlement() {
  const { executeSafe, hash, isPending, isConfirming, isSuccess, error } = useSafeEscrowWrite();

  const proposeSettlement = async (disputeId, clientBps) => {
    if (disputeId === undefined || disputeId === null || disputeId === '' || clientBps === undefined || clientBps === null) {
      console.error("proposeSettlement called with invalid parameters:", { disputeId, clientBps });
      return;
    }
    await executeSafe("proposeSettlement", [BigInt(disputeId), BigInt(clientBps)]);
  };

  return { proposeSettlement, hash, isPending, isConfirming, isSuccess, error };
}

// Deprecated: use useProposeSettlement instead
// The new contract doesn't use milestoneId for dispute resolution
export function useAgreeToSplit() {
  const { executeSafe, hash, isPending, isConfirming, isSuccess, error } = useSafeEscrowWrite();

  const agreeToSplit = async (disputeId, _milestoneId, clientBps) => {
    // _milestoneId is ignored — the new contract uses dispute_id only
    if (disputeId === undefined || disputeId === null || disputeId === '' || clientBps === undefined || clientBps === null) {
      console.error("agreeToSplit called with invalid parameters:", { disputeId, clientBps });
      return;
    }
    await executeSafe("proposeSettlement", [BigInt(disputeId), BigInt(clientBps)]);
  };

  return { agreeToSplit, hash, isPending, isConfirming, isSuccess, error };
}

export function useJobCount() {
  return useReadContract({
    address: CONTRACTS.ESCROW,
    abi: EscrowABI,
    functionName: "getJobCount",
  });
}

export function useJobBasic(jobId) {
  const isValid = jobId !== undefined && jobId !== null && jobId !== '' && !isNaN(Number(jobId));
  return useReadContract({
    address: CONTRACTS.ESCROW,
    abi: EscrowABI,
    functionName: "getJobBasic",
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
