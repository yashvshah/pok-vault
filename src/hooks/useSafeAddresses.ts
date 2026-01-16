import { useState, useEffect } from "react";
import type { Address } from "viem";
import { polygon, bsc } from "wagmi/chains";
import { deriveSafeAddress, checkSafeExists } from "../utils/safe";

interface SafeAddressesState {
  polymarketSafe: Address | null;
  opinionSafe: Address | null;
  isLoading: boolean;
  usePolymarketSafe: boolean;
  useOpinionSafe: boolean;
}

interface SafeAddressesActions {
  setUsePolymarketSafe: (use: boolean) => void;
  setUseOpinionSafe: (use: boolean) => void;
}

/**
 * Hook to derive and manage Gnosis Safe addresses for both Polymarket (Polygon) and Opinion (BSC)
 */
export function useSafeAddresses(
  eoaAddress?: Address
): SafeAddressesState & SafeAddressesActions {
  const [polymarketSafe, setPolymarketSafe] = useState<Address | null>(null);
  const [opinionSafe, setOpinionSafe] = useState<Address | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  // User preferences for using safe (defaults to true if safe exists)
  const [usePolymarketSafe, setUsePolymarketSafe] = useState(true);
  const [useOpinionSafe, setUseOpinionSafe] = useState(true);

  useEffect(() => {
    if (!eoaAddress) {
      setPolymarketSafe(null);
      setOpinionSafe(null);
      return;
    }

    setIsLoading(true);

    const detectSafes = async () => {
      try {
        console.log("Detecting safes for EOA:", eoaAddress);
        // Derive safe addresses (same factory for both chains)
        const safeAddress = deriveSafeAddress(eoaAddress);
        console.log("Derived safe address:", safeAddress);

        // Check if safes exist on-chain
        const [pmExists, opExists] = await Promise.all([
          checkSafeExists(safeAddress, polygon.id),
          checkSafeExists(safeAddress, bsc.id),
        ]);

        // Only set safe if it exists
        setPolymarketSafe(pmExists ? safeAddress : null);
        setOpinionSafe(opExists ? safeAddress : null);
      } catch (error) {
        console.error("Error detecting safes:", error);
        setPolymarketSafe(null);
        setOpinionSafe(null);
      } finally {
        setIsLoading(false);
      }
    };

    detectSafes();
  }, [eoaAddress]);

  return {
    polymarketSafe,
    opinionSafe,
    isLoading,
    usePolymarketSafe,
    useOpinionSafe,
    setUsePolymarketSafe,
    setUseOpinionSafe,
  };
}
