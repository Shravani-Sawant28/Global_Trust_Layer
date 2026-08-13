import {
  useWriteContract,
  useReadContract,
  useWaitForTransactionReceipt,
  usePublicClient,
} from "wagmi";

import { CONTRACTS } from "@/config/contracts";

// Minimal ERC20 ABI
const ERC20ABI = [
  {
    type: "function",
    name: "approve",
    stateMutability: "nonpayable",
    inputs: [
      { name: "spender", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    outputs: [{ type: "bool" }],
  },
  {
    type: "function",
    name: "balanceOf",
    stateMutability: "view",
    inputs: [{ name: "account", type: "address" }],
    outputs: [{ type: "uint256" }],
  },
  {
    type: "function",
    name: "allowance",
    stateMutability: "view",
    inputs: [
      { name: "owner", type: "address" },
      { name: "spender", type: "address" },
    ],
    outputs: [{ type: "uint256" }],
  },
];

export function useApproveUSDC() {
  const { writeContract, writeContractAsync, data: hash, error, isPending } = useWriteContract();
  const publicClient = usePublicClient();

  const receipt = useWaitForTransactionReceipt({
    hash,
  });

  function approve(amount) {
    writeContract({
      address: CONTRACTS.USDC,
      abi: ERC20ABI,
      functionName: "approve",
      args: [
        CONTRACTS.ESCROW,
        BigInt(amount),
      ],
    });
  }

  async function approveAndWait(amount) {
    const txHash = await writeContractAsync({
      address: CONTRACTS.USDC,
      abi: ERC20ABI,
      functionName: "approve",
      args: [
        CONTRACTS.ESCROW,
        BigInt(amount),
      ],
    });
    
    const waitReceipt = await publicClient.waitForTransactionReceipt({ hash: txHash });
    if (waitReceipt.status !== "success") {
      throw new Error("Approval transaction failed on-chain.");
    }
    return waitReceipt;
  }

  return {
    approve,
    approveAndWait,
    hash,
    error,
    isPending,
    isConfirming: receipt.isLoading,
    isSuccess: receipt.isSuccess,
  };
}

export function useUSDCBalance(address) {
  return useReadContract({
    address: CONTRACTS.USDC,
    abi: ERC20ABI,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    query: {
      enabled: !!address,
    },
  });
}

export function useUSDCAllowance(owner) {
  return useReadContract({
    address: CONTRACTS.USDC,
    abi: ERC20ABI,
    functionName: "allowance",
    args: owner
      ? [
          owner,
          CONTRACTS.ESCROW,
        ]
      : undefined,
    query: {
      enabled: !!owner,
    },
  });
}