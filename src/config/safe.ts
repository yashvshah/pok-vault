import type { Address } from "viem";

// Gnosis Safe Factory addresses
export const POLYMARKET_SAFE_FACTORY_ADDRESS = "0xaacfeea03eb1561c4e67d661e40682bd20e3541b" as Address;
export const OPINION_SAFE_FACTORY_ADDRESS = "0xa6B71E26C5e0845f74c812102Ca7114b6a896AB2" as Address;
export const PROBABLE_SAFE_FACTORY_ADDRESS = "0xB99159aBF0bF59a512970586F38292f8b9029924" as Address;

// Legacy export for backwards compatibility
export const SAFE_FACTORY_ADDRESS = POLYMARKET_SAFE_FACTORY_ADDRESS;

// Zero address constant
export const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000" as Address;
