import { useMemo } from 'react';
import { useDeposits } from './useDeposits';
import { useWithdrawals } from './useWithdrawals';
import { useNewOutcomePairs } from './useNewOutcomePairs';
import { useMarketInfos } from './useMarketInfos';
import type { VaultActivity, SubgraphDeposit, SubgraphWithdrawal, SubgraphNewOppositeOutcomeTokenPairAdded } from '../types/vault';
import type { PolymarketMarket } from '../services/polymarket';

export function useVaultActivities(limit = 100) {
  const { data: deposits = [], isLoading: depositsLoading, error: depositsError } = useDeposits(limit);
  const { data: withdrawals = [], isLoading: withdrawalsLoading, error: withdrawalsError } = useWithdrawals(limit);
  const { data: newOutcomePairs = [], isLoading: outcomePairsLoading, error: outcomePairsError } = useNewOutcomePairs(limit);

  const POLYGON_ERC1155_ADDRESS = '0x4d97dcd97ec945f40cf65f87097ace5ea0476045';

  // Get all unique outcome IDs from the new outcome pairs
  const outcomeIds = useMemo(() => {
    const ids = new Set<string>();
    newOutcomePairs.forEach((pair) => {
      if (pair.outcomeIdA && pair.outcomeTokenA.toLowerCase() === POLYGON_ERC1155_ADDRESS.toLowerCase()) ids.add(pair.outcomeIdA);
      if (pair.outcomeIdB && pair.outcomeTokenB.toLowerCase() === POLYGON_ERC1155_ADDRESS.toLowerCase()) ids.add(pair.outcomeIdB);
    });
    return Array.from(ids);
  }, [newOutcomePairs]);

  // Fetch market info for all outcome IDs
  const { data: marketInfos } = useMarketInfos(outcomeIds);

  // Create a map of outcome ID to market info for easy lookup
  const marketInfoMap = useMemo(() => {
    const map = new Map<string, PolymarketMarket>();
    outcomeIds.forEach((id, index) => {
      if (marketInfos?.[index]) {
        map.set(id, marketInfos[index]);
      }
    });
    return map;
  }, [outcomeIds, marketInfos]);

  const activities: VaultActivity[] = useMemo(() => {
    const depositActivities: VaultActivity[] = deposits.map((deposit: SubgraphDeposit) => ({
      id: deposit.id,
      type: 'deposit' as const,
      market: '', // blank for deposits
      outcomeTokensAmount: '', // blank for deposits
      usdCAmount: deposit.assets, // USDC amount from assets field
      user: deposit.sender, // use sender as the user who initiated the deposit
      transactionHash: deposit.transactionHash_,
      timestamp: parseInt(deposit.timestamp_),
    }));

    console.log('Deposit Activities:', depositActivities);

    const withdrawalActivities: VaultActivity[] = withdrawals.map((withdrawal: SubgraphWithdrawal) => ({
      id: withdrawal.id,
      type: 'withdrawal' as const,
      market: '', // blank for withdrawals
      outcomeTokensAmount: '', // blank for withdrawals
      usdCAmount: withdrawal.assets, // USDC amount from assets field
      user: withdrawal.sender, // use sender as the user who initiated the withdrawal
      transactionHash: withdrawal.transactionHash_,
      timestamp: parseInt(withdrawal.timestamp_),
    }));

    console.log('Withdrawal Activities:', withdrawalActivities);

    const newOutcomePairActivities: VaultActivity[] = newOutcomePairs.map((pair: SubgraphNewOppositeOutcomeTokenPairAdded) => {
      // Get market info for both outcome tokens
      const marketInfoA = marketInfoMap.get(pair.outcomeIdA);
      const marketInfoB = marketInfoMap.get(pair.outcomeIdB);

      let marketString = `Polymarket Token (ID: ${pair.outcomeIdA}) ↔️ Opinion Token (ID: ${pair.outcomeIdB})`;

      console.log('Market Info A:', marketInfoA);
      console.log('Market Info B:', marketInfoB);

      // If we have market info for either token, use it
      if (marketInfoA?.question) {
        marketString = `${marketInfoA.question}`;
      } else if (marketInfoB?.question) {
        marketString = `${marketInfoB.question} `;
      }

      return {
        id: pair.id,
        type: 'new-outcome-pair' as const,
        market: marketString,
        outcomeTokensAmount: '', // null for new-outcome-pair
        usdCAmount: '', // null for new-outcome-pair
        user: '', // not available in subgraph for this event
        transactionHash: pair.transactionHash_,
        timestamp: parseInt(pair.timestamp_),
      };
    });

    console.log('New Outcome Pair Activities:', newOutcomePairActivities);

    // Combine and sort by timestamp (most recent first)
    return [...depositActivities, ...withdrawalActivities, ...newOutcomePairActivities]
      .sort((a, b) => b.timestamp - a.timestamp);
  }, [deposits, withdrawals, newOutcomePairs, marketInfoMap]);

  return {
    activities,
    isLoading: depositsLoading || withdrawalsLoading || outcomePairsLoading,
    error: depositsError || withdrawalsError || outcomePairsError,
  };
}