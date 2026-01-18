import type { Address } from 'viem';
import type { PredictionMarketProvider } from '../../types/predictionMarket';
import { polymarketProvider } from './polymarketProvider';
import { opinionProvider } from './opinionProvider';
import { 
  POLYGON_ERC1155_BRIDGED_BSC_ADDRESS,
  POLYGON_ERC1155_BRIDGED_BSC_OLD_BUGGY_ADDRESS,
} from '../../config/addresses';

/**
 * Registry of all prediction market providers
 * 
 * Maps ERC1155 token addresses (on operating chain) to their providers.
 * This allows dynamic lookup of provider by token address.
 */
class ProviderRegistry {
  private providers: Map<string, PredictionMarketProvider> = new Map();
  private providersById: Map<string, PredictionMarketProvider> = new Map();

  constructor() {
    // Register default providers
    this.register(polymarketProvider);
    this.register(opinionProvider);
  }

  /**
   * Register a new prediction market provider
   */
  register(provider: PredictionMarketProvider): void {
    const addressKey = provider.erc1155Address.toLowerCase();
    this.providers.set(addressKey, provider);
    this.providersById.set(provider.id.toLowerCase(), provider);
    
    console.log(`Registered provider: ${provider.name} (${provider.id}) at ${addressKey}`);
  }

  /**
   * Get provider by ERC1155 token address
   */
  getByTokenAddress(tokenAddress: Address): PredictionMarketProvider | null {
    const normalizedAddress = tokenAddress.toLowerCase();
    
    // Handle legacy/buggy addresses
    if (normalizedAddress === POLYGON_ERC1155_BRIDGED_BSC_OLD_BUGGY_ADDRESS.toLowerCase()) {
      return this.providers.get(POLYGON_ERC1155_BRIDGED_BSC_ADDRESS.toLowerCase()) || null;
    }
    
    return this.providers.get(normalizedAddress) || null;
  }

  /**
   * Get provider by ID (e.g., 'polymarket', 'opinion')
   */
  getById(providerId: string): PredictionMarketProvider | null {
    return this.providersById.get(providerId.toLowerCase()) || null;
  }

  /**
   * Get all registered providers
   */
  getAll(): PredictionMarketProvider[] {
    return Array.from(this.providersById.values());
  }

  /**
   * Get all providers that require bridging
   */
  getBridgeableProviders(): PredictionMarketProvider[] {
    return this.getAll().filter(p => p.requiresBridging);
  }

  /**
   * Get all providers that operate natively (no bridging)
   */
  getNativeProviders(): PredictionMarketProvider[] {
    return this.getAll().filter(p => !p.requiresBridging);
  }

  /**
   * Check if a token address belongs to a registered provider
   */
  isRegistered(tokenAddress: Address): boolean {
    return this.getByTokenAddress(tokenAddress) !== null;
  }
}

// Singleton instance
export const providerRegistry = new ProviderRegistry();

// Convenience exports
export { polymarketProvider } from './polymarketProvider';
export { opinionProvider } from './opinionProvider';

// Re-export types
export type { 
  PredictionMarketProvider,
  BridgeablePredictionMarketProvider,
  NativePredictionMarketProvider,
  MarketData,
  BridgeConfig,
  SafeConfig,
} from '../../types/predictionMarket';

export {
  isBridgeableProvider,
  isNativeProvider,
} from '../../types/predictionMarket';
