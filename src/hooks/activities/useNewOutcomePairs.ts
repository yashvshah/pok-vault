import { useQuery } from '@tanstack/react-query';
import { subgraphClient, NEW_OUTCOME_PAIR_QUERY } from '../../config/subgraph';
import type { SubgraphNewOppositeOutcomeTokenPairAdded } from '../../types/vault';

interface NewOutcomePairsResponse {
  newOppositeOutcomeTokenPairAddeds: SubgraphNewOppositeOutcomeTokenPairAdded[];
}

export function useNewOutcomePairs(limit = 100) {
  return useQuery({
    queryKey: ['new-outcome-pairs', limit],
    queryFn: async (): Promise<SubgraphNewOppositeOutcomeTokenPairAdded[]> => {
      const response = await subgraphClient.request<NewOutcomePairsResponse>(NEW_OUTCOME_PAIR_QUERY, {
        first: limit,
      });
      return response.newOppositeOutcomeTokenPairAddeds || [];
    },
    staleTime: 30000, // 30 seconds
  });
}