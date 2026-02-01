import { useQuery } from '@tanstack/react-query';
import { marketInfoService, type UnifiedMarketInfo } from '../services/marketInfo';

/**
 * Hook to fetch market info for a single outcome token
 * Uses the provider registry to automatically detect the correct provider
 */
// Not being used anymore. We now rely on the middleware to provide the market infos based on the token addresses and outcome token ids.
// the middleware has indexed all the markets from all providers according to the outcome token ids.
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