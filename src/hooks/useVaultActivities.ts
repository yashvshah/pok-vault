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
import { formatUnits } from 'viem';
import { VAULT_OWNER_ADDRESS } from '../config/addresses';
import { providerRegistry } from '../services/providers';
import type { UnifiedMarketInfo } from '../services/marketInfo';

/**
 * Get display name for a platform ID using provider registry
 */
function getPlatformDisplayName(platformId: string): string {
  const provider = providerRegistry.getById(platformId);
  return provider?.name || platformId;
}

export function useVaultActivities(limit = 100) {
  const { data: deposits = [], isLoading: depositsLoading, error: depositsError } = useDeposits(limit);
  const { data: withdrawals = [], isLoading: withdrawalsLoading, error: withdrawalsError } = useWithdrawals(limit);
  const { data: newOutcomePairs = [], isLoading: newOutcomePairsLoading, error: newOutcomePairsError } = useNewOutcomePairs(limit);
  const { data: removedOutcomePairs = [], isLoading: removedOutcomePairsLoading, error: removedOutcomePairsError } = useRemovedOutcomePairs(limit);
  const { data: pausedOutcomePairs = [], isLoading: pausedOutcomePairsLoading, error: pausedOutcomePairsError } = usePausedOutcomePairs(limit);
  const { data: profitLossReported = [], isLoading: profitLossReportedLoading, error: profitLossReportedError } = useProfitLossReported(limit);
  const { data: earlyExits = [], isLoading: earlyExitsLoading, error: earlyExitsError } = useEarlyExits(limit);
  const { data: splitOutcomeTokens = [], isLoading: splitOutcomeTokensLoading, error: splitOutcomeTokensError } = useSplitOutcomeTokens(limit);

  const USDT_DECIMALS = 18 as const;

  // Get all unique outcome IDs with their token addresses from all outcome-related events
  const marketInfoInputs = useMemo(() => {
    const inputMap = new Map<string, { outcomeId: string; tokenAddress: string }>();
    
    // Helper to add to map with unique key
    const addInput = (outcomeId: string, tokenAddress: string) => {
      const key = `${tokenAddress}-${outcomeId}`;
      if (!inputMap.has(key)) {
        inputMap.set(key, { outcomeId, tokenAddress });
      }
    };
    
    // New outcome pairs
    newOutcomePairs.forEach((pair) => {
      if (pair.outcomeIdA) addInput(pair.outcomeIdA, pair.outcomeTokenA);
      if (pair.outcomeIdB) addInput(pair.outcomeIdB, pair.outcomeTokenB);
    });
    
    // Removed outcome pairs
    removedOutcomePairs.forEach((pair) => {
      if (pair.outcomeIdA) addInput(pair.outcomeIdA, pair.outcomeTokenA);
      if (pair.outcomeIdB) addInput(pair.outcomeIdB, pair.outcomeTokenB);
    });
    
    // Paused outcome pairs
    pausedOutcomePairs.forEach((pair) => {
      if (pair.outcomeIdA) addInput(pair.outcomeIdA, pair.outcomeTokenA);
      if (pair.outcomeIdB) addInput(pair.outcomeIdB, pair.outcomeTokenB);
    });
    
    // Profit/Loss reported
    profitLossReported.forEach((event) => {
      if (event.outcomeIdA) addInput(event.outcomeIdA, event.outcomeTokenA);
      if (event.outcomeIdB) addInput(event.outcomeIdB, event.outcomeTokenB);
    });
    
    // Early exits
    earlyExits.forEach((event) => {
      if (event.outcomeIdA) addInput(event.outcomeIdA, event.outcomeTokenA);
      if (event.outcomeIdB) addInput(event.outcomeIdB, event.outcomeTokenB);
    });
    
    // Split outcome tokens
    splitOutcomeTokens.forEach((event) => {
      if (event.outcomeIdA) addInput(event.outcomeIdA, event.outcomeTokenA);
      if (event.outcomeIdB) addInput(event.outcomeIdB, event.outcomeTokenB);
    });
    
    return Array.from(inputMap.values());
  }, [newOutcomePairs, removedOutcomePairs, pausedOutcomePairs, profitLossReported, earlyExits, splitOutcomeTokens]);

  // Fetch market info for all outcome IDs
  const { data: marketInfos } = useMarketInfos(marketInfoInputs);

  // Create a map of outcome ID + token address to market info for easy lookup
  const marketInfoMap = useMemo(() => {
    const map = new Map<string, UnifiedMarketInfo>();
    marketInfoInputs.forEach((input, index) => {
      if (marketInfos?.[index]) {
        const key = `${input.tokenAddress}-${input.outcomeId}`;
        map.set(key, marketInfos[index]);
      }
    });
    return map;
  }, [marketInfoInputs, marketInfos]);

  const activities: VaultActivity[] = useMemo(() => {
    const depositActivities: VaultActivity[] = deposits.map((deposit: SubgraphDeposit) => ({
      id: deposit.id,
      type: 'deposit' as const,
      market: '', // blank for deposits
      outcomeTokensAmount: '', // blank for deposits
      USDTAmount: formatUnits(BigInt(deposit.assets), USDT_DECIMALS), // USDT amount from assets field
      user: deposit.sender, // use sender as the user who initiated the deposit
      transactionHash: deposit.transactionHash_,
      timestamp: parseInt(deposit.timestamp_),
    }));
    const withdrawalActivities: VaultActivity[] = withdrawals.map((withdrawal: SubgraphWithdrawal) => ({
      id: withdrawal.id,
      type: 'withdrawal' as const,
      market: '', // blank for withdrawals
      outcomeTokensAmount: '', // blank for withdrawals
      USDTAmount: formatUnits(BigInt(withdrawal.assets), USDT_DECIMALS), // USDT amount from assets field
      user: withdrawal.sender, // use sender as the user who initiated the withdrawal
      transactionHash: withdrawal.transactionHash_,
      timestamp: parseInt(withdrawal.timestamp_),
    }));

    const newOutcomePairActivities: VaultActivity[] = newOutcomePairs.map((pair: SubgraphNewOppositeOutcomeTokenPairAdded) => {
      // Get market info for both outcome tokens
      const keyA = `${pair.outcomeTokenA}-${pair.outcomeIdA}`;
      const keyB = `${pair.outcomeTokenB}-${pair.outcomeIdB}`;
      const marketInfoA = marketInfoMap.get(keyA);
      const marketInfoB = marketInfoMap.get(keyB);

      let marketString = `Token A (ID: ${pair.outcomeIdA}) ↔️ Token B (ID: ${pair.outcomeIdB})`;

      // Build market string with both platform info
      if (marketInfoA?.question && marketInfoB?.question) {
        marketString = `${marketInfoA.question} (${getPlatformDisplayName(marketInfoA.platform)}) ↔️ ${marketInfoB.question} (${getPlatformDisplayName(marketInfoB.platform)})`;
      } else if (marketInfoA?.question) {
        marketString = `${marketInfoA.question} (${getPlatformDisplayName(marketInfoA.platform)})`;
      } else if (marketInfoB?.question) {
        marketString = `${marketInfoB.question} (${getPlatformDisplayName(marketInfoB.platform)})`;
      }

      return {
        id: pair.id,
        type: 'new-outcome-pair' as const,
        market: marketString,
        outcomeTokensAmount: '', // null for new-outcome-pair
        USDTAmount: '', // null for new-outcome-pair
        user: VAULT_OWNER_ADDRESS,
        userLabel: 'Owner',
        transactionHash: pair.transactionHash_,
        timestamp: parseInt(pair.timestamp_),
      };
    });

    const removedOutcomePairActivities: VaultActivity[] = removedOutcomePairs.map((pair: SubgraphOppositeOutcomeTokenPairRemoved) => {
      const keyA = `${pair.outcomeTokenA}-${pair.outcomeIdA}`;
      const keyB = `${pair.outcomeTokenB}-${pair.outcomeIdB}`;
      const marketInfoA = marketInfoMap.get(keyA);
      const marketInfoB = marketInfoMap.get(keyB);

      let marketString = `Token A (ID: ${pair.outcomeIdA}) ↔️ Token B (ID: ${pair.outcomeIdB})`;

      if (marketInfoA?.question && marketInfoB?.question) {
        marketString = `${marketInfoA.question} (${getPlatformDisplayName(marketInfoA.platform)}) ↔️ ${marketInfoB.question} (${getPlatformDisplayName(marketInfoB.platform)})`;
      } else if (marketInfoA?.question) {
        marketString = `${marketInfoA.question} (${getPlatformDisplayName(marketInfoA.platform)})`;
      } else if (marketInfoB?.question) {
        marketString = `${marketInfoB.question} (${getPlatformDisplayName(marketInfoB.platform)})`;
      }

      return {
        id: pair.id,
        type: 'removed-outcome-pair' as const,
        market: marketString,
        outcomeTokensAmount: '',
        USDTAmount: '',
        user: VAULT_OWNER_ADDRESS,
        userLabel: 'Owner',
        transactionHash: pair.transactionHash_,
        timestamp: parseInt(pair.timestamp_),
      };
    });

    const pausedOutcomePairActivities: VaultActivity[] = pausedOutcomePairs.map((pair: SubgraphOppositeOutcomeTokenPairPaused) => {
      const keyA = `${pair.outcomeTokenA}-${pair.outcomeIdA}`;
      const keyB = `${pair.outcomeTokenB}-${pair.outcomeIdB}`;
      const marketInfoA = marketInfoMap.get(keyA);
      const marketInfoB = marketInfoMap.get(keyB);

      let marketString = `Token A (ID: ${pair.outcomeIdA}) ↔️ Token B (ID: ${pair.outcomeIdB})`;

      if (marketInfoA?.question && marketInfoB?.question) {
        marketString = `${marketInfoA.question} (${getPlatformDisplayName(marketInfoA.platform)}) ↔️ ${marketInfoB.question} (${getPlatformDisplayName(marketInfoB.platform)})`;
      } else if (marketInfoA?.question) {
        marketString = `${marketInfoA.question} (${getPlatformDisplayName(marketInfoA.platform)})`;
      } else if (marketInfoB?.question) {
        marketString = `${marketInfoB.question} (${getPlatformDisplayName(marketInfoB.platform)})`;
      }

      return {
        id: pair.id,
        type: 'paused-outcome-pair' as const,
        market: marketString,
        outcomeTokensAmount: '',
        USDTAmount: '',
        user: VAULT_OWNER_ADDRESS,
        userLabel: 'Owner',
        transactionHash: pair.transactionHash_,
        timestamp: parseInt(pair.timestamp_),
      };
    });

    const profitLossReportedActivities: VaultActivity[] = profitLossReported.map((event: SubgraphProfitOrLossReported) => {
      const keyA = `${event.outcomeTokenA}-${event.outcomeIdA}`;
      const keyB = `${event.outcomeTokenB}-${event.outcomeIdB}`;
      const marketInfoA = marketInfoMap.get(keyA);
      const marketInfoB = marketInfoMap.get(keyB);

      let marketString = `Token A (ID: ${event.outcomeIdA}) ↔️ Token B (ID: ${event.outcomeIdB})`;

      if (marketInfoA?.question && marketInfoB?.question) {
        marketString = `${marketInfoA.question} (${getPlatformDisplayName(marketInfoA.platform)}) ↔️ ${marketInfoB.question} (${getPlatformDisplayName(marketInfoB.platform)})`;
      } else if (marketInfoA?.question) {
        marketString = `${marketInfoA.question} (${getPlatformDisplayName(marketInfoA.platform)})`;
      } else if (marketInfoB?.question) {
        marketString = `${marketInfoB.question} (${getPlatformDisplayName(marketInfoB.platform)})`;
      }

      return {
        id: event.id,
        type: 'profit-loss-reported' as const,
        market: marketString,
        outcomeTokensAmount: '',
        USDTAmount: event.profitOrLoss, // profit/loss amount in USDT
        user: VAULT_OWNER_ADDRESS,
        userLabel: 'Owner',
        transactionHash: event.transactionHash_,
        timestamp: parseInt(event.timestamp_),
      };
    });

    const earlyExitActivities: VaultActivity[] = earlyExits.map((event: SubgraphEarlyExit) => {
      const keyA = `${event.outcomeTokenA}-${event.outcomeIdA}`;
      const keyB = `${event.outcomeTokenB}-${event.outcomeIdB}`;
      const marketInfoA = marketInfoMap.get(keyA);
      const marketInfoB = marketInfoMap.get(keyB);

      let marketString = `Token A (ID: ${event.outcomeIdA}) ↔️ Token B (ID: ${event.outcomeIdB})`;

      if (marketInfoA?.question && marketInfoB?.question) {
        marketString = `${marketInfoA.question} (${getPlatformDisplayName(marketInfoA.platform)}) ↔️ ${marketInfoB.question} (${getPlatformDisplayName(marketInfoB.platform)})`;
      } else if (marketInfoA?.question) {
        marketString = `${marketInfoA.question} (${getPlatformDisplayName(marketInfoA.platform)})`;
      } else if (marketInfoB?.question) {
        marketString = `${marketInfoB.question} (${getPlatformDisplayName(marketInfoB.platform)})`;
      }

      return {
        id: event.id,
        type: 'early-exit' as const,
        market: marketString,
        outcomeTokensAmount: event.amount, // outcome token amount
        USDTAmount: event.exitAmount, // USDT exit amount
        user: '', // not available in subgraph
        transactionHash: event.transactionHash_,
        timestamp: parseInt(event.timestamp_),
      };
    });

    const splitOutcomeTokensActivities: VaultActivity[] = splitOutcomeTokens.map((event: SubgraphSplitOppositeOutcomeTokens) => {
      const keyA = `${event.outcomeTokenA}-${event.outcomeIdA}`;
      const keyB = `${event.outcomeTokenB}-${event.outcomeIdB}`;
      const marketInfoA = marketInfoMap.get(keyA);
      const marketInfoB = marketInfoMap.get(keyB);

      let marketString = `Token A (ID: ${event.outcomeIdA}) ↔️ Token B (ID: ${event.outcomeIdB})`;

      if (marketInfoA?.question && marketInfoB?.question) {
        marketString = `${marketInfoA.question} (${getPlatformDisplayName(marketInfoA.platform)}) ↔️ ${marketInfoB.question} (${getPlatformDisplayName(marketInfoB.platform)})`;
      } else if (marketInfoA?.question) {
        marketString = `${marketInfoA.question} (${getPlatformDisplayName(marketInfoA.platform)})`;
      } else if (marketInfoB?.question) {
        marketString = `${marketInfoB.question} (${getPlatformDisplayName(marketInfoB.platform)})`;
      }

      return {
        id: event.id,
        type: 'split-outcome-tokens' as const,
        market: marketString,
        outcomeTokensAmount: event.amount, // outcome token amount
        USDTAmount: '', // no USDT amount for split
        user: '', // not available in subgraph
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