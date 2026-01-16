// Service for fetching market information from Opinion API
import { MIDDLEWARE_BASE_URL } from '../config/addresses';

export interface OpinionMarket {
  marketId: number;
  marketTitle: string;
  thumbnailUrl: string;
  yesTokenId: string;
  noTokenId: string;
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

      const marketResponse = await fetch(
        `${MIDDLEWARE_BASE_URL}/opinion/market/${marketId}`,
        {
          headers: {
            'apiKey': apiKey,
          },
        }
      );

      if (!marketResponse.ok) {
        console.log('Failed to fetch Opinion market info for market ID:', marketId);
        return null;
      }

      const marketData = await marketResponse.json();

      if (marketData.errno !== 0) {
        console.log('Opinion API returned error:', marketData.errmsg);
        return null;
      }

      const data = marketData.result.data;

      return {
        marketId: data.marketId,
        marketTitle: data.marketTitle,
        thumbnailUrl: data.thumbnailUrl,
        yesTokenId: data.yesTokenId,
        noTokenId: data.noTokenId,
      };
    } catch (error) {
      console.error('Error fetching Opinion market info:', error);
      return null;
    }
  }
}

export const opinionService = new OpinionService();
