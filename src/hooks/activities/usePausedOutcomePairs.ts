import { useQuery } from '@tanstack/react-query';
import { subgraphClient, PAUSED_OUTCOME_PAIR_QUERY } from '../../config/subgraph';
import type { SubgraphOppositeOutcomeTokenPairPaused } from '../../types/vault';

interface PausedOutcomePairsResponse {
  oppositeOutcomeTokenPairPauseds: SubgraphOppositeOutcomeTokenPairPaused[];
}

export function usePausedOutcomePairs(limit = 100) {
  return useQuery({
    queryKey: ['paused-outcome-pairs', limit],
    queryFn: async (): Promise<SubgraphOppositeOutcomeTokenPairPaused[]> => {
      const response = await subgraphClient.request<PausedOutcomePairsResponse>(PAUSED_OUTCOME_PAIR_QUERY, {
        first: limit,
      });
      return response.oppositeOutcomeTokenPairPauseds || [];
    },
    staleTime: 30000, // 30 seconds
  });
}