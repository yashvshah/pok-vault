# Adding New Prediction Markets

This guide explains how to add support for a new prediction market to the POKVault dashboard.

## Overview

The POKVault supports two types of prediction markets:

1. **Bridgeable Markets** - Markets that operate on a different chain than the vault (e.g., Polymarket on Polygon, vault on BSC). Tokens must be bridged via Axelar GMP.

2. **Native Markets** - Markets that operate on the same chain as the vault (e.g., Opinion on BSC). No bridging required.

## Architecture

```
src/
├── types/
│   └── predictionMarket.ts       # Core interfaces (PredictionMarketProvider, MarketData, etc.)
├── services/
│   └── providers/
│       ├── index.ts              # Provider registry and exports
│       ├── polymarketProvider.ts # Polymarket implementation (bridgeable)
│       └── opinionProvider.ts    # Opinion implementation (native)
└── config/
    └── addresses.ts              # Contract addresses and constants
```

## Current Abstraction Status

### ✅ Fully Abstracted
- `src/types/predictionMarket.ts` - Provider interfaces
- `src/services/providers/` - Provider registry pattern
- `src/services/marketInfo.ts` - Uses provider registry for lookups
- `src/hooks/useSafeAddresses.ts` - Dynamic Safe detection for all providers
- `src/hooks/useSupportedMarkets.ts` - Dynamic market key generation
- `src/hooks/useVaultActivities.ts` - Uses provider names dynamically
- `src/hooks/usePendingBridgeTransactions.ts` - Uses Safe addresses map
- `src/pages/marketsPage.tsx` - Uses provider registry for all market data
- `src/pages/ManageMarketsPage.tsx` - Uses provider registry

### ⚠️ Bridge-Specific Logic
These files contain bridge-specific logic that is inherently tied to each bridge implementation:

| File | Notes |
|------|-------|
| `src/utils/bridgeBatch.ts` | Bridge transaction batching (each bridge needs custom logic) |
| `src/config/subgraph.ts` | Subgraph URLs per bridge |

## Step-by-Step Guide

### Step 1: Define Contract Addresses

Add your market's contract addresses to `src/config/addresses.ts`:

```typescript
// New Market ERC1155 Token Address (on operating chain)
export const NEW_MARKET_ERC1155_ADDRESS = "0x..." as const;

// Token decimals (typically 6 or 18)
export const NEW_MARKET_DECIMALS = 6;

// If bridgeable, add bridge contract addresses
export const NEW_MARKET_SOURCE_BRIDGE_ADDRESS = "0x..." as const;
export const NEW_MARKET_DEST_BRIDGE_ADDRESS = "0x..." as const;
```

### Step 2: Create Provider Implementation

Create a new file `src/services/providers/newmarketProvider.ts`:

#### For Native Markets (No Bridging)

```typescript
import type { Address } from 'viem';
import type { 
  NativePredictionMarketProvider,
  MarketData,
} from '../../types/predictionMarket';
import { 
  NEW_MARKET_ERC1155_ADDRESS,
  NEW_MARKET_DECIMALS,
  MIDDLEWARE_BASE_URL,
} from '../../config/addresses';
import { bsc } from 'viem/chains'; // or your chain

/**
 * New Market prediction market provider
 * 
 * Operates natively on BSC, no bridging required.
 */
export const newmarketProvider: NativePredictionMarketProvider = {
  id: 'newmarket',
  name: 'New Market',
  operatingChainId: bsc.id,
  erc1155Address: NEW_MARKET_ERC1155_ADDRESS,
  decimals: NEW_MARKET_DECIMALS,
  requiresBridging: false,
  
  // Optional: Safe wallet detection
  safeConfig: {
    type: 'api', // or 'derive' if using CREATE2 derivation
    fetchSafeAddress: async (eoaAddress: Address): Promise<Address | null> => {
      // Implement API call to fetch Safe address
      // Return null if no Safe exists
      return null;
    },
  },

  async getMarketById(marketId: string): Promise<MarketData | null> {
    try {
      // Implement API call to fetch market by ID
      const response = await fetch(`${MIDDLEWARE_BASE_URL}/newmarket/market/${marketId}`);
      
      if (!response.ok) return null;
      
      const data = await response.json();
      
      return {
        id: data.id,
        question: data.question,
        thumbnailUrl: data.image,
        yesTokenId: data.yesTokenId,
        noTokenId: data.noTokenId,
        endDate: data.endDate,
        status: data.active ? 'active' : 'closed',
        url: `https://newmarket.com/market/${data.id}`,
        rawData: data,
      };
    } catch (error) {
      console.error('Error fetching market:', error);
      return null;
    }
  },

  async getMarketByOutcomeToken(outcomeTokenId: string): Promise<MarketData | null> {
    try {
      // Implement lookup by outcome token ID
      // This typically requires an API that maps token ID → market
      const response = await fetch(
        `${MIDDLEWARE_BASE_URL}/newmarket/token/${outcomeTokenId}`
      );
      
      if (!response.ok) return null;
      
      const data = await response.json();
      return this.getMarketById(data.marketId);
    } catch (error) {
      console.error('Error fetching market by token:', error);
      return null;
    }
  },
};
```

#### For Bridgeable Markets

```typescript
import type { 
  BridgeablePredictionMarketProvider,
  MarketData,
  BridgeConfig,
} from '../../types/predictionMarket';
import { polygon, bsc } from 'viem/chains';

