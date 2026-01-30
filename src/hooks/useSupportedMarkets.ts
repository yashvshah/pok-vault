import { useQuery } from '@tanstack/react-query';
import { useNewOutcomePairs } from './activities/useNewOutcomePairs';
import { usePausedOutcomePairs } from './activities/usePausedOutcomePairs';
import { useRemovedOutcomePairs } from './activities/useRemovedOutcomePairs';
import { marketInfoService, type UnifiedMarketInfo } from '../services/marketInfo';
import { keccak256, encodePacked } from 'viem';

export type MarketStatus = 'allowed' | 'paused' | 'removed';

export interface OutcomeTokenPair {
  key: string;
  outcomeTokenA: string;
  outcomeIdA: string;
  outcomeIdAIsYesTokenId: boolean; // this indicates wether this particular tokenId is yes tokenId for their respective market or not
  outcomeTokenB: string;
  outcomeIdB: string;
  outcomeIdBIsYesTokenId: boolean;
  earlyExitAmountContract: string;
  decimalsA: number;
  decimalsB: number;
  status: MarketStatus;
  timestamp: number;
}

export interface SupportedMarket {
  marketKey: string; // Unique identifier: {providerA}-{marketIdA}_{providerB}-{marketIdB}
  question: string;
  // Provider-specific questions (dynamic based on registered providers)
  providerQuestions: Map<string, string>;
  // Provider-specific images/thumbnails
  providerImages: Map<string, string>;
  // Provider-specific token IDs
  providerTokenIds: Map<string, { yesTokenId: string; noTokenId: string }>;
  // Provider-specific token addresses (ERC1155)
  providerTokenAddresses: Map<string, string>;
  // Provider-specific URLs
  providerUrls: Map<string, string>;
  pairs: OutcomeTokenPair[]; // Can have up to 2 pairs (YES A + NO B, NO A + YES B)
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

/**
 * Create a deterministic market key from provider and market IDs
 * Supports any combination of providers (not just polymarket/opinion)
 */
function createMarketKey(
  markets: Array<{ providerId: string; marketId: string }>
): string {
  if (markets.length === 0) return '';
  
  // Sort by provider ID for deterministic ordering
  const sorted = [...markets].sort((a, b) => 
    a.providerId.localeCompare(b.providerId)
  );
  
  return sorted.map(m => `${m.providerId}-${m.marketId}`).join('_');
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

      // Collect all unique token pairs that need market info
      const tokensToFetch: Array<{ tokenAddress: string; outcomeTokenId: string }> = [];
      const pairKeysInOrder: string[] = [];

      for (const pair of newPairs) {
        const pairKey = createPairKey(
          pair.outcomeTokenA,
          pair.outcomeIdA,
          pair.outcomeTokenB,
          pair.outcomeIdB
        );
        
        pairKeysInOrder.push(pairKey);
        tokensToFetch.push(
          { tokenAddress: pair.outcomeTokenA, outcomeTokenId: pair.outcomeIdA },
          { tokenAddress: pair.outcomeTokenB, outcomeTokenId: pair.outcomeIdB }
        );
      }

      // Batch fetch all market info at once
      const marketInfoMap = await marketInfoService.getMarketInfoBatch(tokensToFetch);

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

        // Get market info from batch results
        const keyA = `${pair.outcomeTokenA}-${pair.outcomeIdA}`;
        const keyB = `${pair.outcomeTokenB}-${pair.outcomeIdB}`;
        const marketInfoA = marketInfoMap.get(keyA);
        const marketInfoB = marketInfoMap.get(keyB);

        if (!marketInfoA || !marketInfoB) {
          console.warn('Could not fetch market info for pair:', pairKey);
          continue;
        }

        // Extract market IDs from both providers
        const marketIdA = marketInfoA.marketData.id;
        const marketIdB = marketInfoB.marketData.id;

        if (!marketIdA || !marketIdB) {
          console.warn('Missing market IDs for pair:', pairKey);
          continue;
        }

        // Create dynamic market key
        const marketKey = createMarketKey([
          { providerId: marketInfoA.platform, marketId: marketIdA },
          { providerId: marketInfoB.platform, marketId: marketIdB },
        ]);

        // Get or create market
        let market = marketsMap.get(marketKey);
        if (!market) {
          market = {
            marketKey,
            question: marketInfoA.marketData.question || marketInfoB.marketData.question || 'Unknown Market',
            providerQuestions: new Map(),
            providerImages: new Map(),
            providerTokenIds: new Map(),
            providerTokenAddresses: new Map(),
            providerUrls: new Map(),
            pairs: [],
            overallStatus: 'removed', // Will be updated
          };

          // Populate provider-specific data
          populateProviderData(market, marketInfoA);
          populateProviderData(market, marketInfoB);

          marketsMap.set(marketKey, market);
        }

       
        // Add this pair to the market
        market.pairs.push({
          key: pairKey,
          outcomeTokenA: pair.outcomeTokenA,
          outcomeIdA: pair.outcomeIdA,
          outcomeIdAIsYesTokenId: marketInfoA.marketData.yesTokenId === pair.outcomeIdA,
          outcomeTokenB: pair.outcomeTokenB,
          outcomeIdB: pair.outcomeIdB,
          outcomeIdBIsYesTokenId: marketInfoB.marketData.yesTokenId === pair.outcomeIdB,
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

/**
 * Populate provider-specific data in the market object
 */
function populateProviderData(market: SupportedMarket, marketInfo: UnifiedMarketInfo): void {
  const providerId = marketInfo.platform;
  const data = marketInfo.marketData;

  market.providerQuestions.set(providerId, data.question);
  
  if (data.thumbnailUrl) {
    market.providerImages.set(providerId, data.thumbnailUrl);
  }
  
  if (data.yesTokenId || data.noTokenId) {
    market.providerTokenIds.set(providerId, {
      yesTokenId: data.yesTokenId,
      noTokenId: data.noTokenId,
    });
  }
  
  // Set token address
  market.providerTokenAddresses.set(providerId, marketInfo.tokenAddress);
  
  if (data.url) {
    market.providerUrls.set(providerId, data.url);
  }else{
    // that means it's opinion market and we construct url differently
    //TODO: We need to abstract this better when we add more providers
    if(data.parentMarketId) {
      market.providerUrls.set(providerId, "https://app.opinion.trade/detail?topicId=" + data.parentMarketId + "&type=multi");
    } else {
      market.providerUrls.set(providerId, "https://app.opinion.trade/detail?topicId=" + data.id);
    }
  }
}
