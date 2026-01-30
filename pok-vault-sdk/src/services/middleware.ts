import type { Address } from 'viem';
import type { MiddlewareMarketResponse, MiddlewareMarketData } from '../types/markets';
import { MIDDLEWARE_BASE_URL, POLYGON_ERC1155_BRIDGED_BSC_ADDRESS, OPINION_ERC1155_ADDRESS } from '../config/constants';

export class MiddlewareService {
  private baseUrl: string;

  constructor(baseUrl: string = MIDDLEWARE_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  async fetchMarketInfoBatch(
    tokens: Array<{ tokenAddress: string; outcomeTokenId: string }>
  ): Promise<Map<string, { marketInfo: MiddlewareMarketData; providerId: string }>> {
    if (tokens.length === 0) {
      return new Map();
    }

    try {
      const response = await fetch(`${this.baseUrl}/markets`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ tokens }),
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch batch market info: ${response.statusText}`);
      }

      const results: MiddlewareMarketResponse[] = await response.json();

      const marketInfoMap = new Map<string, { marketInfo: MiddlewareMarketData; providerId: string }>();

      for (const result of results) {
        if (!result.marketInfo) {
          console.warn('No market info returned for:', result.tokenAddress, result.outcomeTokenId);
          continue;
        }

        const normalizedAddress = result.tokenAddress.toLowerCase() as Address;
        const providerId = this.getProviderId(normalizedAddress);
        
        const key = `${result.tokenAddress}-${result.outcomeTokenId}`;
        marketInfoMap.set(key, {
          marketInfo: result.marketInfo,
          providerId,
        });
      }

      return marketInfoMap;
    } catch (error) {
      console.error('Error fetching batch market info:', error);
      return new Map();
    }
  }

  private getProviderId(tokenAddress: Address): string {
    const normalized = tokenAddress.toLowerCase();
    if (normalized === POLYGON_ERC1155_BRIDGED_BSC_ADDRESS.toLowerCase()) {
      return 'polymarket';
    } else if (normalized === OPINION_ERC1155_ADDRESS.toLowerCase()) {
      return 'opinion';
    }
    return 'unknown';
  }

  constructProviderUrl(providerId: string, marketData: MiddlewareMarketData): string {
    if (marketData.url) {
      return marketData.url;
    }
    
    if (providerId === 'opinion') {
      if (marketData.parentMarketId) {
        return `https://app.opinion.trade/detail?topicId=${marketData.parentMarketId}&type=multi`;
      } else {
        return `https://app.opinion.trade/detail?topicId=${marketData.id}`;
      }
    }
    
    return '';
  }
}
