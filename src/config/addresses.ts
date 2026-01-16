// Contract addresses
export const VAULT_ADDRESS = "0x5a791CCAB49931861056365eBC072653F3FA0ba0" as const;
export const EARLY_EXIT_FACTORY_ADDRESS = "0xe78d1d9f5b9daaccf6197a279698bb1e62dd2471" as const;
export const VAULT_OWNER_ADDRESS = "0x8A7f538B6f6Bdab69edD0E311aeDa9214bC5384A" as const;

// ERC1155 Token addresses
export const POLYGON_ERC1155_BRIDGED_BSC_ADDRESS = "0xB42D95Bd05713eD14369fC1a1e4fAF107b27c464" as const;
export const POLYGON_ERC1155_POLYGON_ADDRESS = "0x4d97dcd97ec945f40cf65f87097ace5ea0476045" as const; 
export const OPINION_ERC1155_ADDRESS = "0xAD1a38cEc043e70E83a3eC30443dB285ED10D774" as const;

//Bride Addresses
//send the Polymarket tokens to source bride address to bridge from Polygon to BSC
export const POLYMARKET_SOURCE_BRIDGE_POLYGON_ADDRESS = "0xB42D95Bd05713eD14369fC1a1e4fAF107b27c464" as const;
// send the Polymarket tokens to destination bridge address to bridge from BSC to Polygon
export const POLYMARKET_DESTINATION_BRIDGE_BSC_ADDRESS = POLYGON_ERC1155_BRIDGED_BSC_ADDRESS;

// Token decimals
export const POLYMARKET_DECIMALS = 6;
export const OPINION_DECIMALS = 18;

// Middleware server URL
export const MIDDLEWARE_BASE_URL = 'https://pokvault-middleware-server.vercel.app/api' as const;
