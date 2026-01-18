import type { Address } from 'viem';
import type { 
  NativePredictionMarketProvider,
  MarketData,
} from '../../types/predictionMarket';
import { 
  OPINION_ERC1155_ADDRESS,
  OPINION_DECIMALS,
  MIDDLEWARE_BASE_URL,
} from '../../config/addresses';
import { bsc } from 'viem/chains';

/**
 * Raw Opinion API child market structure
 */
interface OpinionApiChildMarket {
  marketId: number;
  marketTitle: string;
  status: number;
  yesTokenId: string;
  noTokenId: string;
  conditionId: string;
  volume: string;
  createdAt: number;
}

/**
 * Raw Opinion API response structure
 */
interface OpinionApiMarket {
  marketId: number;
  marketTitle: string;
  thumbnailUrl: string;
  yesTokenId: string;
  noTokenId: string;
  marketType?: number;
  childMarkets?: OpinionApiChildMarket[];
  parentThumbnailUrl?: string;
  isCategorical?: boolean;
}

/**
 * Transform Opinion API response to unified MarketData
 */
function transformToMarketData(rawMarket: OpinionApiMarket): MarketData {
  return {
    id: String(rawMarket.marketId),
    question: rawMarket.marketTitle,
    thumbnailUrl: rawMarket.thumbnailUrl || rawMarket.parentThumbnailUrl,
    yesTokenId: rawMarket.yesTokenId || '',
    noTokenId: rawMarket.noTokenId || '',
    status: 'active', // Opinion API doesn't directly expose status in same format
    url: `https://www.opinion.xyz/market/${rawMarket.marketId}`,
    rawData: rawMarket,
  };
}

/**
 * Fetch Opinion Safe address from API
 */
async function fetchOpinionSafeAddress(eoaAddress: Address): Promise<Address | null> {
  try {
    const response = await fetch(
      `https://proxy.opinion.trade:8443/api/bsc/api/v2/user/${eoaAddress}/profile?chainId=56`
    );
    
    if (!response.ok) {
      console.log(`Opinion API request failed with status: ${response.status}`);
      return null;
    }

    const data = await response.json();
    
    if (data.errno === 0 && data.result?.multiSignedWalletAddress) {
      const bscSafeAddress = data.result.multiSignedWalletAddress['56'];
      
      if (bscSafeAddress && bscSafeAddress !== '0x0000000000000000000000000000000000000000') {
        return bscSafeAddress as Address;
      }
    }
    
    return null;
  } catch (error) {
    console.error('Error fetching Opinion Safe from API:', error);
    return null;
  }
}

/**
 * Opinion prediction market provider
 * 
 * Opinion operates natively on BSC, no bridging required.
 */
export const opinionProvider: NativePredictionMarketProvider = {
  id: 'opinion',
  name: 'Opinion',
  operatingChainId: bsc.id,
  erc1155Address: OPINION_ERC1155_ADDRESS,
  decimals: OPINION_DECIMALS,
  requiresBridging: false,
  safeConfig: {
    type: 'api',
    fetchSafeAddress: fetchOpinionSafeAddress,
  },

  async getMarketById(marketId: string): Promise<MarketData | null> {
    try {
      const apiKey = import.meta.env.VITE_OPINION_API_KEY;

      if (!apiKey) {
        throw new Error('OPINION_API_KEY not found in environment variables');
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

        if (!marketResponse.ok || marketData.errno !== 0) {
          console.log('Both Opinion endpoints failed for market ID:', marketId);
          return null;
        }

        isCategorical = true;
      }

      const data = marketData.result.data;
      
      const rawMarket: OpinionApiMarket = {
        marketId: data.marketId,
        marketTitle: data.marketTitle,
        thumbnailUrl: data.thumbnailUrl,
        yesTokenId: data.yesTokenId || '',
        noTokenId: data.noTokenId || '',
        marketType: data.marketType,
        isCategorical,
        parentThumbnailUrl: isCategorical ? data.thumbnailUrl : undefined,
        childMarkets: data.childMarkets?.map((child: OpinionApiChildMarket) => ({
          marketId: child.marketId,
          marketTitle: child.marketTitle,
          status: child.status,
          yesTokenId: child.yesTokenId,
          noTokenId: child.noTokenId,
          conditionId: child.conditionId,
          volume: child.volume,
          createdAt: child.createdAt,
        })),
      };

      return transformToMarketData(rawMarket);
    } catch (error) {
      console.error('Error fetching Opinion market by ID:', error);
      return null;
    }
  },

  async getMarketByOutcomeToken(outcomeTokenId: string): Promise<MarketData | null> {
    try {
      // Middleware directly returns market data for given outcomeTokenId
      const response = await fetch(
        `${MIDDLEWARE_BASE_URL}/market?outcomeTokenId=${outcomeTokenId}`
      );

      if (!response.ok) {
        console.log('Failed to fetch Opinion market for outcome token:', outcomeTokenId);
        return null;
      }

      const marketData = await response.json();

      if (!marketData) {
        console.log('No market data found for Opinion outcome token:', outcomeTokenId);
        return null;
      }

      const rawMarket: OpinionApiMarket = {
        marketId: marketData.marketId,
        marketTitle: marketData.marketTitle,
        thumbnailUrl: marketData.thumbnailUrl,
        yesTokenId: marketData.yesTokenId || '',
        noTokenId: marketData.noTokenId || '',
        marketType: marketData.marketType,
        isCategorical: marketData.isCategorical,
        parentThumbnailUrl: marketData.parentThumbnailUrl,
        childMarkets: marketData.childMarkets,
      };

      return transformToMarketData(rawMarket);
    } catch (error) {
      console.error('Error fetching Opinion market by outcome token:', error);
      return null;
    }
  },
};

// Re-export types for backward compatibility
export type { OpinionApiMarket as OpinionMarket, OpinionApiChildMarket as OpinionChildMarket };
