// Service for fetching market information from Polymarket API
import { MIDDLEWARE_BASE_URL } from '../config/addresses';

export interface PolymarketMarket {
  question: string;
  slug: string;
  endDate: string;
  liquidity: string;
  volume: string;
  outcomes: string[];
  outcomePrices: string[];
  clobTokenIds: string[];
  active: boolean;
  closed: boolean;
}

class PolymarketService {
  async getMarketByConditionId(conditionId: string): Promise<PolymarketMarket | null> {
    try {
      // Get markets by condition ID (include closed markets)
      const marketsUrl = `${MIDDLEWARE_BASE_URL}/polymarket/markets?condition_ids=${encodeURIComponent(conditionId)}`;
      const marketsResponse = await fetch(marketsUrl);
      console.log('Fetched markets response for condition ID', conditionId, marketsResponse);

      if (!marketsResponse.ok) {
        throw new Error(`Failed to fetch markets: ${marketsResponse.status}`);
      }

      const markets = await marketsResponse.json();

      if (markets && markets.length > 0) {
        return markets[0] as PolymarketMarket;
      }

      return null;
    } catch (error) {
      console.error('Error fetching market by condition ID:', error);
      return null;
    }
  }

  async getMarketInfoFromOutcomeToken(outcomeTokenId: string): Promise<PolymarketMarket | null> {
    try {
      // Import contract service dynamically to avoid circular dependencies
      const { ctfExchangeService } = await import('./ctfExchange');

      // Get condition ID from the outcome token
      const conditionId = await ctfExchangeService.getConditionId(outcomeTokenId);

      if (!conditionId) {
        console.log('No condition ID found for outcome token:', outcomeTokenId);
        return null;
      }

      // Get market information
      const market = await this.getMarketByConditionId(conditionId);

      if (!market) {
        console.log('No market found for condition ID:', conditionId);
        return null;
      }

      return market;
    } catch (error) {
      console.error('Error getting market info from outcome token:', error);
      return null;
    }
  }
}

export const polymarketService = new PolymarketService();