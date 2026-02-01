import type { 
  NativePredictionMarketProvider,
  MarketData,
} from '../../types/predictionMarket';
import { 
  PROBABLE_ERC1155_ADDRESS,
  PROBABLE_DECIMALS,
  MIDDLEWARE_BASE_URL,
} from '../../config/addresses';
import { PROBABLE_SAFE_FACTORY_ADDRESS } from '../../config/safe';
import { bsc } from 'viem/chains';
import probableIcon from '../../assets/images/probable-icon.png';

/**
 * Raw Probable API response structure
 */
interface ProbableApiMarket {
  id: string;
  question: string;
  thumbnailUrl?: string;
  yesTokenId: string;
  noTokenId: string;
  endDate?: string;
  status: 'active' | 'closed' | 'resolved';
}

/**
 * Transform Probable API response to unified MarketData
 */
function transformToMarketData(rawMarket: ProbableApiMarket): MarketData {
  return {
    id: rawMarket.id,
    question: rawMarket.question,
    thumbnailUrl: rawMarket.thumbnailUrl,
    yesTokenId: rawMarket.yesTokenId,
    noTokenId: rawMarket.noTokenId,
    endDate: rawMarket.endDate,
    status: rawMarket.status,
    url: `https://probable.markets/market/${rawMarket.id}`,
    rawData: rawMarket,
  };
}

/**
 * Probable prediction market provider
 * 
 * Probable operates natively on BSC, no bridging required.
 */
export const probableProvider: NativePredictionMarketProvider = {
  id: 'probable',
  name: 'Probable',
  logo: probableIcon,
  operatingChainId: bsc.id,
  erc1155Address: PROBABLE_ERC1155_ADDRESS,
  decimals: PROBABLE_DECIMALS,
  requiresBridging: false,
  safeConfig: {
    type: 'derive',
    factoryAddress: PROBABLE_SAFE_FACTORY_ADDRESS,
  },

  async getMarketById(marketId: string): Promise<MarketData | null> {
    try {
      const response = await fetch(
        `${MIDDLEWARE_BASE_URL}/probable/market/${marketId}`
      );

      if (!response.ok) {
        console.log('Failed to fetch Probable market:', marketId);
        return null;
      }

      const marketData = await response.json();

      if (!marketData) {
        console.log('No market data found for Probable market:', marketId);
        return null;
      }

      const rawMarket: ProbableApiMarket = {
        id: marketData.id || marketId,
        question: marketData.question || marketData.title || '',
        thumbnailUrl: marketData.thumbnailUrl || marketData.image,
        yesTokenId: marketData.yesTokenId || '',
        noTokenId: marketData.noTokenId || '',
        endDate: marketData.endDate,
        status: marketData.status || 'active',
      };

      return transformToMarketData(rawMarket);
    } catch (error) {
      console.error('Error fetching Probable market by ID:', error);
      return null;
    }
  },

  async getMarketByOutcomeToken(outcomeTokenId: string): Promise<MarketData | null> {
    try {
      const response = await fetch(
        `${MIDDLEWARE_BASE_URL}/market?outcomeTokenId=${outcomeTokenId}`
      );

      if (!response.ok) {
        console.log('Failed to fetch Probable market for outcome token:', outcomeTokenId);
        return null;
      }

      const marketData = await response.json();

      if (!marketData) {
        console.log('No market data found for Probable outcome token:', outcomeTokenId);
        return null;
      }

      const rawMarket: ProbableApiMarket = {
        id: marketData.id || '',
        question: marketData.question || marketData.title || '',
        thumbnailUrl: marketData.thumbnailUrl || marketData.image,
        yesTokenId: marketData.yesTokenId || '',
        noTokenId: marketData.noTokenId || '',
        endDate: marketData.endDate,
        status: marketData.status || 'active',
      };

      return transformToMarketData(rawMarket);
    } catch (error) {
      console.error('Error fetching Probable market by outcome token:', error);
      return null;
    }
  },
};
