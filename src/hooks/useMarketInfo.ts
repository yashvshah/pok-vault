import { useQuery } from '@tanstack/react-query';
import { polymarketService, type PolymarketMarket } from '../services/polymarket';

export function useMarketInfo(outcomeTokenId: string) {
  return useQuery({
    queryKey: ['market-info', outcomeTokenId],
    queryFn: async (): Promise<PolymarketMarket | null> => {
      return await polymarketService.getMarketInfoFromOutcomeToken(outcomeTokenId);
    },
    enabled: !!outcomeTokenId,
    staleTime: 5 * 60 * 1000, // 5 minutes - market data doesn't change often
  });
}