import { useState, useMemo } from 'react';
import { useAccount, useCapabilities } from 'wagmi';
import type { Address } from 'viem';

export interface BatchCall {
  to: Address;
  data: `0x${string}`;
  value?: bigint;
  description: string;
}

export function useAtomicBatch(chainId?: number) {
  const { address } = useAccount();
  const { data: availableCapabilities } = useCapabilities({ 
    account: address, 
  });

  const [batchCalls, setBatchCalls] = useState<BatchCall[]>([]);

  const isAtomicBatchingSupported = useMemo(() => {
    if (!availableCapabilities || !chainId) return false;
    
    const chainCapabilities = availableCapabilities[chainId as keyof typeof availableCapabilities];
    if (chainCapabilities && typeof chainCapabilities === 'object' && 'atomicBatch' in chainCapabilities) {
      return !!(chainCapabilities.atomicBatch as { supported?: boolean })?.supported;
    }
    return false;
  }, [availableCapabilities, chainId]);

  const addCall = (call: BatchCall) => {
    setBatchCalls(prev => [...prev, call]);
  };

  const removeCall = (index: number) => {
    setBatchCalls(prev => prev.filter((_, i) => i !== index));
  };

  const clearCalls = () => {
    setBatchCalls([]);
  };

  return {
    isAtomicBatchingSupported,
    batchCalls,
    addCall,
    removeCall,
    clearCalls,
    hasCalls: batchCalls.length > 0,
  };
}
