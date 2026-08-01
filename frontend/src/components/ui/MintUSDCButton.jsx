'use client';

import { useState } from 'react';
import { useWriteContract, useAccount } from 'wagmi';
import { CONTRACTS } from '@/config/contracts';
import Button from './Button';
import { Coins } from 'lucide-react';
import { showTxToast } from './TransactionToast';

// Minimal ABI for minting
const MockUSDC_ABI = [
  {
    type: "function",
    name: "mint",
    stateMutability: "nonpayable",
    inputs: [
      { name: "to", type: "address" },
      { name: "amount", type: "uint256" }
    ],
    outputs: [],
  }
];

export default function MintUSDCButton() {
  const { writeContractAsync } = useWriteContract();
  const { address } = useAccount();
  const [loading, setLoading] = useState(false);

  const handleMint = async () => {
    if (!address) return;
    setLoading(true);
    try {
      const txHash = await writeContractAsync({
        address: CONTRACTS.USDC,
        abi: MockUSDC_ABI,
        functionName: "mint",
        // Mint 10,000 USDC (6 decimals)
        args: [address, BigInt(10000 * 1_000_000)],
      });
      showTxToast('success', txHash, 'Successfully minted 10,000 Test USDC!');
    } catch (error) {
      console.error(error);
      showTxToast('error', null, error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      variant="secondary"
      onClick={handleMint}
      loading={loading}
      disabled={!address}
      className="w-full mt-2"
    >
      <Coins className="h-4 w-4 mr-2" />
      Mint Test USDC
    </Button>
  );
}
