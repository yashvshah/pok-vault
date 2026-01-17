import { useQuery } from '@tanstack/react-query';
import { useNewOutcomePairs } from './activities/useNewOutcomePairs';
import { usePausedOutcomePairs } from './activities/usePausedOutcomePairs';
import { useRemovedOutcomePairs } from './activities/useRemovedOutcomePairs';
import { marketInfoService } from '../services/marketInfo';
import { keccak256, encodePacked } from 'viem';

export type MarketStatus = 'allowed' | 'paused' | 'removed';

export interface OutcomeTokenPair {
  key: string;
  outcomeTokenA: string;
  outcomeIdA: string;
  outcomeTokenB: string;
  outcomeIdB: string;
  earlyExitAmountContract: string;
  decimalsA: number;
  decimalsB: number;
  status: MarketStatus;
  timestamp: number;
}

export interface SupportedMarket {
  marketKey: string; // Unique identifier: poly-{polymarketId}_opinion-{opinionId}
  question: string;
  polymarketQuestion?: string;
  opinionQuestion?: string;
  polymarketImage?: string;
  opinionThumbnail?: string;
  polymarketYesTokenId?: string;
  polymarketNoTokenId?: string;
  opinionYesTokenId?: string;
  opinionNoTokenId?: string;
  pairs: OutcomeTokenPair[]; // Can have up to 2 pairs (YES Poly + NO Opinion, NO Poly + YES Opinion)
  overallStatus: MarketStatus; // The "best" status among all pairs (allowed > paused > removed)
}

// Helper to create a deterministic key for outcome token pairs
function createPairKey(
  tokenA: string,
  idA: string,
  tokenB: string,
  idB: string
): string {
  const bigIntA = BigInt(idA);
  const bigIntB = BigInt(idB);
  
  // Sort by address first, then by ID
  const addrComparison = tokenA.toLowerCase().localeCompare(tokenB.toLowerCase());
  
  let addr1: string, id1: bigint, addr2: string, id2: bigint;
  
  if (addrComparison < 0 || (addrComparison === 0 && bigIntA < bigIntB)) {
    addr1 = tokenA;
    id1 = bigIntA;
    addr2 = tokenB;
    id2 = bigIntB;
  } else {
    addr1 = tokenB;
    id1 = bigIntB;
    addr2 = tokenA;
    id2 = bigIntA;
  }
  
  return keccak256(
    encodePacked(
      ["address", "uint256", "address", "uint256"],
      [addr1 as `0x${string}`, id1, addr2 as `0x${string}`, id2]
    )
  );
}

// Helper to create a market key from polymarket and opinion market IDs
function createMarketKey(
  polymarketId?: string,
  opinionId?: string | number
): string {
  if (!polymarketId || !opinionId) {
    return '';
  }
  // Create a simple, deterministic key from both market IDs
  return `poly-${polymarketId}_opinion-${opinionId}`;
}

