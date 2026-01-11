import { useQueries } from '@tanstack/react-query';
import { polymarketService } from '../services/polymarket';

export function useMarketInfos(outcomeIds: string[]) {
  const queries = useQueries({
    queries: outcomeIds.map((outcomeId) => ({
      queryKey: ['marketInfo', outcomeId],
      queryFn: () => polymarketService.getMarketInfoFromOutcomeToken(outcomeId),
      enabled: !!outcomeId,
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes
    })),
  });

  return {
    data: queries.map((query) => query.data),
    isLoading: queries.some((query) => query.isLoading),
    error: queries.find((query) => query.error)?.error,
  };
}