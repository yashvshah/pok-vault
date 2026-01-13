import { useQuery } from '@tanstack/react-query';
import { subgraphClient, SPLIT_OUTCOME_TOKENS_QUERY } from '../../config/subgraph';
import type { SubgraphSplitOppositeOutcomeTokens } from '../../types/vault';

interface SplitOutcomeTokensResponse {
  splitOppositeOutcomeTokens: SubgraphSplitOppositeOutcomeTokens[];
}

export function useSplitOutcomeTokens(limit = 100) {
  return useQuery({
    queryKey: ['split-outcome-tokens', limit],
    queryFn: async (): Promise<SubgraphSplitOppositeOutcomeTokens[]> => {
      const response = await subgraphClient.request<SplitOutcomeTokensResponse>(SPLIT_OUTCOME_TOKENS_QUERY, {
        first: limit,
      });
      return response.splitOppositeOutcomeTokens || [];
    },
    staleTime: 30000, // 30 seconds
  });
}