/**
 * Bridge configuration for New Market (Source Chain → BSC)
 */
const newmarketBridgeConfig: BridgeConfig = {
  sourceChainId: polygon.id, // Chain where tokens originate
  destinationChainId: bsc.id, // Vault chain
  sourceBridgeAddress: NEW_MARKET_SOURCE_BRIDGE_ADDRESS,
  destinationBridgeAddress: NEW_MARKET_DEST_BRIDGE_ADDRESS,
  axelarGasServiceSourceAddress: AXELAR_GAS_SERVICE_SOURCE_ADDRESS,
  axelarGasServiceDestAddress: AXELAR_GAS_SERVICE_DEST_ADDRESS,
  axelarSourceChainName: 'Polygon', // Axelar chain identifier
  axelarDestChainName: 'binance',
  sourceTokenAddress: NEW_MARKET_SOURCE_TOKEN_ADDRESS,
  destinationTokenAddress: NEW_MARKET_ERC1155_ADDRESS,
};

export const newmarketProvider: BridgeablePredictionMarketProvider = {
  id: 'newmarket',
  name: 'New Market',
  operatingChainId: bsc.id,
  erc1155Address: NEW_MARKET_ERC1155_ADDRESS, // Bridged token on vault chain
  decimals: NEW_MARKET_DECIMALS,
  requiresBridging: true,
  bridgeConfig: newmarketBridgeConfig,
  
  // Safe config if using CREATE2 derivation
  safeConfig: {
    type: 'derive',
    factoryAddress: NEW_MARKET_SAFE_FACTORY_ADDRESS,
  },

  async getMarketById(marketId: string): Promise<MarketData | null> {
    // Implementation...
  },

  async getMarketByOutcomeToken(outcomeTokenId: string): Promise<MarketData | null> {
    // Implementation...
  },
};
```

### Step 3: Register the Provider

Update `src/services/providers/index.ts`:

```typescript
import { newmarketProvider } from './newmarketProvider';

// In the ProviderRegistry constructor:
constructor() {
  this.register(polymarketProvider);
  this.register(opinionProvider);
  this.register(newmarketProvider); // Add your provider
}

// Export the provider
export { newmarketProvider } from './newmarketProvider';
```

### Step 4: Add Middleware API Endpoints (If Needed)

If your market's API has CORS restrictions, add endpoints to the middleware server:

```javascript
// In middleware server
app.get('/api/newmarket/market/:id', async (req, res) => {
  const response = await fetch(`https://api.newmarket.com/v1/markets/${req.params.id}`);
  const data = await response.json();
  res.json(data);
});
```

### Step 5: Add Subgraph Support (For Bridgeable Markets)

If your market requires bridging, you'll need subgraphs to track bridge events:

1. **Source Bridge Subgraph** - Tracks tokens sent for bridging
2. **Destination Bridge Subgraph** - Tracks tokens received after bridging

Update `src/config/subgraph.ts` with new subgraph URLs and queries.

### Step 6: Update Bridge Hooks (For Bridgeable Markets)

If bridging is required, update these hooks to support the new market:

- `src/hooks/usePendingBridgeTransactions.ts`
- `src/hooks/useBridgeTransactionStatus.ts`
- `src/hooks/useBridgeGasEstimate.ts`

## Interface Reference

### PredictionMarketProvider

```typescript
interface PredictionMarketProvider {
  /** Unique identifier (e.g., 'polymarket', 'opinion') */
  id: string;
  
