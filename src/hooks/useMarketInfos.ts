import { useQuery } from '@tanstack/react-query';
import { marketInfoService } from '../services/marketInfo';

interface MarketInfoInput {
  outcomeId: string;
  tokenAddress: string;
}

export function useMarketInfos(marketInfoInputs: MarketInfoInput[]) {
  const query = useQuery({
    queryKey: ['marketInfoBatch', marketInfoInputs],
    queryFn: async () => {
      if (marketInfoInputs.length === 0) {
        return [];
      }

      // Use batch endpoint to fetch all market info in one call
      const marketInfoMap = await marketInfoService.getMarketInfoBatch(
        marketInfoInputs.map(input => ({
          tokenAddress: input.tokenAddress,
          outcomeTokenId: input.outcomeId,
        }))
      );

      // Return results in the same order as inputs
      return marketInfoInputs.map(input => {
        const key = `${input.tokenAddress}-${input.outcomeId}`;
        return marketInfoMap.get(key);
      });
    },
    enabled: marketInfoInputs.length > 0,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });

  return {
    data: query.data,
    isLoading: query.isLoading,
    error: query.error,
  };
}