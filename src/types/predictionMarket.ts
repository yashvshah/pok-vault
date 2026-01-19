import type { Address } from 'viem';

/**
 * Unified market data structure returned by all prediction market providers
 */
export interface MarketData {
  id: string;
  question: string;
  thumbnailUrl?: string;
  yesTokenId: string;
  noTokenId: string;
  endDate?: string;
  status: 'active' | 'closed' | 'resolved';
  url?: string;
  // Provider-specific raw data for advanced use cases
  rawData?: unknown;
}

/**
 * Bridge configuration for cross-chain prediction markets
 */
export interface BridgeConfig {
  /** Chain ID where tokens originate */
  sourceChainId: number;
  /** Chain ID where vault operates */
  destinationChainId: number;
  /** Bridge contract on source chain (tokens sent here to bridge) */
  sourceBridgeAddress: Address;
  /** Bridge contract on destination chain (receives bridged tokens) */
  destinationBridgeAddress: Address;
  /** Axelar gas service address on source chain */
  axelarGasServiceSourceAddress: Address;
  /** Axelar gas service address on destination chain */
  axelarGasServiceDestAddress: Address;
  /** Axelar chain identifier for source */
  axelarSourceChainName: string;
  /** Axelar chain identifier for destination */
  axelarDestChainName: string;
  /** ERC1155 token address on source chain (before bridging) */
  sourceTokenAddress: Address;
  /** ERC1155 token address on destination chain (after bridging) */
  destinationTokenAddress: Address;
}

/**
 * Safe wallet configuration for a prediction market
 */
export interface SafeConfig {
  /** Method to derive/fetch Safe address */
  type: 'derive' | 'api';
  /** For 'derive': Factory address used for CREATE2 derivation */
  factoryAddress?: Address;
  /** For 'api': Function to fetch Safe address from external API */
  fetchSafeAddress?: (eoaAddress: Address) => Promise<Address | null>;
}

/**
 * Base prediction market provider interface
 */
export interface PredictionMarketProvider {
  /** Unique identifier (e.g., 'polymarket', 'opinion') */
  id: string;
  /** Display name (e.g., 'Polymarket', 'Opinion') */
  name: string;
  /** Logo image path for UI display */
  logo: string;
  /** Chain ID where tokens are used for vault operations */
  operatingChainId: number;
  /** ERC1155 token contract address (on operating chain) */
  erc1155Address: Address;
  /** Token decimals (typically 6 or 18) */
  decimals: number;
  /** Whether this market requires bridging to the vault chain */
  requiresBridging: boolean;
  /** Bridge configuration (only if requiresBridging is true) */
  bridgeConfig?: BridgeConfig;
  /** Safe wallet configuration (optional) */
  safeConfig?: SafeConfig;
  
  /**
   * Fetch market data by market ID
   */
  getMarketById(marketId: string): Promise<MarketData | null>;
  
  /**
   * Fetch market data by outcome token ID
   */
  getMarketByOutcomeToken(outcomeTokenId: string): Promise<MarketData | null>;
}

/**
 * Provider that requires bridging (e.g., Polymarket on Polygon → BSC)
 */
export interface BridgeablePredictionMarketProvider extends PredictionMarketProvider {
  requiresBridging: true;
  bridgeConfig: BridgeConfig;
}

/**
 * Provider that operates natively on the vault chain (e.g., Opinion on BSC)
 */
export interface NativePredictionMarketProvider extends PredictionMarketProvider {
  requiresBridging: false;
  bridgeConfig?: never;
}

/**
 * Type guard to check if provider requires bridging
 */
export function isBridgeableProvider(
  provider: PredictionMarketProvider
): provider is BridgeablePredictionMarketProvider {
  return provider.requiresBridging === true && provider.bridgeConfig !== undefined;
}

/**
 * Type guard to check if provider is native (no bridging)
 */
export function isNativeProvider(
  provider: PredictionMarketProvider
): provider is NativePredictionMarketProvider {
  return provider.requiresBridging === false;
}
