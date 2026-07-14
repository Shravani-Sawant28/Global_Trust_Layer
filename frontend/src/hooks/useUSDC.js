import {
  useWriteContract,
  useReadContract,
  useWaitForTransactionReceipt,
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
  const { writeContract, data: hash, error, isPending } = useWriteContract();

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

  return {
    approve,
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