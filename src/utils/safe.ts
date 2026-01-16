import { deriveSafe } from "@polymarket/builder-relayer-client/dist/builder/derive";
import type { Address } from "viem";
import { createPublicClient, http } from "viem";
import { polygon, bsc } from "wagmi/chains";
import { SAFE_FACTORY_ADDRESS } from "../config/safe";

// Safe Transaction Service API endpoints
const SAFE_API_ENDPOINTS = {
  polygon: "https://safe-transaction-polygon.safe.global/api/v1",
  bsc: "https://safe-transaction-bsc.safe.global/api/v1",
} as const;

/**
 * Derive Gnosis Safe address for an EOA on Polygon (Polymarket)
 * Uses the Polymarket factory to derive the safe address
 */
export function deriveSafeAddress(eoaAddress: Address): Address {
  // Use the Safe factory address to derive the safe
  return deriveSafe(eoaAddress, SAFE_FACTORY_ADDRESS) as Address;
}

/**
 * Fetch all Safe addresses owned by an EOA from Safe Transaction Service API
 * This is used for BSC (Opinion) where safes may be created with different factories
 */
export async function fetchSafesFromAPI(
  ownerAddress: Address,
  chainId: number
): Promise<Address[]> {
  const endpoint = chainId === 137 ? SAFE_API_ENDPOINTS.polygon : SAFE_API_ENDPOINTS.bsc;
  
  try {
    const response = await fetch(`${endpoint}/owners/${ownerAddress}/safes/`);
    
    if (!response.ok) {
      console.warn(`Safe API returned ${response.status} for ${ownerAddress}`);
      return [];
    }
    
    const data = await response.json();
    return (data.safes || []) as Address[];
  } catch (error) {
    console.error("Error fetching safes from API:", error);
    return [];
  }
}

/**
 * Get the factory address that was used to create a specific Safe
 * This helps identify which factory was used for BSC safes
 */
export async function getSafeCreationInfo(
  safeAddress: Address,
  chainId: number
): Promise<{ factoryAddress: Address | null; creator: Address | null }> {
  const endpoint = chainId === 137 ? SAFE_API_ENDPOINTS.polygon : SAFE_API_ENDPOINTS.bsc;
  
  try {
    const response = await fetch(`${endpoint}/safes/${safeAddress}/creation/`);
    
    if (!response.ok) {
      return { factoryAddress: null, creator: null };
    }
    
    const data = await response.json();
    return {
      factoryAddress: data.factoryAddress as Address || null,
      creator: data.creator as Address || null,
    };
  } catch (error) {
    console.error("Error fetching safe creation info:", error);
    return { factoryAddress: null, creator: null };
  }
}

/**
 * Check if a Safe address has been deployed (has code)
 */
export async function checkSafeExists(
  safeAddress: Address,
  chainId: number
): Promise<boolean> {
  const client = createPublicClient({
    chain: chainId === 137 ? polygon : bsc,
    transport: http(),
  });

  try {
    const code = await client.getCode({ address: safeAddress });
    return code !== undefined && code !== "0x";
  } catch (error) {
    console.error("Error checking safe existence:", error);
    return false;
  }
}

/**
 * Generate a signature for single owner safe executing directly
 * 
 * For Gnosis Safe with single owner, when the owner executes directly,
 * we use EIP-1271 contract signature format:
 * 
 * Signature format: {r}{s}{v}
 * - r (32 bytes): EOA owner address (right-padded to 32 bytes)
 * - s (32 bytes): 0x0000...0000 (no additional data)
 * - v (1 byte): 0x01 (indicates approved hash/contract signature)
 * 
 * Based on Safe's signatureSplit function which reads:
 * - r at offset 0x20
 * - s at offset 0x40  
 * - v at offset 0x41 (1 byte)
 */
export function generateSingleOwnerSignature(ownerAddress: Address): `0x${string}` {
  // Remove 0x prefix and convert to lowercase
  const addressHex = ownerAddress.toLowerCase().replace("0x", "");
  
  // r: Owner address padded to 32 bytes (left-pad with zeros)
  const r = addressHex.padStart(64, "0");
  
  // s: 32 bytes of zeros (no additional data needed)
  const s = "0000000000000000000000000000000000000000000000000000000000000000";
  
  // v: 0x01 (indicates contract signature / approved hash)
  const v = "01";
  
  // Concatenate in order: r + s + v
  return `0x${r}${s}${v}` as `0x${string}`;
}
