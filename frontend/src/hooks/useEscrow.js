import { useWriteContract, useWaitForTransactionReceipt, useReadContract } from 'wagmi';
import { parseEther, parseUnits } from 'viem';
import { CONTRACT_ADDRESSES, ESCROW_FACTORY_ABI } from '@/lib/contracts';
import { toUnixTimestamp } from '@/lib/utils';

/**
 * useEscrow — wagmi hooks for all EscrowFactory contract interactions.
 *
 * All write functions are stubs that will call the real contract once
 * NEXT_PUBLIC_ESCROW_FACTORY_ADDRESS is set in .env.local.
 *
 * Returns both the write trigger function and the transaction state
 * so calling components can show pending/success/error UI.
 */
export function useCreateEscrow() {
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

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
    freelancer = '0x0000000000000000000000000000000000000000',
    deadline,
    milestoneAmounts = [],
    currency = 'ETH',
    totalAmount,
  }) => {
    const deadlineTs = BigInt(toUnixTimestamp(deadline));

    // Convert amounts to wei/micro-USDC
    const milestonesBigInt = milestoneAmounts.map((a) =>
      currency === 'ETH' ? parseEther(String(a)) : parseUnits(String(a), 6)
    );

    // ETH: native payment (msg.value); USDC: ERC-20 transfer (token != address(0))
    // TODO: For USDC, first call approve() on the USDC contract before this call.
    const tokenAddress =
      currency === 'ETH'
        ? '0x0000000000000000000000000000000000000000'
        : '0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d'; // USDC on Arbitrum Sepolia

    writeContract({
      address: CONTRACT_ADDRESSES.ESCROW_FACTORY,
      abi:     ESCROW_FACTORY_ABI,
      functionName: 'createEscrow',
      args: [freelancer, deadlineTs, milestonesBigInt, tokenAddress],
      value: currency === 'ETH' ? parseEther(String(totalAmount)) : 0n,
    });
  };

  return { createEscrow, hash, isPending, isConfirming, isSuccess, error };
}

export function useSubmitWork() {
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const submitWork = (escrowId, evidenceUri = '') => {
    writeContract({
      address: CONTRACT_ADDRESSES.ESCROW_FACTORY,
      abi:     ESCROW_FACTORY_ABI,
      functionName: 'submitWork',
      args: [BigInt(escrowId), evidenceUri],
    });
  };

  return { submitWork, hash, isPending, isConfirming, isSuccess, error };
}

export function useReleasePayment() {
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const releasePayment = (escrowId) => {
    writeContract({
      address: CONTRACT_ADDRESSES.ESCROW_FACTORY,
      abi:     ESCROW_FACTORY_ABI,
      functionName: 'releasePayment',
      args: [BigInt(escrowId)],
    });
  };

  return { releasePayment, hash, isPending, isConfirming, isSuccess, error };
}

export function useRaiseDispute() {
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const raiseDispute = (escrowId, reason) => {
    writeContract({
      address: CONTRACT_ADDRESSES.ESCROW_FACTORY,
      abi:     ESCROW_FACTORY_ABI,
      functionName: 'raiseDispute',
      args: [BigInt(escrowId), reason],
    });
  };

  return { raiseDispute, hash, isPending, isConfirming, isSuccess, error };
}

export function useAutoRelease() {
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const autoRelease = (escrowId) => {
    writeContract({
      address: CONTRACT_ADDRESSES.ESCROW_FACTORY,
      abi:     ESCROW_FACTORY_ABI,
      functionName: 'autoRelease',
      args: [BigInt(escrowId)],
    });
  };

  return { autoRelease, hash, isPending, isConfirming, isSuccess, error };
}

export function useAgreeToSplit() {
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  // clientBps: basis points going to client (5000 = 50/50 split)
  const agreeToSplit = (escrowId, clientBps) => {
    writeContract({
      address: CONTRACT_ADDRESSES.ESCROW_FACTORY,
      abi:     ESCROW_FACTORY_ABI,
      functionName: 'agreeToSplit',
      args: [BigInt(escrowId), BigInt(clientBps)],
    });
  };

  return { agreeToSplit, hash, isPending, isConfirming, isSuccess, error };
}

/** Read-only: fetch escrow details by ID. */
export function useGetEscrow(escrowId) {
  return useReadContract({
    address:      CONTRACT_ADDRESSES.ESCROW_FACTORY,
    abi:          ESCROW_FACTORY_ABI,
    functionName: 'getEscrow',
    args:         [BigInt(escrowId || 0)],
    enabled:      !!escrowId,
  });
}
