import { useState, useEffect } from "react";
import type { Address } from "viem";
import { polygon } from "wagmi/chains";
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
 * 
 * - Polymarket (Polygon): Uses deriveSafe with known factory
 * - Opinion (BSC): Fetches from Opinion API user profile endpoint
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

        // BSC (Opinion): Fetch from Opinion API
        try {
          const response = await fetch(
            `https://proxy.opinion.trade:8443/api/bsc/api/v2/user/${eoaAddress}/profile?chainId=56`
          );
          
          if (response.ok) {
            const data = await response.json();
            
            if (data.errno === 0 && data.result?.multiSignedWalletAddress) {
              const bscSafeAddress = data.result.multiSignedWalletAddress['56'];
              
              if (bscSafeAddress && bscSafeAddress !== '0x0000000000000000000000000000000000000000') {
                console.log(`✅ Found Opinion Safe on BSC: ${bscSafeAddress}`);
                setOpinionSafe(bscSafeAddress as Address);
              } else {
                console.log(`No Opinion Safe found for ${eoaAddress} on BSC`);
                setOpinionSafe(null);
              }
            } else {
              console.log(`Opinion API returned error or no safe: ${data.errmsg}`);
              setOpinionSafe(null);
            }
          } else {
            console.log(`Opinion API request failed with status: ${response.status}`);
            setOpinionSafe(null);
          }
        } catch (apiError) {
          console.error("Error fetching Opinion Safe from API:", apiError);
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
