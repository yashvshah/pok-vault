import { useState, useEffect } from "react";
import type { Address } from "viem";
import { polygon, bsc } from "wagmi/chains";
import { deriveSafeAddress, checkSafeExists, fetchSafesFromAPI, getSafeCreationInfo } from "../utils/safe";
import { OPINION_SAFE_FACTORY_ADDRESS } from "../config/safe";

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
 * 
 * - Polymarket (Polygon): Uses deriveSafe with known factory
 * - Opinion (BSC): Fetches from API and validates factory
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
        // POLYGON (Polymarket): Use deriveSafe with known factory
        const pmSafeAddress = deriveSafeAddress(eoaAddress);
        const pmExists = await checkSafeExists(pmSafeAddress, polygon.id);
        setPolymarketSafe(pmExists ? pmSafeAddress : null);

        // BSC (Opinion): Fetch from Safe Transaction Service API
        const bscSafes = await fetchSafesFromAPI(eoaAddress, bsc.id);
        
        if (bscSafes.length > 0) {
          console.log(`Found ${bscSafes.length} Safe(s) on BSC for ${eoaAddress}`);
          
          // Find the safe created with Opinion factory
          let opinionSafeAddress: Address | null = null;
          
          for (const safe of bscSafes) {
            const creationInfo = await getSafeCreationInfo(safe, bsc.id);
            
            console.log(`Safe ${safe} created by factory:`, creationInfo.factoryAddress);
            
            if (
              creationInfo.factoryAddress &&
              creationInfo.factoryAddress.toLowerCase() === OPINION_SAFE_FACTORY_ADDRESS.toLowerCase()
            ) {
              opinionSafeAddress = safe;
              console.log(`✅ Found Opinion Safe: ${safe}`);
              break; // Found the correct safe, stop looking
            } else {
              console.log(`❌ Safe ${safe} not created by Opinion factory, skipping`);
            }
          }
          
          setOpinionSafe(opinionSafeAddress);
          
          if (!opinionSafeAddress && bscSafes.length > 0) {
            console.log(`⚠️ No safe created by Opinion factory (${OPINION_SAFE_FACTORY_ADDRESS}) found`);
          }
        } else {
          console.log(`No safes found on BSC for ${eoaAddress}`);
          setOpinionSafe(null);
        }
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
