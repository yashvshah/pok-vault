import { useState, useCallback, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import type { Address } from "viem";
import { deriveSafeAddress, checkSafeExists } from "../utils/safe";
import { providerRegistry, isBridgeableProvider } from "../services/providers";

interface SafeAddressesState {
  /** Map of provider ID to Safe address */
  safeAddresses: Map<string, Address | null>;
  isLoading: boolean;
  /** Map of provider ID to whether Safe should be used */
  useSafeFor: Map<string, boolean>;
}

interface SafeAddressesActions {
  /** Set whether to use Safe for a specific provider */
  setUseSafeFor: (providerId: string, use: boolean) => void;
  /** Get Safe address for a provider */
  getSafeForProvider: (providerId: string) => Address | null;
  /** Check if Safe should be used for a provider */
  shouldUseSafeFor: (providerId: string) => boolean;
}

/**
 * Detect Safe addresses for all registered providers
 */
async function detectSafeAddresses(eoaAddress: Address): Promise<Map<string, Address | null>> {
  const providers = providerRegistry.getAll();
  const safeAddresses = new Map<string, Address | null>();

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

      safeAddresses.set(provider.id, safeAddress);
    } catch (error) {
      console.error(`Error detecting Safe for ${provider.name}:`, error);
      safeAddresses.set(provider.id, null);
    }
  }

  return safeAddresses;
}

/**
 * Hook to derive and manage Gnosis Safe addresses for all registered prediction market providers
 * 
 * Supports both derive-based (e.g., Polymarket) and API-based (e.g., Opinion) Safe detection.
 */
export function useSafeAddresses(
  eoaAddress?: Address
): SafeAddressesState & SafeAddressesActions {
  // Track which providers should use Safe (user preference)
  const [useSafeOverrides, setUseSafeOverrides] = useState<Map<string, boolean>>(new Map());

  // Use React Query for async Safe detection
  const { data: safeAddresses = new Map<string, Address | null>(), isLoading } = useQuery({
    queryKey: ['safe-addresses', eoaAddress],
    queryFn: () => detectSafeAddresses(eoaAddress!),
    enabled: !!eoaAddress,
    staleTime: 60000, // Cache for 1 minute
  });

  // Compute useSafeFor map: default to using Safe if it exists, unless overridden
  const useSafeFor = useMemo(() => {
    const map = new Map<string, boolean>();
    for (const [providerId, safeAddress] of safeAddresses.entries()) {
      const override = useSafeOverrides.get(providerId.toLowerCase());
      const shouldUse = override !== undefined ? override : safeAddress !== null;
      map.set(providerId.toLowerCase(), shouldUse);
    }
    return map;
  }, [safeAddresses, useSafeOverrides]);

  // Action to toggle Safe usage for a provider
  const setUseSafeFor = useCallback((providerId: string, use: boolean) => {
    setUseSafeOverrides(prev => {
      const next = new Map(prev);
      next.set(providerId.toLowerCase(), use);
      return next;
    });
  }, []);

  // Get Safe address for a provider
  const getSafeForProvider = useCallback((providerId: string): Address | null => {
    return safeAddresses.get(providerId.toLowerCase()) || null;
  }, [safeAddresses]);

  // Check if Safe should be used for a provider
  const shouldUseSafeFor = useCallback((providerId: string): boolean => {
    return useSafeFor.get(providerId.toLowerCase()) ?? false;
  }, [useSafeFor]);

  return {
    safeAddresses,
    isLoading,
    useSafeFor,
    setUseSafeFor,
    getSafeForProvider,
    shouldUseSafeFor,
  };
}
