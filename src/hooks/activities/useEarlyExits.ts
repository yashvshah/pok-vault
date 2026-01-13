import { useQuery } from '@tanstack/react-query';
import { subgraphClient, EARLY_EXIT_QUERY } from '../../config/subgraph';
import type { SubgraphEarlyExit } from '../../types/vault';

interface EarlyExitResponse {
  earlyExits: SubgraphEarlyExit[];
}

export function useEarlyExits(limit = 100) {
  return useQuery({
    queryKey: ['early-exits', limit],
    queryFn: async (): Promise<SubgraphEarlyExit[]> => {
      const response = await subgraphClient.request<EarlyExitResponse>(EARLY_EXIT_QUERY, {
        first: limit,
      });
      return response.earlyExits || [];
    },
    staleTime: 30000, // 30 seconds
  });
}