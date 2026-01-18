// Unified service for fetching market information from any registered prediction market provider
import type { Address } from 'viem';
import { providerRegistry, type MarketData, type PredictionMarketProvider } from './providers';
import { POLYGON_ERC1155_BRIDGED_BSC_OLD_BUGGY_ADDRESS } from '../config/addresses';

// Legacy type exports for backward compatibility
import type { PolymarketMarket } from './providers/polymarketProvider';
import type { OpinionMarket } from './providers/opinionProvider';
export type { PolymarketMarket, OpinionMarket };

/**
 * Unified market info returned by the service
 * Extends MarketData with provider information
 */
export interface UnifiedMarketInfo {
  question: string;
  platform: string; // Provider ID (e.g., 'polymarket', 'opinion')
  provider: PredictionMarketProvider;
  marketData: MarketData;
  // Legacy fields for backward compatibility
  polymarketData?: PolymarketMarket;
  opinionData?: OpinionMarket;
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
      const result: UnifiedMarketInfo = {
        question: marketData.question,
        platform: provider.id,
        provider,
        marketData,
      };

      // Add legacy fields for backward compatibility
      if (provider.id === 'polymarket') {
        result.polymarketData = marketData.rawData as PolymarketMarket;
      } else if (provider.id === 'opinion') {
        result.opinionData = marketData.rawData as OpinionMarket;
      }

      return result;
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
}

export const marketInfoService = new MarketInfoService();