export function useSupportedMarkets() {
  const { data: newPairs = [], isLoading: isLoadingNew } = useNewOutcomePairs();
  const { data: pausedPairs = [], isLoading: isLoadingPaused } = usePausedOutcomePairs();
  const { data: removedPairs = [], isLoading: isLoadingRemoved } = useRemovedOutcomePairs();

  return useQuery({
    queryKey: ['supported-markets', newPairs, pausedPairs, removedPairs],
    queryFn: async (): Promise<SupportedMarket[]> => {
      // Create lookup maps for paused and removed pairs with timestamps
      const pausedMap = new Map<string, number>();
      pausedPairs.forEach(p => {
        const key = createPairKey(p.outcomeTokenA, p.outcomeIdA, p.outcomeTokenB, p.outcomeIdB);
        const timestamp = parseInt(p.timestamp_);
        // Keep the most recent paused event for this pair
        if (!pausedMap.has(key) || pausedMap.get(key)! < timestamp) {
          pausedMap.set(key, timestamp);
        }
      });

      const removedMap = new Map<string, number>();
      removedPairs.forEach(p => {
        const key = createPairKey(p.outcomeTokenA, p.outcomeIdA, p.outcomeTokenB, p.outcomeIdB);
        const timestamp = parseInt(p.timestamp_);
        // Keep the most recent removed event for this pair
        if (!removedMap.has(key) || removedMap.get(key)! < timestamp) {
          removedMap.set(key, timestamp);
        }
      });

      console.log("fetched outcome token pairs:");

      // Map to store markets by their key
      const marketsMap = new Map<string, SupportedMarket>();

      // Process each new pair
      for (const pair of newPairs) {
        const pairKey = createPairKey(
          pair.outcomeTokenA,
          pair.outcomeIdA,
          pair.outcomeTokenB,
          pair.outcomeIdB
        );

        // Determine status based on most recent event
        const addedTimestamp = parseInt(pair.timestamp_);
        const pausedTimestamp = pausedMap.get(pairKey) || 0;
        const removedTimestamp = removedMap.get(pairKey) || 0;

        // Find the most recent event
        let status: MarketStatus = 'allowed';
        if (removedTimestamp > addedTimestamp && removedTimestamp > pausedTimestamp) {
          status = 'removed';
        } else if (pausedTimestamp > addedTimestamp && pausedTimestamp > removedTimestamp) {
          status = 'paused';
        } else {
          status = 'allowed';
        }

        // Fetch market info for both outcome tokens
        const [marketInfoA, marketInfoB] = await Promise.all([
          marketInfoService.getMarketInfoFromOutcomeToken(pair.outcomeIdA, pair.outcomeTokenA),
          marketInfoService.getMarketInfoFromOutcomeToken(pair.outcomeIdB, pair.outcomeTokenB),
        ]);

        if (!marketInfoA || !marketInfoB) {
          console.warn('Could not fetch market info for pair:', pairKey);
          continue;
        }

        // Extract market data from the fetched info
        const polymarketData = marketInfoA.platform === 'polymarket' 
          ? marketInfoA.polymarketData 
          : marketInfoB.polymarketData;
        const opinionData = marketInfoA.platform === 'opinion'
          ? marketInfoA.opinionData
          : marketInfoB.opinionData;

        // Skip if we don't have both market IDs
        if (!polymarketData?.id || !opinionData?.marketId) {
          console.warn('Missing market IDs for pair:', pairKey);
          continue;
        }

        // Create market key using the market IDs
        const marketKey = createMarketKey(
          polymarketData.id,
          opinionData.marketId
        );

        // Get or create market
        let market = marketsMap.get(marketKey);
        if (!market) {
          market = {
            marketKey,
            question: polymarketData.question || opinionData.marketTitle || 'Unknown Market',
            polymarketQuestion: polymarketData.question,
            opinionQuestion: opinionData.marketTitle,
            polymarketImage: polymarketData.image, // Use first outcome as placeholder
            opinionThumbnail: opinionData.thumbnailUrl,
            polymarketYesTokenId: polymarketData.yesTokenId,
            polymarketNoTokenId: polymarketData.noTokenId,
            opinionYesTokenId: opinionData.yesTokenId,
            opinionNoTokenId: opinionData.noTokenId,
            pairs: [],
            overallStatus: 'removed', // Will be updated
          };
          marketsMap.set(marketKey, market);
        }

       
        // Add this pair to the market
        market.pairs.push({
          key: pairKey,
          outcomeTokenA: pair.outcomeTokenA,
          outcomeIdA: pair.outcomeIdA,
          outcomeTokenB: pair.outcomeTokenB,
          outcomeIdB: pair.outcomeIdB,
          earlyExitAmountContract: pair.earlyExitAmountContract,
          decimalsA: parseInt(pair.decimalsA),
          decimalsB: parseInt(pair.decimalsB),
          status,
          timestamp: parseInt(pair.timestamp_),
        });

        // Update overall status (allowed > paused > removed)
        if (status === 'allowed') {
          market.overallStatus = 'allowed';
        } else if (status === 'paused' && market.overallStatus !== 'allowed') {
          market.overallStatus = 'paused';
        }
      }

      console.log("processed everything");

      // Convert map to array and sort by timestamp (newest first)
      return Array.from(marketsMap.values()).sort((a, b) => {
        const aTime = Math.max(...a.pairs.map(p => p.timestamp));
        const bTime = Math.max(...b.pairs.map(p => p.timestamp));
        return bTime - aTime;
      });
    },
    enabled: !isLoadingNew && !isLoadingPaused && !isLoadingRemoved,
    staleTime: 30000, // 30 seconds
  });
}
