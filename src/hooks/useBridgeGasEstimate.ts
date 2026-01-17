import { useQuery } from '@tanstack/react-query';
import { estimateBridgeGasFee, type GasFeeEstimate } from '../utils/bridgeGasEstimate';

interface UseBridgeGasEstimateResult {
  gasFee: GasFeeEstimate | undefined;
  isLoading: boolean;
  error: Error | null;
}

/**
 * Hook to estimate gas fees for bridge transactions
 * @param direction - Direction of the bridge ('polygon-to-bsc' or 'bsc-to-polygon')
 * @param enabled - Whether to fetch the gas estimate
 * @returns Gas fee estimate with loading and error states
 */
export function useBridgeGasEstimate(
  direction: 'polygon-to-bsc' | 'bsc-to-polygon',
  enabled = true
): UseBridgeGasEstimateResult {
  const { data, isLoading, error } = useQuery({
    queryKey: ['bridge-gas-estimate', direction],
    queryFn: () => estimateBridgeGasFee(direction),
    enabled,
    staleTime: 300000, // 5 minutes
    refetchInterval: 300000, // Refetch every 5 minutes
    retry: 3,
  });

  return {
    gasFee: data,
    isLoading,
    error: error as Error | null,
  };
}

/**
 * Hook to estimate gas fees for both bridge directions
 * Useful when you need both estimates at once
 */
export function useBridgeGasEstimates() {
  const polygonToBSC = useBridgeGasEstimate('polygon-to-bsc');
  const bscToPolygon = useBridgeGasEstimate('bsc-to-polygon');

  return {
    polygonToBSC,
    bscToPolygon,
    isLoading: polygonToBSC.isLoading || bscToPolygon.isLoading,
  };
}
