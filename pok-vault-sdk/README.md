# POK Vault SDK

TypeScript SDK for estimating merge and split costs for prediction market outcome tokens on POK Vault.

## Features

- **Market Access**: Get market details supported by POK Vault
- **Estimation**: Calculate merge (early exit) and split costs

## Installation

```bash
npm install @pokvault/sdk
# or
yarn add @pokvault/sdk
# or
pnpm add @pokvault/sdk
```

## Quick Start

The typical workflow is: **Initialize → Get market by key → Estimate**

```typescript
import { POKVaultSDK, parseUnits } from '@pokvault/sdk';

// 1. Initialize the SDK
const sdk = new POKVaultSDK({
  bscRpcUrl: 'https://your-rpc-url.com', // Recommended: Provide your own RPC for better performance
});
// Note: If no RPC URL is provided, the default BSC RPC will be used, but performance may be slow

await sdk.initialize();

// 2. Get market using market key
const market = sdk.getMarket('opinion-3019_polymarket-537486');

// 3. Use the first available pair for estimation
if (market && market.pairs.length > 0) {
  const pair = market.pairs[0];
  
  // Estimate merge (early exit)
  const mergeEstimate = await sdk.estimateMerge(
    pair.outcomeTokenA,
    BigInt(pair.outcomeIdA),
    pair.outcomeTokenB,
    BigInt(pair.outcomeIdB),
    parseUnits('10', 18) // Amount in USDT decimals (18)
  );
  
  console.log('USDT to receive:', mergeEstimate.estimatedUsdtReceived);
  console.log('Vault has liquidity:', mergeEstimate.vaultHasLiquidity);
}
```

## Understanding Market Keys

Market keys uniquely identify arbitrage opportunities between Polymarket and Opinion markets.

### Format
```
opinion-{marketId}_polymarket-{marketId}
```

**Market ID** in the key refers to a **specific child market**, NOT the parent topic.

#### Example: Opinion
- **Topic ID 196**: "How much revenue will the U.S. raise from tariffs in 2025?" (Parent topic)
  - **Market ID 3018**: "How much revenue will the U.S. raise from tariffs in 2025? - <$100b" (Child market)
  - **Market ID 3019**: "How much revenue will the U.S. raise from tariffs in 2025? - $200-500b" (Child market)
  - **Market ID 3020**: "How much revenue will the U.S. raise from tariffs in 2025? - >$500b" (Child market)

#### The same is true for polymarket markets as well

### Real Market Key Example
```typescript
// Market key for: "Will the U.S. collect between $200b and $500b in revenue in 2025?"
const marketKey = 'opinion-3019_polymarket-537486';

// opinion-3019: Opinion child market for "$200-500b" outcome
// polymarket-537486: Corresponding Polymarket market

const market = sdk.getMarket(marketKey);
```

## Usage Examples

### Estimating Merge (Early Exit)

Merge allows you to exchange opposite outcome tokens (e.g., NO from Polymarket + YES from Opinion) for USDT at a discounted rate.

```typescript
import { POKVaultSDK, parseUnits } from '@pokvault/sdk';

const sdk = new POKVaultSDK();
await sdk.initialize();

// Get market using market key
const market = sdk.getMarket('opinion-3019_polymarket-537486');

if (market && market.pairs.length > 0) {
  const pair = market.pairs[0];
  
  // Estimate merge for 10 tokens worth
  const mergeEstimate = await sdk.estimateMerge(
    pair.outcomeTokenA,
    BigInt(pair.outcomeIdA),
    pair.outcomeTokenB,
    BigInt(pair.outcomeIdB),
    parseUnits('10', 18) // Amount in USDT decimals (18)
  );
  
  console.log('USDT to receive:', mergeEstimate.estimatedUsdtReceived);
  console.log('Vault has liquidity:', mergeEstimate.vaultHasLiquidity);
  console.log('Available liquidity:', mergeEstimate.availableVaultLiquidity);
}
```

### Estimating Split

Split allows you to exchange USDT for opposite outcome tokens.

```typescript
import { POKVaultSDK, parseUnits } from '@pokvault/sdk';

const sdk = new POKVaultSDK();
await sdk.initialize();

// Get market using market key
const market = sdk.getMarket('opinion-3019_polymarket-537486');

if (market && market.pairs.length > 0) {
  const pair = market.pairs[0];
  
  // Estimate split for 10 USDT
  const splitEstimate = await sdk.estimateSplit(
    pair.outcomeTokenA,
    BigInt(pair.outcomeIdA),
    pair.outcomeTokenB,
    BigInt(pair.outcomeIdB),
    parseUnits('10', 18) // 10 USDT (18 decimals)
  );
  
  console.log('Tokens to receive:', splitEstimate.estimatedTokensReceived);
  console.log('Vault has tokens:', splitEstimate.vaultHasTokens);
}
```

### Advanced: Finding Markets (Optional)

While most users work with market keys directly, you can also discover markets:

```typescript
// Search by URL pattern (less common)
const markets = sdk.findMarketsByUrl('polymarket.com/market/will-the-us-collect-between-200b-and-500b-in-revenue-in-2025');

// Search by provider, status, or question (less common)
const filteredMarkets = sdk.searchMarkets({
  provider: 'opinion',
  status: 'allowed',
  question: 'revenue',
});

// Get all markets (less common)
const allMarkets = sdk.getAllMarkets();
```

### Advanced: Finding Token Pairs by Addresses (Optional)

