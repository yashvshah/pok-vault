import { useQuery } from '@tanstack/react-query';
import { subgraphClient, DEPOSITS_QUERY } from '../../config/subgraph';
import type { SubgraphDeposit } from '../../types/vault';

interface DepositsResponse {
  deposits: SubgraphDeposit[];
}

export function useDeposits(limit = 100) {
  return useQuery({
    queryKey: ['deposits', limit],
    queryFn: async (): Promise<SubgraphDeposit[]> => {
      const response = await subgraphClient.request<DepositsResponse>(DEPOSITS_QUERY, {
        first: limit,
      });
      return response.deposits || [];
    },
    staleTime: 30000, // 30 seconds
  });
}