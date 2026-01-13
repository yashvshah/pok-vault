import { useQuery } from '@tanstack/react-query';
import { subgraphClient, PROFIT_LOSS_REPORTED_QUERY } from '../../config/subgraph';
import type { SubgraphProfitOrLossReported } from '../../types/vault';

interface ProfitLossReportedResponse {
  profitOrLossReporteds: SubgraphProfitOrLossReported[];
}

export function useProfitLossReported(limit = 100) {
  return useQuery({
    queryKey: ['profit-loss-reported', limit],
    queryFn: async (): Promise<SubgraphProfitOrLossReported[]> => {
      const response = await subgraphClient.request<ProfitLossReportedResponse>(PROFIT_LOSS_REPORTED_QUERY, {
        first: limit,
      });
      return response.profitOrLossReporteds || [];
    },
    staleTime: 30000, // 30 seconds
  });
}