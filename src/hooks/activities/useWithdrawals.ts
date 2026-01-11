import { useQuery } from '@tanstack/react-query';
import { subgraphClient, WITHDRAWALS_QUERY } from '../../config/subgraph';
import type { SubgraphWithdrawal } from '../../types/vault';

interface WithdrawalsResponse {
  withdraws: SubgraphWithdrawal[];
}

export function useWithdrawals(limit = 100) {
  return useQuery({
    queryKey: ['withdrawals', limit],
    queryFn: async (): Promise<SubgraphWithdrawal[]> => {
      const response = await subgraphClient.request<WithdrawalsResponse>(WITHDRAWALS_QUERY, {
        first: limit,
      });
      return response.withdraws || [];
    },
    staleTime: 30000, // 30 seconds
  });
}