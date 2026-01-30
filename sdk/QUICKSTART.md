# POK Vault SDK - Quick Start Guide

## Installation

```bash
npm install @pokvault/sdk
```

## Typical Workflow

The most common usage pattern: **Initialize → Get market by key → Estimate**

```typescript
import { POKVaultSDK, parseUnits } from '@pokvault/sdk';

async function main() {
  // 1. Initialize SDK
  const sdk = new POKVaultSDK({
    bscRpcUrl: 'https://your-rpc-url.com', // Recommended: Provide your own RPC URL
  });
  // ⚠️ Note: If you don't provide bscRpcUrl, the default BSC RPC will be used,
  // but performance will be slow and you'll see a warning on each estimation call
  
  await sdk.initialize();
  
  // 2. Get market using market key
  const marketKey = 'opinion-3019_polymarket-537486';
  const market = sdk.getMarket(marketKey);
  
  if (!market || market.pairs.length === 0) {
    console.log('Market not found or has no pairs');
    return;
  }
  
  console.log('Market:', market.question);
  // Output: "Will the U.S. collect between $200b and $500b in revenue in 2025?"
  
  // 3. Use the first pair for estimation
  const pair = market.pairs[0];
  
  // 4. Estimate merge (early exit)
  const mergeEstimate = await sdk.estimateMerge(
    pair.outcomeTokenA,
    BigInt(pair.outcomeIdA),
    pair.outcomeTokenB,
    BigInt(pair.outcomeIdB),
    parseUnits('10', 18) // Amount in USDT decimals (18)
  );
  
  console.log('USDT to receive:', mergeEstimate.estimatedUsdtReceived);
  console.log('Vault has liquidity:', mergeEstimate.vaultHasLiquidity);
  
  // 5. Estimate split
  const splitEstimate = await sdk.estimateSplit(
    pair.outcomeTokenA,
    BigInt(pair.outcomeIdA),
    pair.outcomeTokenB,
    BigInt(pair.outcomeIdB),
    parseUnits('10', 18) // USDT amount in USDT decimals (18)
  );
  
  console.log('Tokens to receive:', splitEstimate.estimatedTokensReceived);
  console.log('Vault has tokens:', splitEstimate.vaultHasTokens);
}

main();
```

## Understanding Market Keys

### What is a Market Key?

A market key uniquely identifies an arbitrage opportunity between Polymarket and Opinion markets.

**Format:**
```
opinion-{marketId}_polymarket-{marketId}
```

### IMPORTANT: Market ID vs Topic ID

⚠️ **Market ID** refers to a **specific child market**, NOT the parent topic!

#### Example: Opinion

**Topic 196**: "How much revenue will the U.S. raise from tariffs in 2025?" (Parent)

This topic contains multiple child markets:
- **Market 3018**: "How much revenue will the U.S. raise from tariffs in 2025? - <$100b"
- **Market 3019**: "How much revenue will the U.S. raise from tariffs in 2025? - $200-500b"
- **Market 3020**: "How much revenue will the U.S. raise from tariffs in 2025? - >$500b"

The key is created from the specific child market id. 

#### Example: Polymarket

Similarly, Polymarket has separate market IDs for each specific question.

For example: We don't care about the market id of a market. This is what a market looks like [Pro Football Champion 2026](https://polymarket.com/event/super-bowl-champion-2026-731). We care about the specific event id in the key. For example: [Pro Football Champion 2026 - Seattle?] (https://polymarket.com/event/super-bowl-champion-2026-731/will-the-seattle-seahawks-win-super-bowl-2026)

### Real Example

```typescript
// This market key refers to a SPECIFIC outcome: "$200-500b"
const marketKey = 'opinion-3019_polymarket-537486';

// opinion-3019: Opinion child market for "$200-500b" outcome
// polymarket-537486: Corresponding Polymarket market

const market = sdk.getMarket(marketKey);
console.log(market?.question);
// "Will the U.S. collect between $200b and $500b in revenue in 2025?"
```

## Key Concepts

