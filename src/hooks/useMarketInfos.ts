import { useQueries } from '@tanstack/react-query';
import { marketInfoService } from '../services/marketInfo';

interface MarketInfoInput {
  outcomeId: string;
  tokenAddress: string;
}

export function useMarketInfos(marketInfoInputs: MarketInfoInput[]) {
  const queries = useQueries({
    queries: marketInfoInputs.map((input) => ({
      queryKey: ['marketInfo', input.tokenAddress, input.outcomeId],
      queryFn: () => marketInfoService.getMarketInfoFromOutcomeToken(input.outcomeId, input.tokenAddress),
      enabled: !!input.outcomeId && !!input.tokenAddress,
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