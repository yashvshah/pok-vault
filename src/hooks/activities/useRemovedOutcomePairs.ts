import { useQuery } from '@tanstack/react-query';
import { subgraphClient, REMOVED_OUTCOME_PAIR_QUERY } from '../../config/subgraph';
import type { SubgraphOppositeOutcomeTokenPairRemoved } from '../../types/vault';

interface RemovedOutcomePairsResponse {
  oppositeOutcomeTokenPairRemoveds: SubgraphOppositeOutcomeTokenPairRemoved[];
}

export function useRemovedOutcomePairs(limit = 100) {
  return useQuery({
    queryKey: ['removed-outcome-pairs', limit],
    queryFn: async (): Promise<SubgraphOppositeOutcomeTokenPairRemoved[]> => {
      const response = await subgraphClient.request<RemovedOutcomePairsResponse>(REMOVED_OUTCOME_PAIR_QUERY, {
        first: limit,
      });
      return response.oppositeOutcomeTokenPairRemoveds || [];
    },
    staleTime: 30000, // 30 seconds
  });
}