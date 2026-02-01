import type { 
  BridgeablePredictionMarketProvider,
  MarketData,
  BridgeConfig,
} from '../../types/predictionMarket';
import { 
  POLYGON_ERC1155_BRIDGED_BSC_ADDRESS,
  POLYGON_ERC1155_POLYGON_ADDRESS,
  POLYMARKET_SOURCE_BRIDGE_POLYGON_ADDRESS,
  POLYMARKET_DESTINATION_BRIDGE_BSC_ADDRESS,
  AXELAR_GAS_SERVICE_POLYGON_ADDRESS,
  AXELAR_GAS_SERVICE_BSC_ADDRESS,
  AXELAR_POLYGON_CHAIN_NAME,
  AXELAR_BSC_CHAIN_NAME,
  POLYMARKET_DECIMALS,
  MIDDLEWARE_BASE_URL,
} from '../../config/addresses';
import { POLYMARKET_SAFE_FACTORY_ADDRESS } from '../../config/safe';
import { polygon, bsc } from 'viem/chains';
import { ctfExchangeService } from '../ctfExchange';
import polymarketLogo from '../../assets/images/polymarket.svg';

/**
 * Raw Polymarket API response structure
 */
interface PolymarketApiMarket {
  id: string;
  question: string;
  slug: string;
  endDate: string;
  liquidity: string;
  image: string;
  volume: string;
  outcomes: string[];
  outcomePrices: string[];
  clobTokenIds: string[] | string;
  active: boolean;
  closed: boolean;
  events?: unknown[];
}

/**
 * Bridge configuration for Polymarket (Polygon → BSC)
 */
const polymarketBridgeConfig: BridgeConfig = {
  sourceChainId: polygon.id,
  destinationChainId: bsc.id,
  sourceBridgeAddress: POLYMARKET_SOURCE_BRIDGE_POLYGON_ADDRESS,
  destinationBridgeAddress: POLYMARKET_DESTINATION_BRIDGE_BSC_ADDRESS,
  axelarGasServiceSourceAddress: AXELAR_GAS_SERVICE_POLYGON_ADDRESS,
  axelarGasServiceDestAddress: AXELAR_GAS_SERVICE_BSC_ADDRESS,
  axelarSourceChainName: AXELAR_POLYGON_CHAIN_NAME,
  axelarDestChainName: AXELAR_BSC_CHAIN_NAME,
  sourceTokenAddress: POLYGON_ERC1155_POLYGON_ADDRESS,
  destinationTokenAddress: POLYGON_ERC1155_BRIDGED_BSC_ADDRESS,
};

/**
 * Parse token IDs from Polymarket API response
 */
function parseTokenIds(clobTokenIds: string[] | string): [string, string] {
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

/**
 * Transform Polymarket API response to unified MarketData
 */
function transformToMarketData(rawMarket: PolymarketApiMarket): MarketData {
  const [yesTokenId, noTokenId] = parseTokenIds(rawMarket.clobTokenIds);
  const hasSubEvents = rawMarket.events && rawMarket.events.length > 1;
  
  return {
    id: rawMarket.id,
    question: rawMarket.question,
    thumbnailUrl: rawMarket.image,
    yesTokenId,
    noTokenId,
    endDate: rawMarket.endDate,
    status: rawMarket.closed ? 'closed' : rawMarket.active ? 'active' : 'resolved',
    url: hasSubEvents 
      ? `https://polymarket.com/event/${rawMarket.slug}`
      : `https://polymarket.com/market/${rawMarket.slug}`,
    rawData: rawMarket,
  };
}

/**
 * Polymarket prediction market provider
 * 
 * Polymarket operates on Polygon but tokens need to be bridged to BSC
 * for vault operations via Axelar GMP.
 */
export const polymarketProvider: BridgeablePredictionMarketProvider = {
  id: 'polymarket',
  name: 'Polymarket',
  logo: polymarketLogo,
  operatingChainId: bsc.id, // Vault operates on BSC
  erc1155Address: POLYGON_ERC1155_BRIDGED_BSC_ADDRESS, // Bridged token on BSC
  decimals: POLYMARKET_DECIMALS,
  requiresBridging: true,
  bridgeConfig: polymarketBridgeConfig,
  safeConfig: {
    type: 'derive',
    factoryAddress: POLYMARKET_SAFE_FACTORY_ADDRESS,
  },
  supportsChildMarkets: false,
  inputType: 'slug',
  inputPlaceholder: 'e.g., fed-decreases-interest-rates-by-50-bps',

  async getMarketById(marketId: string): Promise<MarketData | null> {
    // Polymarket uses slug-based lookup, not direct ID
    // This method is provided for interface compliance
    // Use getMarketBySlug for slug-based lookups
    try {
      const response = await fetch(
        `${MIDDLEWARE_BASE_URL}/polymarket/markets?condition_ids=${encodeURIComponent(marketId)}`
      );

      if (!response.ok) {
        throw new Error(`Polymarket API error: ${response.status}`);
      }

      const markets = await response.json();
      if (markets && markets.length > 0) {
        return transformToMarketData(markets[0]);
      }

      return null;
    } catch (error) {
      console.error('Error fetching Polymarket market by ID:', error);
      return null;
    }
  },

  async getMarketByOutcomeToken(outcomeTokenId: string): Promise<MarketData | null> {
    try {
      // Get condition ID from the outcome token via CTF Exchange
      const conditionId = await ctfExchangeService.getConditionId(outcomeTokenId);

      if (!conditionId) {
        console.log('No condition ID found for outcome token:', outcomeTokenId);
        return null;
      }

      // Fetch market by condition ID
      const marketsUrl = `${MIDDLEWARE_BASE_URL}/polymarket/markets?condition_ids=${encodeURIComponent(conditionId)}`;
      const response = await fetch(marketsUrl);

      if (!response.ok) {
        throw new Error(`Failed to fetch markets: ${response.status}`);
      }

      const markets = await response.json();
      if (markets && markets.length > 0) {
        return transformToMarketData(markets[0]);
      }

      return null;
    } catch (error) {
      console.error('Error fetching Polymarket market by outcome token:', error);
      return null;
    }
  },
};

/**
 * Fetch Polymarket market by slug (convenience method)
 */
export async function getPolymarketBySlug(slug: string): Promise<MarketData | null> {
  try {
    const response = await fetch(`${MIDDLEWARE_BASE_URL}/polymarket/markets/slug/${slug}`);
    
    if (!response.ok) {
      throw new Error(`Polymarket API error: ${response.status}`);
    }

    const rawMarket = await response.json();
    return transformToMarketData(rawMarket);
  } catch (error) {
    console.error('Error fetching Polymarket market by slug:', error);
    return null;
  }
}

// Re-export types for backward compatibility
export type { PolymarketApiMarket as PolymarketMarket };
