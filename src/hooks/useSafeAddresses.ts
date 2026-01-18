import { useState, useEffect } from "react";
import type { Address } from "viem";
import { deriveSafeAddress, checkSafeExists } from "../utils/safe";
import { providerRegistry, isBridgeableProvider } from "../services/providers";

interface SafeAddressesState {
  /** Map of provider ID to Safe address */
  safeAddresses: Map<string, Address | null>;
  /** Legacy: Polymarket Safe address */
  polymarketSafe: Address | null;
  /** Legacy: Opinion Safe address */
  opinionSafe: Address | null;
  isLoading: boolean;
  /** Map of provider ID to whether Safe should be used */
  useSafeFor: Map<string, boolean>;
  /** Legacy: Use Polymarket Safe */
  usePolymarketSafe: boolean;
  /** Legacy: Use Opinion Safe */
  useOpinionSafe: boolean;
}

interface SafeAddressesActions {
  /** Set whether to use Safe for a specific provider */
  setUseSafeFor: (providerId: string, use: boolean) => void;
  /** Legacy: Set whether to use Polymarket Safe */
  setUsePolymarketSafe: (use: boolean) => void;
  /** Legacy: Set whether to use Opinion Safe */
  setUseOpinionSafe: (use: boolean) => void;
  /** Get Safe address for a provider */
  getSafeForProvider: (providerId: string) => Address | null;
}

/**
 * Hook to derive and manage Gnosis Safe addresses for all registered prediction market providers
 * 
 * Supports both derive-based (e.g., Polymarket) and API-based (e.g., Opinion) Safe detection.
 */
export function useSafeAddresses(
  eoaAddress?: Address
): SafeAddressesState & SafeAddressesActions {
  const [safeAddresses, setSafeAddresses] = useState<Map<string, Address | null>>(new Map());
  const [useSafeFor, setUseSafeForState] = useState<Map<string, boolean>>(new Map());
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!eoaAddress) {
      setSafeAddresses(new Map());
      return;
    }

    setIsLoading(true);

    const detectSafes = async () => {
      const providers = providerRegistry.getAll();
      const newSafeAddresses = new Map<string, Address | null>();
      const newUseSafeFor = new Map<string, boolean>();

      for (const provider of providers) {
        try {
          let safeAddress: Address | null = null;

          if (provider.safeConfig) {
            if (provider.safeConfig.type === 'derive' && provider.safeConfig.factoryAddress) {
              // For bridgeable providers, check Safe on source chain (e.g., Polygon for Polymarket)
              const chainId = isBridgeableProvider(provider) 
                ? provider.bridgeConfig.sourceChainId 
                : provider.operatingChainId;
              
              safeAddress = deriveSafeAddress(eoaAddress);
              const exists = await checkSafeExists(safeAddress, chainId);
              if (!exists) {
                safeAddress = null;
              } else {
                console.log(`✅ Found ${provider.name} Safe: ${safeAddress}`);
              }
            } else if (provider.safeConfig.type === 'api' && provider.safeConfig.fetchSafeAddress) {
              safeAddress = await provider.safeConfig.fetchSafeAddress(eoaAddress);
              if (safeAddress) {
                console.log(`✅ Found ${provider.name} Safe: ${safeAddress}`);
              }
            }
          }

          newSafeAddresses.set(provider.id, safeAddress);
          // Default to using Safe if it exists
          newUseSafeFor.set(provider.id, safeAddress !== null);
        } catch (error) {
          console.error(`Error detecting Safe for ${provider.name}:`, error);
          newSafeAddresses.set(provider.id, null);
          newUseSafeFor.set(provider.id, false);
        }
      }

      setSafeAddresses(newSafeAddresses);
      setUseSafeForState(newUseSafeFor);
      setIsLoading(false);
    };

    detectSafes();
  }, [eoaAddress]);

  // Action to toggle Safe usage for a provider
  const setUseSafeFor = (providerId: string, use: boolean) => {
    setUseSafeForState(prev => {
      const next = new Map(prev);
      next.set(providerId.toLowerCase(), use);
      return next;
    });
  };

  // Get Safe address for a provider
  const getSafeForProvider = (providerId: string): Address | null => {
    return safeAddresses.get(providerId.toLowerCase()) || null;
  };

  // Legacy getters for backward compatibility
  const polymarketSafe = safeAddresses.get('polymarket') || null;
  const opinionSafe = safeAddresses.get('opinion') || null;
  const usePolymarketSafe = useSafeFor.get('polymarket') ?? true;
  const useOpinionSafe = useSafeFor.get('opinion') ?? true;

  // Legacy setters
  const setUsePolymarketSafe = (use: boolean) => setUseSafeFor('polymarket', use);
  const setUseOpinionSafe = (use: boolean) => setUseSafeFor('opinion', use);

  return {
    safeAddresses,
    polymarketSafe,
    opinionSafe,
    isLoading,
    useSafeFor,
    usePolymarketSafe,
    useOpinionSafe,
    setUseSafeFor,
    setUsePolymarketSafe,
    setUseOpinionSafe,
    getSafeForProvider,
  };
}