```typescript
// If you already have the token addresses and IDs, you can find the pair directly
const result = sdk.findPair(
  '0x77b0052a346b22ea1f3112e3fcef079567ed9979', // Polymarket token address (bridged on BSC)
  BigInt('50221315964000194764695024582522009520159992363520263771661265416131198909217'), // Polymarket NO token ID
  '0xAD1a38cEc043e70E83a3eC30443dB285ED10D774', // Opinion token address
  BigInt('35513231639220004155539972249688601367978586874260018267891931866327496090530') // Opinion YES token ID
);

if (result) {
  console.log('Market key:', result.market.marketKey);
  // Output: "opinion-3019_polymarket-537486"
}
```

### Checking Vault Liquidity

```typescript
const liquidity = await sdk.getVaultLiquidity();
console.log('Total assets:', liquidity.totalAssets);
console.log('Available for early exits:', liquidity.availableLiquidity);
```

## API Reference

### `POKVaultSDK`

#### Constructor

```typescript
new POKVaultSDK(config?: SDKConfig)
```

**Config Options:**
- `bscRpcUrl?: string` - BSC RPC URL (optional, default: `https://bsc-dataseed.binance.org/`)
  - ⚠️ **Recommended**: Provide your own RPC URL for better performance
  - If not provided, a warning will be shown on each estimation call

#### Core Methods

##### `initialize(): Promise<void>`
Initialize the SDK by fetching all supported markets. **Must be called before using other methods.**

##### `getMarket(marketKey: string): MarketMetadata | undefined`
Get a specific market by its market key. **This is the primary method for accessing markets.**

**Example:**
```typescript
const market = sdk.getMarket('opinion-3019_polymarket-537486');
```

##### `estimateMerge(tokenA: Address, tokenIdA: bigint, tokenB: Address, tokenIdB: bigint, amount: bigint): Promise<MergeEstimationResult>`
Estimate merge (early exit) - returns USDT received. **Note: `amount` must be in USDT decimals (18).**

##### `estimateSplit(tokenA: Address, tokenIdA: bigint, tokenB: Address, tokenIdB: bigint, usdtAmount: bigint): Promise<SplitEstimationResult>`
Estimate split - returns outcome tokens received. **Note: `usdtAmount` must be in USDT decimals (18).**

##### `getVaultLiquidity(): Promise<{ totalAssets: bigint; availableLiquidity: bigint }>`
Get current vault liquidity information.

#### Discovery Methods (Optional)

##### `getAllMarkets(): MarketMetadata[]`
Get all supported markets.

##### `searchMarkets(params: MarketSearchParams): MarketMetadata[]`
Search markets by various criteria.

**Params:**
- `url?: string` - URL pattern to match
- `provider?: string` - Provider ID ('polymarket', 'opinion')
- `status?: 'allowed' | 'paused' | 'removed'` - Market status
- `question?: string` - Question text to search

##### `findMarketsByUrl(urlPattern: string): MarketMetadata[]`
Find markets containing the given URL pattern.

##### `findPair(tokenA: Address, tokenIdA: bigint, tokenB: Address, tokenIdB: bigint)`
Find a specific token pair by token addresses and IDs.

## Types

### `MarketMetadata`

```typescript
interface MarketMetadata {
  marketKey: string;
  question: string;
  providerQuestions: Map<string, string>;
  providerImages: Map<string, string>;
  providerTokenIds: Map<string, { yesTokenId: string; noTokenId: string }>;
  providerUrls: Map<string, string>;
  pairs: OutcomeTokenPair[];
  overallStatus: 'allowed' | 'paused' | 'removed';
}
```

### `OutcomeTokenPair`

```typescript
interface OutcomeTokenPair {
  key: string;
  outcomeTokenA: Address;
  outcomeIdA: string;
  outcomeIdAIsYesTokenId: boolean;
  outcomeTokenB: Address;
  outcomeIdB: string;
  outcomeIdBIsYesTokenId: boolean;
  earlyExitAmountContract: Address;
  decimalsA: number;
  decimalsB: number;
  status: 'allowed' | 'paused' | 'removed';
  timestamp: number;
}
```

### `MergeEstimationResult`

```typescript
interface MergeEstimationResult {
  estimatedUsdtReceived: bigint;
  vaultHasLiquidity: boolean;
  availableVaultLiquidity: bigint;
  totalAssets: bigint;
  totalEarlyExited: bigint;
}
```

### `SplitEstimationResult`

```typescript
interface SplitEstimationResult {
  estimatedTokensReceived: bigint;
  vaultHasTokens: boolean;
  vaultBalanceTokenA: bigint;
  vaultBalanceTokenB: bigint;
}
```

## Constants

```typescript
import {
  VAULT_ADDRESS,
  POLYGON_ERC1155_BRIDGED_BSC_ADDRESS,
  OPINION_ERC1155_ADDRESS,
  USDT_ADDRESS,
  POLYMARKET_DECIMALS, // 6
  OPINION_DECIMALS, // 18
  USDT_DECIMALS, // 18
  BSC_CHAIN_ID, // 56
} from '@pokvault/sdk';
```

## Token Decimals

When working with token amounts, remember:
- **Polymarket tokens**: 6 decimals
- **Opinion tokens**: 18 decimals
- **USDT**: 18 decimals

Use viem's `parseUnits` and `formatUnits` for conversions:

```typescript
import { parseUnits, formatUnits } from 'viem';

// Parse 100 USDT to wei (18 decimals)
const usdtAmount = parseUnits('100', 18);

// Format wei back to human-readable
const formatted = formatUnits(usdtAmount, 18); // "100"
```

## Error Handling

```typescript
try {
  const sdk = new POKVaultSDK();
  await sdk.initialize();
  
  const estimate = await sdk.estimateMerge(/* ... */);
  console.log('Estimate:', estimate);
} catch (error) {
  console.error('SDK Error:', error);
}
```

## License

MIT
