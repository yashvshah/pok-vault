// Contract addresses
export const VAULT_ADDRESS = "0x5a791CCAB49931861056365eBC072653F3FA0ba0" as const;
export const EARLY_EXIT_FACTORY_ADDRESS = "0xe78d1d9f5b9daaccf6197a279698bb1e62dd2471" as const;
export const VAULT_OWNER_ADDRESS = "0x8A7f538B6f6Bdab69edD0E311aeDa9214bC5384A" as const;

// ERC1155 Token addresses
export const POLYGON_ERC1155_BRIDGED_BSC_ADDRESS = "0x77b0052A346B22Ea1F3112E3FCEF079567eD9979" as const;
export const POLYGON_ERC1155_BRIDGED_BSC_OLD_BUGGY_ADDRESS = "0xB42D95Bd05713eD14369fC1a1e4fAF107b27c464" as const;
export const POLYGON_ERC1155_POLYGON_ADDRESS = "0x4d97dcd97ec945f40cf65f87097ace5ea0476045" as const; 
export const OPINION_ERC1155_ADDRESS = "0xAD1a38cEc043e70E83a3eC30443dB285ED10D774" as const;

//Bride Addresses
//send the Polymarket tokens to source bride address to bridge from Polygon to BSC
export const POLYMARKET_SOURCE_BRIDGE_POLYGON_ADDRESS = "0x77b0052A346B22Ea1F3112E3FCEF079567eD9979" as const;

// send the Polymarket tokens to destination bridge address to bridge from BSC to Polygon
export const POLYMARKET_DESTINATION_BRIDGE_BSC_ADDRESS = POLYGON_ERC1155_BRIDGED_BSC_ADDRESS;

export const AXELAR_GATEWAY_BSC_ADDRESS = "0x304acf330bbE08d1e512eefaa92F6a57871fD895" as const;
export const AXELAR_GATEWAY_POLYGON_ADDRESS = "0x6f015F16De9fC8791b234eF68D486d2bF203FBA8" as const;

export const AXELAR_POLYGON_CHAIN_NAME = "Polygon" as const;
export const AXELAR_BSC_CHAIN_NAME = "binance" as const;

export const AXELAR_GAS_SERVICE_BSC_ADDRESS = "0x2d5d7d31f671f86c782533cc367f14109a082712" as const;
export const AXELAR_GAS_SERVICE_POLYGON_ADDRESS = "0x2d5d7d31F671F86C782533cc367F14109a082712" as const;

export const MULTI_SEND_CALL_ONLY_BSC_ADDRESS = "0x40A2aCCbd92BCA938b02010E17A5b8929b49130D" as const;
export const MULTI_SEND_CALL_ONLY_POLYGON_ADDRESS = "0x40A2aCCbd92BCA938b02010E17A5b8929b49130D" as const;

// Token decimals
export const POLYMARKET_DECIMALS = 6;
export const OPINION_DECIMALS = 18;
export const USDT_ADDRESS = "0x55d398326f99059fF775485246999027B3197955" as const;
export const USDT_DECIMALS = 18;
// Middleware server URL
export const MIDDLEWARE_BASE_URL = 'https://pokvault-middleware-server.vercel.app/api' as const;