### 1. Markets vs Pairs
- A **Market** represents a specific prediction market question and outcome
- Each market can have multiple **Pairs** (combinations of opposite outcome tokens from different providers)
- Example: Polymarket NO + Opinion YES, or Polymarket YES + Opinion NO

### 2. Amount Decimals (CRITICAL!)

⚠️ **All amounts must be in USDT decimals (18)** for both merge and split operations!

```typescript
import { parseUnits, formatUnits } from 'viem';

// Correct: Use USDT decimals (18) for all amounts
const amount = parseUnits('10', 18); // 10 tokens worth

// Estimate merge
await sdk.estimateMerge(tokenA, tokenIdA, tokenB, tokenIdB, amount);

// Estimate split
await sdk.estimateSplit(tokenA, tokenIdA, tokenB, tokenIdB, amount);

// Format for display
const formatted = formatUnits(amount, 18); // "10"
```

### 3. Merge vs Split

**Merge (Early Exit)**:
- Input: Opposite outcome tokens (e.g., NO from Polymarket + YES from Opinion)
- Output: USDT at a discounted rate
- Use `estimateMerge()`

**Split**:
- Input: USDT
- Output: Opposite outcome tokens
- Use `estimateSplit()`

## Additional Examples

### Check Vault Liquidity Before Operations

```typescript
const liquidity = await sdk.getVaultLiquidity();
console.log('Available:', formatUnits(liquidity.availableLiquidity, 18));

// Then proceed with estimation
const estimate = await sdk.estimateMerge(/* ... */);
```

### Get All Available Markets (Less Common)

```typescript
const allMarkets = sdk.getAllMarkets();
console.log(`Found ${allMarkets.length} markets`);

// Find allowed markets
const allowedMarkets = allMarkets.filter(m => m.overallStatus === 'allowed');
```

### Search Markets by Criteria (Less Common)

```typescript
// By provider
const opinionMarkets = sdk.searchMarkets({ provider: 'opinion' });

// By status
const allowedMarkets = sdk.searchMarkets({ status: 'allowed' });

// Combined
const filtered = sdk.searchMarkets({
  provider: 'opinion',
  status: 'allowed',
  question: 'revenue'
});
```

### Find Markets by URL (Less Common)

```typescript
const markets = sdk.findMarketsByUrl('polymarket.com/market/will-the-us-collect-between-200b-and-500b-in-revenue-in-2025');
console.log(`Found ${markets.length} markets`);
```

### Find Pair by Token Addresses (Less Common)

```typescript
// Example: Find the U.S. revenue market pair
const result = sdk.findPair(
  '0x77b0052a346b22ea1f3112e3fcef079567ed9979', // Polymarket (bridged on BSC)
  BigInt('50221315964000194764695024582522009520159992363520263771661265416131198909217'), // Polymarket NO
  '0xAD1a38cEc043e70E83a3eC30443dB285ED10D774', // Opinion
  BigInt('35513231639220004155539972249688601367978586874260018267891931866327496090530') // Opinion YES
);

if (result) {
  console.log('Market key:', result.market.marketKey);
  // Output: "opinion-3019_polymarket-537486"
}
```

## Configuration Options

```typescript
const sdk = new POKVaultSDK({
  bscRpcUrl: 'https://your-custom-rpc.com',  // Recommended for better performance
});

// ⚠️ If you don't provide bscRpcUrl, a warning will be printed on each estimation call
```

## Error Handling

```typescript
try {
  const sdk = new POKVaultSDK({
    bscRpcUrl: 'https://your-rpc-url.com', // Recommended
  });
  await sdk.initialize();
  
  const market = sdk.getMarket('opinion-3019_polymarket-537486');
  if (!market) {
    throw new Error('Market not found');
  }
  
  const estimate = await sdk.estimateMerge(/* ... */);
  
  if (!estimate.vaultHasLiquidity) {
    console.warn('Insufficient vault liquidity');
  }
} catch (error) {
  console.error('SDK Error:', error);
}
```

## Refresh Data

```typescript
// Re-fetch all market data
await sdk.refresh();
```

## Need Help?

- Check the [README.md](./README.md) for full API documentation
- Review the code examples above for common use cases
