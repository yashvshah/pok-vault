import { useMemo } from 'react';
import { useDeposits } from './activities/useDeposits';
import { useWithdrawals } from './activities/useWithdrawals';
import { useNewOutcomePairs } from './activities/useNewOutcomePairs';
import { useRemovedOutcomePairs } from './activities/useRemovedOutcomePairs';
import { usePausedOutcomePairs } from './activities/usePausedOutcomePairs';
import { useProfitLossReported } from './activities/useProfitLossReported';
import { useEarlyExits } from './activities/useEarlyExits';
import { useSplitOutcomeTokens } from './activities/useSplitOutcomeTokens';
import { useMarketInfos } from './useMarketInfos';
import type { VaultActivity, SubgraphDeposit, SubgraphWithdrawal, SubgraphNewOppositeOutcomeTokenPairAdded, SubgraphOppositeOutcomeTokenPairRemoved, SubgraphOppositeOutcomeTokenPairPaused, SubgraphProfitOrLossReported, SubgraphEarlyExit, SubgraphSplitOppositeOutcomeTokens } from '../types/vault';
import type { PolymarketMarket } from '../services/polymarket';

export function useVaultActivities(limit = 100) {
  const { data: deposits = [], isLoading: depositsLoading, error: depositsError } = useDeposits(limit);
  const { data: withdrawals = [], isLoading: withdrawalsLoading, error: withdrawalsError } = useWithdrawals(limit);
  const { data: newOutcomePairs = [], isLoading: newOutcomePairsLoading, error: newOutcomePairsError } = useNewOutcomePairs(limit);
  const { data: removedOutcomePairs = [], isLoading: removedOutcomePairsLoading, error: removedOutcomePairsError } = useRemovedOutcomePairs(limit);
  const { data: pausedOutcomePairs = [], isLoading: pausedOutcomePairsLoading, error: pausedOutcomePairsError } = usePausedOutcomePairs(limit);
  const { data: profitLossReported = [], isLoading: profitLossReportedLoading, error: profitLossReportedError } = useProfitLossReported(limit);
  const { data: earlyExits = [], isLoading: earlyExitsLoading, error: earlyExitsError } = useEarlyExits(limit);
  const { data: splitOutcomeTokens = [], isLoading: splitOutcomeTokensLoading, error: splitOutcomeTokensError } = useSplitOutcomeTokens(limit);

  const POLYGON_ERC1155_ADDRESS = '0x4d97dcd97ec945f40cf65f87097ace5ea0476045';

  // Get all unique outcome IDs from all outcome-related events
  const outcomeIds = useMemo(() => {
    const ids = new Set<string>();
    
    // New outcome pairs
    newOutcomePairs.forEach((pair) => {
      if (pair.outcomeIdA && pair.outcomeTokenA.toLowerCase() === POLYGON_ERC1155_ADDRESS.toLowerCase()) ids.add(pair.outcomeIdA);
      if (pair.outcomeIdB && pair.outcomeTokenB.toLowerCase() === POLYGON_ERC1155_ADDRESS.toLowerCase()) ids.add(pair.outcomeIdB);
    });
    
    // Removed outcome pairs
    removedOutcomePairs.forEach((pair) => {
      if (pair.outcomeIdA && pair.outcomeTokenA.toLowerCase() === POLYGON_ERC1155_ADDRESS.toLowerCase()) ids.add(pair.outcomeIdA);
      if (pair.outcomeIdB && pair.outcomeTokenB.toLowerCase() === POLYGON_ERC1155_ADDRESS.toLowerCase()) ids.add(pair.outcomeIdB);
    });
    
    // Paused outcome pairs
    pausedOutcomePairs.forEach((pair) => {
      if (pair.outcomeIdA && pair.outcomeTokenA.toLowerCase() === POLYGON_ERC1155_ADDRESS.toLowerCase()) ids.add(pair.outcomeIdA);
      if (pair.outcomeIdB && pair.outcomeTokenB.toLowerCase() === POLYGON_ERC1155_ADDRESS.toLowerCase()) ids.add(pair.outcomeIdB);
    });
    
    // Profit/Loss reported
    profitLossReported.forEach((event) => {
      if (event.outcomeIdA && event.outcomeTokenA.toLowerCase() === POLYGON_ERC1155_ADDRESS.toLowerCase()) ids.add(event.outcomeIdA);
      if (event.outcomeIdB && event.outcomeTokenB.toLowerCase() === POLYGON_ERC1155_ADDRESS.toLowerCase()) ids.add(event.outcomeIdB);
    });
    
    // Early exits
    earlyExits.forEach((event) => {
      if (event.outcomeIdA && event.outcomeTokenA.toLowerCase() === POLYGON_ERC1155_ADDRESS.toLowerCase()) ids.add(event.outcomeIdA);
      if (event.outcomeIdB && event.outcomeTokenB.toLowerCase() === POLYGON_ERC1155_ADDRESS.toLowerCase()) ids.add(event.outcomeIdB);
    });
    
    // Split outcome tokens
    splitOutcomeTokens.forEach((event) => {
      if (event.outcomeIdA && event.outcomeTokenA.toLowerCase() === POLYGON_ERC1155_ADDRESS.toLowerCase()) ids.add(event.outcomeIdA);
      if (event.outcomeIdB && event.outcomeTokenB.toLowerCase() === POLYGON_ERC1155_ADDRESS.toLowerCase()) ids.add(event.outcomeIdB);
    });
    
    return Array.from(ids);
  }, [newOutcomePairs, removedOutcomePairs, pausedOutcomePairs, profitLossReported, earlyExits, splitOutcomeTokens]);

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

    const newOutcomePairActivities: VaultActivity[] = newOutcomePairs.map((pair: SubgraphNewOppositeOutcomeTokenPairAdded) => {
      // Get market info for both outcome tokens
      const marketInfoA = marketInfoMap.get(pair.outcomeIdA);
      const marketInfoB = marketInfoMap.get(pair.outcomeIdB);

      let marketString = `Polymarket Token (ID: ${pair.outcomeIdA}) ↔️ Opinion Token (ID: ${pair.outcomeIdB})`;

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

    const removedOutcomePairActivities: VaultActivity[] = removedOutcomePairs.map((pair: SubgraphOppositeOutcomeTokenPairRemoved) => {
      const marketInfoA = marketInfoMap.get(pair.outcomeIdA);
      const marketInfoB = marketInfoMap.get(pair.outcomeIdB);

      let marketString = `Polymarket Token (ID: ${pair.outcomeIdA}) ↔️ Opinion Token (ID: ${pair.outcomeIdB})`;

      if (marketInfoA?.question) {
        marketString = `${marketInfoA.question}`;
      } else if (marketInfoB?.question) {
        marketString = `${marketInfoB.question} `;
      }

      return {
        id: pair.id,
        type: 'removed-outcome-pair' as const,
        market: marketString,
        outcomeTokensAmount: '',
        usdCAmount: '',
        user: '',
        transactionHash: pair.transactionHash_,
        timestamp: parseInt(pair.timestamp_),
      };
    });

    const pausedOutcomePairActivities: VaultActivity[] = pausedOutcomePairs.map((pair: SubgraphOppositeOutcomeTokenPairPaused) => {
      const marketInfoA = marketInfoMap.get(pair.outcomeIdA);
      const marketInfoB = marketInfoMap.get(pair.outcomeIdB);

      let marketString = `Polymarket Token (ID: ${pair.outcomeIdA}) ↔️ Opinion Token (ID: ${pair.outcomeIdB})`;

      if (marketInfoA?.question) {
        marketString = `${marketInfoA.question}`;
      } else if (marketInfoB?.question) {
        marketString = `${marketInfoB.question} `;
      }

      return {
        id: pair.id,
        type: 'paused-outcome-pair' as const,
        market: marketString,
        outcomeTokensAmount: '',
        usdCAmount: '',
        user: '',
        transactionHash: pair.transactionHash_,
        timestamp: parseInt(pair.timestamp_),
      };
    });

    const profitLossReportedActivities: VaultActivity[] = profitLossReported.map((event: SubgraphProfitOrLossReported) => {
      const marketInfoA = marketInfoMap.get(event.outcomeIdA);
      const marketInfoB = marketInfoMap.get(event.outcomeIdB);

      let marketString = `Polymarket Token (ID: ${event.outcomeIdA}) ↔️ Opinion Token (ID: ${event.outcomeIdB})`;

      if (marketInfoA?.question) {
        marketString = `${marketInfoA.question}`;
      } else if (marketInfoB?.question) {
        marketString = `${marketInfoB.question} `;
      }

      return {
        id: event.id,
        type: 'profit-loss-reported' as const,
        market: marketString,
        outcomeTokensAmount: '',
        usdCAmount: event.profitOrLoss, // profit/loss amount in USDC
        user: '',
        transactionHash: event.transactionHash_,
        timestamp: parseInt(event.timestamp_),
      };
    });

    const earlyExitActivities: VaultActivity[] = earlyExits.map((event: SubgraphEarlyExit) => {
      const marketInfoA = marketInfoMap.get(event.outcomeIdA);
      const marketInfoB = marketInfoMap.get(event.outcomeIdB);

      let marketString = `Polymarket Token (ID: ${event.outcomeIdA}) ↔️ Opinion Token (ID: ${event.outcomeIdB})`;

      if (marketInfoA?.question) {
        marketString = `${marketInfoA.question}`;
      } else if (marketInfoB?.question) {
        marketString = `${marketInfoB.question} `;
      }

      return {
        id: event.id,
        type: 'early-exit' as const,
        market: marketString,
        outcomeTokensAmount: event.amount, // outcome token amount
        usdCAmount: event.exitAmount, // USDC exit amount
        user: '',
        transactionHash: event.transactionHash_,
        timestamp: parseInt(event.timestamp_),
      };
    });

    const splitOutcomeTokensActivities: VaultActivity[] = splitOutcomeTokens.map((event: SubgraphSplitOppositeOutcomeTokens) => {
      const marketInfoA = marketInfoMap.get(event.outcomeIdA);
      const marketInfoB = marketInfoMap.get(event.outcomeIdB);

      let marketString = `Polymarket Token (ID: ${event.outcomeIdA}) ↔️ Opinion Token (ID: ${event.outcomeIdB})`;

      if (marketInfoA?.question) {
        marketString = `${marketInfoA.question}`;
      } else if (marketInfoB?.question) {
        marketString = `${marketInfoB.question} `;
      }

      return {
        id: event.id,
        type: 'split-outcome-tokens' as const,
        market: marketString,
        outcomeTokensAmount: event.amount, // outcome token amount
        usdCAmount: '', // no USDC amount for split
        user: '',
        transactionHash: event.transactionHash_,
        timestamp: parseInt(event.timestamp_),
      };
    });

    // Combine and sort by timestamp (most recent first)
    return [
      ...depositActivities,
      ...withdrawalActivities,
      ...newOutcomePairActivities,
      ...removedOutcomePairActivities,
      ...pausedOutcomePairActivities,
      ...profitLossReportedActivities,
      ...earlyExitActivities,
      ...splitOutcomeTokensActivities
    ].sort((a, b) => b.timestamp - a.timestamp);
  }, [deposits, withdrawals, newOutcomePairs, removedOutcomePairs, pausedOutcomePairs, profitLossReported, earlyExits, splitOutcomeTokens, marketInfoMap]);

  return {
    activities,
    isLoading: depositsLoading || withdrawalsLoading || newOutcomePairsLoading || removedOutcomePairsLoading || pausedOutcomePairsLoading || profitLossReportedLoading || earlyExitsLoading || splitOutcomeTokensLoading,
    error: depositsError || withdrawalsError || newOutcomePairsError || removedOutcomePairsError || pausedOutcomePairsError || profitLossReportedError || earlyExitsError || splitOutcomeTokensError,
  };
}