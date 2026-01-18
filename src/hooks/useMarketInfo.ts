import { useQuery } from '@tanstack/react-query';
import { marketInfoService, type UnifiedMarketInfo } from '../services/marketInfo';

/**
 * Hook to fetch market info for a single outcome token
 * Uses the provider registry to automatically detect the correct provider
 */
export function useMarketInfo(outcomeTokenId: string, tokenAddress: string) {
  return useQuery({
    queryKey: ['market-info', outcomeTokenId, tokenAddress],
    queryFn: async (): Promise<UnifiedMarketInfo | null> => {
      return await marketInfoService.getMarketInfoFromOutcomeToken(outcomeTokenId, tokenAddress);
    },
    enabled: !!outcomeTokenId && !!tokenAddress,
    staleTime: 5 * 60 * 1000, // 5 minutes - market data doesn't change often
  });
}