import type { PredictionMarketProvider, MarketData } from '../types/predictionMarket';
import { getPolymarketBySlug } from '../services/providers/polymarketProvider';

export interface ProviderMarketInfo {
  question: string;
  yesTokenId: string;
  noTokenId: string;
  thumbnailUrl?: string;
  parentThumbnailUrl?: string;
  childMarkets?: Array<{
    marketId: number;
    marketTitle: string;
    status: number;
    yesTokenId: string;
    noTokenId: string;
  }>;
  selectedChildMarketId?: number;
  isCategorical?: boolean;
}

/**
 * Fetch market data for any provider based on input value
 * Handles different input types (slug vs id) automatically
 */
export async function fetchProviderMarket(
  provider: PredictionMarketProvider,
  inputValue: string
): Promise<ProviderMarketInfo | null> {
  try {
    let marketData: MarketData | null;

    // Handle Polymarket's slug-based lookup separately
    if (provider.id === 'polymarket' && provider.inputType === 'slug') {
      marketData = await getPolymarketBySlug(inputValue);
    } else {
      // Use standard ID-based lookup for other providers
      marketData = await provider.getMarketById(inputValue);
    }

    if (!marketData) {
      return null;
    }

    // Extract child markets info if provider supports it
    const rawData = marketData.rawData as {
      childMarkets?: Array<{
        marketId: number;
        marketTitle: string;
        status: number;
        yesTokenId: string;
        noTokenId: string;
      }>;
      parentThumbnailUrl?: string;
      isCategorical?: boolean;
    } | undefined;

    const hasChildMarkets = provider.supportsChildMarkets && rawData?.childMarkets && rawData.childMarkets.length > 0;

    return {
      question: marketData.question,
      yesTokenId: marketData.yesTokenId,
      noTokenId: marketData.noTokenId,
      thumbnailUrl: marketData.thumbnailUrl,
      parentThumbnailUrl: rawData?.parentThumbnailUrl,
      isCategorical: rawData?.isCategorical,
      childMarkets: hasChildMarkets ? rawData?.childMarkets : undefined,
    };
  } catch (error) {
    console.error(`Error fetching ${provider.name} market:`, error);
    return null;
  }
}
