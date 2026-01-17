import { useMemo } from 'react';
import { useWriteContract, useSimulateContract } from 'wagmi';
import type { Address, Hex } from 'viem';
import { 
  createMultiSendExecParams, 
  type SafeTransaction 
} from '../utils/multiSend';
import { 
  MULTI_SEND_CALL_ONLY_BSC_ADDRESS, 
  MULTI_SEND_CALL_ONLY_POLYGON_ADDRESS 
} from '../config/addresses';
import { bsc, polygon } from 'wagmi/chains';

// Gnosis Safe ABI (only execTransaction function)
const SAFE_ABI = [
  {
    name: 'execTransaction',
    type: 'function',
    inputs: [
      { name: 'to', type: 'address' },
      { name: 'value', type: 'uint256' },
      { name: 'data', type: 'bytes' },
      { name: 'operation', type: 'uint8' },
      { name: 'safeTxGas', type: 'uint256' },
      { name: 'baseGas', type: 'uint256' },
      { name: 'gasPrice', type: 'uint256' },
      { name: 'gasToken', type: 'address' },
      { name: 'refundReceiver', type: 'address' },
      { name: 'signatures', type: 'bytes' },
    ],
    outputs: [{ name: 'success', type: 'bool' }],
    stateMutability: 'payable',
  },
] as const;

interface UseMultiSendSafeWriteOptions {
  safeAddress: Address;
  chainId: typeof bsc.id | typeof polygon.id;
  transactions: SafeTransaction[];
  signatures?: Hex;
  enabled?: boolean;
}

/**
 * Hook to execute batched transactions via MultiSendCallOnly on a Gnosis Safe
 * 
 * @example
 * const { write, data, error, isLoading } = useMultiSendSafeWrite({
 *   safeAddress: '0x...',
 *   chainId: bsc.id,
 *   transactions: [
 *     { to: '0x...', value: 0n, data: '0x...' },
 *     { to: '0x...', value: 0n, data: '0x...' },
 *   ],
 * });
 * 
 * // Execute the batch
 * write();
 */
export function useMultiSendSafeWrite({
  safeAddress,
  chainId,
  transactions,
  signatures = '0x',
  enabled = true,
}: UseMultiSendSafeWriteOptions) {
  // Get the appropriate MultiSend address for the chain
  const multiSendAddress = useMemo(() => {
    return chainId === bsc.id 
      ? MULTI_SEND_CALL_ONLY_BSC_ADDRESS 
      : MULTI_SEND_CALL_ONLY_POLYGON_ADDRESS;
  }, [chainId]);

  // Create exec params
  const execParams = useMemo(() => {
    if (transactions.length === 0) return null;
    return createMultiSendExecParams(multiSendAddress, transactions, signatures);
  }, [multiSendAddress, transactions, signatures]);

  // Simulate the transaction (optional, for validation)
  const { data: simulateData } = useSimulateContract({
    address: safeAddress,
    abi: SAFE_ABI,
    functionName: 'execTransaction',
    args: execParams ? [
      execParams.to,
      execParams.value,
      execParams.data,
      execParams.operation,
      execParams.safeTxGas,
      execParams.baseGas,
      execParams.gasPrice,
      execParams.gasToken,
      execParams.refundReceiver,
      execParams.signatures,
    ] : undefined,
    chainId,
    query: {
      enabled: enabled && execParams !== null,
    },
  });

  // Write contract
  const { 
    writeContract, 
    data: writeData, 
    error, 
    isPending,
    isSuccess 
  } = useWriteContract();

  const write = () => {
    if (!execParams) {
      console.error('Cannot execute: no transactions provided');
      return;
    }

    writeContract({
      address: safeAddress,
      abi: SAFE_ABI,
      functionName: 'execTransaction',
      args: [
        execParams.to,
        execParams.value,
        execParams.data,
        execParams.operation,
        execParams.safeTxGas,
        execParams.baseGas,
        execParams.gasPrice,
        execParams.gasToken,
        execParams.refundReceiver,
        execParams.signatures,
      ],
      chainId,
    });
  };

  return {
    write,
    data: writeData,
    simulateData,
    error,
    isLoading: isPending,
    isSuccess,
    execParams, // Expose for debugging
  };
}
