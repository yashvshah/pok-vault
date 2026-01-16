// Service for fetching market information from Opinion API
import { MIDDLEWARE_BASE_URL } from '../config/addresses';

export interface OpinionChildMarket {
  marketId: number;
  marketTitle: string;
  status: number;
  yesTokenId: string;
  noTokenId: string;
  conditionId: string;
  volume: string;
  createdAt: number;
}

export interface OpinionMarket {
  marketId: number;
  marketTitle: string;
  thumbnailUrl: string;
  yesTokenId: string;
  noTokenId: string;
  marketType?: number; // 1 = categorical with children
  childMarkets?: OpinionChildMarket[];
  parentThumbnailUrl?: string; // Store parent thumbnail for categorical markets
  isCategorical?: boolean; // Flag to indicate if fetched from categorical endpoint
}

class OpinionService {
  async getMarketByOutcomeToken(outcomeTokenId: string): Promise<OpinionMarket | null> {
    try {
      const apiKey = import.meta.env.VITE_OPINION_API_KEY;

      if (!apiKey) {
        throw new Error("OPINION_API_KEY not found in environment variables");
      }

      // First, get the market ID from outcome token ID
      const marketIdResponse = await fetch(
        `${MIDDLEWARE_BASE_URL}/market?outcomeTokenId=${outcomeTokenId}`
      );

      if (!marketIdResponse.ok) {
        console.log('Failed to fetch Opinion market ID for outcome token:', outcomeTokenId);
        return null;
      }

      const marketIdData = await marketIdResponse.json();
      const marketId = marketIdData?.marketId;

      if (!marketId) {
        console.log('No market ID found for Opinion outcome token:', outcomeTokenId);
        return null;
      }

      // Then, get the full market info using the market ID
      return await this.getMarketById(marketId);
    } catch (error) {
      console.error('Error fetching Opinion market by outcome token:', error);
      return null;
    }
  }

  async getMarketById(marketId: string | number): Promise<OpinionMarket | null> {
    try {
      const apiKey = import.meta.env.VITE_OPINION_API_KEY;

      if (!apiKey) {
        throw new Error("OPINION_API_KEY not found in environment variables");
      }

      // First try regular market endpoint
      let marketResponse = await fetch(
        `${MIDDLEWARE_BASE_URL}/opinion/market/${marketId}`,
        {
          headers: {
            'apiKey': apiKey,
          },
        }
      );

      let marketData = await marketResponse.json();

      let isCategorical = false;

      // If regular endpoint fails, try categorical endpoint
      if (marketData.errno !== 0) {
        
        marketResponse = await fetch(
          `${MIDDLEWARE_BASE_URL}/opinion/market/categorical/${marketId}`,
          {
            headers: {
              'apiKey': apiKey,
            },
          }
        );

        marketData = await marketResponse.json();

        if (!marketResponse.ok) {
          console.log('Both endpoints failed for market ID:', marketId);
          return null;
        }

        isCategorical = true;
      }

    
      if (marketData.errno !== 0) {
        console.log('Opinion API returned error:', marketData.errmsg);
        return null;
      }

      const data = marketData.result.data;

      // Check if it's a categorical market with child markets
      const hasChildMarkets = data.childMarkets && Array.isArray(data.childMarkets) && data.childMarkets.length > 0;

      return {
        marketId: data.marketId,
        marketTitle: data.marketTitle,
        thumbnailUrl: data.thumbnailUrl,
        yesTokenId: data.yesTokenId || '',
        noTokenId: data.noTokenId || '',
        marketType: data.marketType,
        isCategorical: isCategorical,
        parentThumbnailUrl: isCategorical ? data.thumbnailUrl : undefined,
        childMarkets: hasChildMarkets 
          ? data.childMarkets.map((child: any) => ({
              marketId: child.marketId,
              marketTitle: child.marketTitle,
              status: child.status,
              yesTokenId: child.yesTokenId,
              noTokenId: child.noTokenId,
              conditionId: child.conditionId,
              volume: child.volume,
              createdAt: child.createdAt,
            }))
          : undefined,
      };
    } catch (error) {
      console.error('Error fetching Opinion market info:', error);
      return null;
    }
  }
}

export const opinionService = new OpinionService();
