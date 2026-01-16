// Unified service for fetching market information from both Polymarket and Opinion
import { type PolymarketMarket, polymarketService } from './polymarket';
import { type OpinionMarket, opinionService } from './opinion';
import { POLYGON_ERC1155_BRIDGED_BSC_ADDRESS, OPINION_ERC1155_ADDRESS } from '../config/addresses';

export interface UnifiedMarketInfo {
  question: string;
  platform: 'polymarket' | 'opinion';
  polymarketData?: PolymarketMarket;
  opinionData?: OpinionMarket;
}

class MarketInfoService {
  async getMarketInfoFromOutcomeToken(
    outcomeTokenId: string,
    tokenAddress: string
  ): Promise<UnifiedMarketInfo | null> {
    try {
      const normalizedAddress = tokenAddress.toLowerCase();

      // Check if it's Polymarket (Polygon ERC1155)
      if (normalizedAddress === POLYGON_ERC1155_BRIDGED_BSC_ADDRESS.toLowerCase()) {
        const polymarketData = await polymarketService.getMarketInfoFromOutcomeToken(outcomeTokenId);
        
        if (polymarketData) {
          return {
            question: polymarketData.question,
            platform: 'polymarket',
            polymarketData,
          };
        }
      }
      // Check if it's Opinion (BSC ERC1155)
      else if (normalizedAddress === OPINION_ERC1155_ADDRESS.toLowerCase()) {
        const opinionData = await opinionService.getMarketByOutcomeToken(outcomeTokenId);
        
        if (opinionData) {
          return {
            question: opinionData.marketTitle,
            platform: 'opinion',
            opinionData,
          };
        }
      }

      return null;
    } catch (error) {
      console.error('Error getting market info from outcome token:', error);
      return null;
    }
  }
}

export const marketInfoService = new MarketInfoService();