  /** Display name (e.g., 'Polymarket', 'Opinion') */
  name: string;
  
  /** Chain ID where tokens are used for vault operations */
  operatingChainId: number;
  
  /** ERC1155 token contract address (on operating chain) */
  erc1155Address: Address;
  
  /** Token decimals (typically 6 or 18) */
  decimals: number;
  
  /** Whether this market requires bridging to the vault chain */
  requiresBridging: boolean;
  
  /** Bridge configuration (only if requiresBridging is true) */
  bridgeConfig?: BridgeConfig;
  
  /** Safe wallet configuration (optional) */
  safeConfig?: SafeConfig;
  
  /** Fetch market data by market ID */
  getMarketById(marketId: string): Promise<MarketData | null>;
  
  /** Fetch market data by outcome token ID */
  getMarketByOutcomeToken(outcomeTokenId: string): Promise<MarketData | null>;
}
```

### MarketData

```typescript
interface MarketData {
  id: string;
  question: string;
  thumbnailUrl?: string;
  yesTokenId: string;
  noTokenId: string;
  endDate?: string;
  status: 'active' | 'closed' | 'resolved';
  url?: string;
  rawData?: unknown; // Provider-specific data
}
```

### BridgeConfig

```typescript
interface BridgeConfig {
  sourceChainId: number;
  destinationChainId: number;
  sourceBridgeAddress: Address;
  destinationBridgeAddress: Address;
  axelarGasServiceSourceAddress: Address;
  axelarGasServiceDestAddress: Address;
  axelarSourceChainName: string;
  axelarDestChainName: string;
  sourceTokenAddress: Address;
  destinationTokenAddress: Address;
}
```

### SafeConfig

```typescript
interface SafeConfig {
  /** Method to derive/fetch Safe address */
  type: 'derive' | 'api';
  
  /** For 'derive': Factory address used for CREATE2 derivation */
  factoryAddress?: Address;
  
  /** For 'api': Function to fetch Safe address from external API */
  fetchSafeAddress?: (eoaAddress: Address) => Promise<Address | null>;
}
```

## Checklist for New Markets

- [ ] Contract addresses added to `config/addresses.ts`
- [ ] Provider implementation created in `services/providers/`
- [ ] Provider registered in `services/providers/index.ts`
- [ ] Middleware API endpoints added (if CORS issues)
- [ ] Token decimals configured correctly
- [ ] Safe wallet detection implemented (if applicable)
- [ ] **For bridgeable markets:**
  - [ ] Bridge config with Axelar addresses
  - [ ] Subgraphs for bridge event tracking
  - [ ] Bridge hooks updated
- [ ] Build passes without errors (`npm run build`)
- [ ] Markets display correctly in UI
- [ ] Early exit/split operations work

## Testing

1. **Build Check**: `npm run build` should complete without errors
2. **Lint Check**: `npm run lint` should pass
3. **Manual Testing**:
   - Markets from new provider appear in Markets page
   - Token balances display correctly
   - Early exit operations work
   - Bridge operations work (if applicable)

## Common Issues

### Token Not Recognized

Ensure the ERC1155 address is registered in the provider registry:

```typescript
const provider = providerRegistry.getByTokenAddress(tokenAddress);
// Should return your provider, not null
```

### Market Data Not Loading

1. Check middleware API is accessible
2. Verify API response format matches expected structure
3. Check browser console for CORS errors

### Decimal Mismatch

Ensure decimals in provider match actual token implementation:
- Query token contract: `decimals()` function
- Update `NEW_MARKET_DECIMALS` constant

### Bridge Not Working

1. Verify Axelar chain names are correct
2. Check bridge contract addresses
3. Ensure subgraphs are indexing events
