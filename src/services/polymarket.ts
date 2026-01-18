// Service for fetching market information from Polymarket API
import { MIDDLEWARE_BASE_URL } from '../config/addresses';

export interface PolymarketMarket {
  id: string;
  question: string;
  slug: string;
  endDate: string;
  liquidity: string;
  image: string;
  volume: string;
  outcomes: string[];
  outcomePrices: string[];
  clobTokenIds: string[];
  yesTokenId: string;
  noTokenId: string;
  active: boolean;
  closed: boolean;
  haSubEvents?: boolean;
}

class PolymarketService {
  private parseTokenIds(clobTokenIds: string[] | string): [string, string] {
    try {
      const tokenIds = typeof clobTokenIds === 'string' 
        ? JSON.parse(clobTokenIds)
        : clobTokenIds;
      
      if (Array.isArray(tokenIds) && tokenIds.length >= 2) {
        return [tokenIds[0], tokenIds[1]];
      }
      
      console.warn('Invalid clobTokenIds format:', clobTokenIds);
      return ['', ''];
    } catch (error) {
      console.error('Error parsing clobTokenIds:', error);
      return ['', ''];
    }
  }

  async getMarketByConditionId(conditionId: string): Promise<PolymarketMarket | null> {
    try {
      // Get markets by condition ID (include closed markets)
      const marketsUrl = `${MIDDLEWARE_BASE_URL}/polymarket/markets?condition_ids=${encodeURIComponent(conditionId)}`;
      const marketsResponse = await fetch(marketsUrl);

      console.log('Fetching market by condition ID:', conditionId, 'URL:', marketsUrl);

      if (!marketsResponse.ok) {
        throw new Error(`Failed to fetch markets: ${marketsResponse.status}`);
      }

      const markets = await marketsResponse.json();

      if (markets && markets.length > 0) {
        const rawMarket = markets[0];
        const [yesTokenId, noTokenId] = this.parseTokenIds(rawMarket.clobTokenIds);
        const hasSubEvents = rawMarket.events && rawMarket.events.length > 1;
        
        return {
          ...rawMarket,
          hasSubEvents,
          yesTokenId,
          noTokenId,
        } as PolymarketMarket;
      }

      return null;
    } catch (error) {
      console.error('Error fetching market by condition ID:', error);
      return null;
    }
  }

  async getMarketBySlug(slug: string): Promise<PolymarketMarket | null> {
    try {
      const response = await fetch(`${MIDDLEWARE_BASE_URL}/polymarket/markets/slug/${slug}`);
      
      if (!response.ok) {
        throw new Error(`Polymarket API error: ${response.status}`);
      }

      const rawMarket = await response.json();
      const [yesTokenId, noTokenId] = this.parseTokenIds(rawMarket.clobTokenIds);

      return {
        ...rawMarket,
        yesTokenId,
        noTokenId,
      } as PolymarketMarket;
    } catch (error) {
      console.error('Error fetching market by slug:', error);
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