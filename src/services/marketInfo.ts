// Unified service for fetching market information from any registered prediction market provider
import type { Address } from 'viem';
import { providerRegistry, type MarketData, type PredictionMarketProvider } from './providers';
import { POLYGON_ERC1155_BRIDGED_BSC_OLD_BUGGY_ADDRESS, MIDDLEWARE_BASE_URL } from '../config/addresses';

/**
 * Unified market info returned by the service
 * Extends MarketData with provider information
 */
export interface UnifiedMarketInfo {
  question: string;
  platform: string; // Provider ID (e.g., 'polymarket', 'opinion')
  provider: PredictionMarketProvider;
  marketData: MarketData;
}

class MarketInfoService {
  /**
   * Fetch market info from any registered provider based on token address
   */
  async getMarketInfoFromOutcomeToken(
    outcomeTokenId: string,
    tokenAddress: string
  ): Promise<UnifiedMarketInfo | null> {
    try {
      const normalizedAddress = tokenAddress.toLowerCase() as Address;

      // Handle legacy buggy address
      if (normalizedAddress === POLYGON_ERC1155_BRIDGED_BSC_OLD_BUGGY_ADDRESS.toLowerCase()) {
        const provider = providerRegistry.getById('polymarket');
        if (provider) {
          return {
            question: 'Test Event',
            platform: 'polymarket',
            provider,
            marketData: {
              id: 'test',
              question: 'Test Event',
              yesTokenId: '',
              noTokenId: '',
              status: 'closed',
            },
          };
        }
      }

      // Look up provider by token address
      const provider = providerRegistry.getByTokenAddress(normalizedAddress);
      
      if (!provider) {
        console.warn('No provider registered for token address:', tokenAddress);
        return null;
      }

      // Fetch market data from provider
      const marketData = await provider.getMarketByOutcomeToken(outcomeTokenId);
      
      if (!marketData) {
        console.warn(`Provider ${provider.id} returned no data for token:`, outcomeTokenId);
        return null;
      }

      // Build unified response
      return {
        question: marketData.question,
        platform: provider.id,
        provider,
        marketData,
      };
    } catch (error) {
      console.error('Error getting market info from outcome token:', error);
      return null;
    }
  }

  /**
   * Get all registered providers
   */
  getProviders(): PredictionMarketProvider[] {
    return providerRegistry.getAll();
  }

  /**
   * Get provider by ID
   */
  getProvider(providerId: string): PredictionMarketProvider | null {
    return providerRegistry.getById(providerId);
  }

  /**
   * Batch fetch market info for multiple outcome token pairs
   * Uses the middleware's /api/markets endpoint for efficient batching
   */
  async getMarketInfoBatch(
    tokens: Array<{ tokenAddress: string; outcomeTokenId: string }>
  ): Promise<Map<string, UnifiedMarketInfo>> {
    if (tokens.length === 0) {
      return new Map();
    }

    try {
      const response = await fetch(`${MIDDLEWARE_BASE_URL}/markets`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ tokens }),
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch batch market info: ${response.statusText}`);
      }

      const results: Array<{
        tokenAddress: string;
        outcomeTokenId: string;
        marketInfo: MarketData;
      }> = await response.json();

      // Map results to UnifiedMarketInfo format
      const marketInfoMap = new Map<string, UnifiedMarketInfo>();

      for (const result of results) {
        if (!result.marketInfo) {
          console.warn('No market info returned for:', result.tokenAddress, result.outcomeTokenId);
          continue;
        }

        const normalizedAddress = result.tokenAddress.toLowerCase() as Address;
        
        // Handle legacy buggy address
        if (normalizedAddress === POLYGON_ERC1155_BRIDGED_BSC_OLD_BUGGY_ADDRESS.toLowerCase()) {
          const provider = providerRegistry.getById('polymarket');
          if (provider) {
            const key = `${result.tokenAddress}-${result.outcomeTokenId}`;
            marketInfoMap.set(key, {
              question: 'Test Event',
              platform: 'polymarket',
              provider,
              marketData: {
                id: 'test',
                question: 'Test Event',
                yesTokenId: '',
                noTokenId: '',
                status: 'closed',
                thumbnailUrl: '',
              },
            });
          }
          continue;
        }

        // Look up provider by token address
        const provider = providerRegistry.getByTokenAddress(normalizedAddress);
        
        if (!provider) {
          console.warn('No provider registered for token address:', result.tokenAddress);
          continue;
        }

        // Create unified market info
        const key = `${result.tokenAddress}-${result.outcomeTokenId}`;
        marketInfoMap.set(key, {
          question: result.marketInfo.question || 'Unknown Market',
          platform: provider.id,
          provider,
          marketData: result.marketInfo,
        });
      }

      return marketInfoMap;
    } catch (error) {
      console.error('Error fetching batch market info:', error);
      return new Map();
    }
  }
}

export const marketInfoService = new MarketInfoService();

