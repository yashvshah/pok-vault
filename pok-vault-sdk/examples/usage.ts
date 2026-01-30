import { POKVaultSDK } from '../src';
import { parseUnits, formatUnits } from 'viem';

async function main() {
  console.log('🚀 POK Vault SDK Example\n');

  // Initialize SDK
  console.log('Initializing SDK...');
  const sdk = new POKVaultSDK({
    bscRpcUrl: process.env.BSC_RPC_URL, // Optional, uses default if not provided
  });

  await sdk.initialize();
  console.log('✅ SDK initialized\n');

  // Example 1: Get all markets
  console.log('📊 Example 1: Get All Markets');
  const allMarkets = sdk.getAllMarkets();
  console.log(`Found ${allMarkets.length} markets`);
  
  if (allMarkets.length > 0) {
    const firstMarket = allMarkets[0];
    console.log(`\nFirst market:`);
    console.log(`  Question: ${firstMarket.question}`);
    console.log(`  Status: ${firstMarket.overallStatus}`);
    console.log(`  Pairs: ${firstMarket.pairs.length}`);
    console.log(`  Providers:`, Array.from(firstMarket.providerQuestions.keys()));
  }
  console.log();

  // Example 2: Search by URL
  console.log('🔍 Example 2: Search Markets by URL');
  const polymarketMarkets = sdk.findMarketsByUrl('polymarket.com');
  console.log(`Found ${polymarketMarkets.length} Polymarket markets`);
  
  if (polymarketMarkets.length > 0) {
    console.log(`\nFirst Polymarket market:`);
    console.log(`  Question: ${polymarketMarkets[0].question}`);
    for (const [provider, url] of polymarketMarkets[0].providerUrls) {
      console.log(`  ${provider} URL: ${url}`);
    }
  }
  console.log();

  // Example 3: Search by provider and status
  console.log('🎯 Example 3: Search by Provider and Status');
  const allowedOpinionMarkets = sdk.searchMarkets({
    provider: 'opinion',
    status: 'allowed',
  });
  console.log(`Found ${allowedOpinionMarkets.length} allowed Opinion markets\n`);

  // Example 4: Find a specific pair and estimate merge
  console.log('💰 Example 4: Estimate Merge (Early Exit)');
  const marketWithPair = allMarkets.find(m => m.pairs.length > 0 && m.overallStatus === 'allowed');
  
  if (marketWithPair && marketWithPair.pairs[0]) {
    const pair = marketWithPair.pairs[0];
    console.log(`Market: ${marketWithPair.question}`);
    console.log(`Pair: ${pair.outcomeIdAIsYesTokenId ? 'YES' : 'NO'} + ${pair.outcomeIdBIsYesTokenId ? 'YES' : 'NO'}`);
    
    try {
      // Estimate merging 100 tokens worth (amount in USDT decimals)
      const amount = parseUnits('100', 18); // Amount in USDT decimals (18)
      
      const mergeEstimate = await sdk.estimateMerge(
        pair.outcomeTokenA,
        BigInt(pair.outcomeIdA),
        pair.outcomeTokenB,
        BigInt(pair.outcomeIdB),
        amount
      );
      
      console.log(`\nMerge Estimation for ${formatUnits(amount, 18)} tokens:`);
      console.log(`  USDT to receive: ${formatUnits(mergeEstimate.estimatedUsdtReceived, 18)}`);
      console.log(`  Vault has liquidity: ${mergeEstimate.vaultHasLiquidity}`);
      console.log(`  Available liquidity: ${formatUnits(mergeEstimate.availableVaultLiquidity, 18)} USDT`);
    } catch (error) {
      console.error('Error estimating merge:', error);
    }
  } else {
    console.log('No allowed pairs found for estimation');
  }
  console.log();

  // Example 5: Estimate split
  console.log('🔄 Example 5: Estimate Split');
  if (marketWithPair && marketWithPair.pairs[0]) {
    const pair = marketWithPair.pairs[0];
    
    try {
      // Estimate splitting 50 USDT
      const usdtAmount = parseUnits('50', 18);
      
      const splitEstimate = await sdk.estimateSplit(
        pair.outcomeTokenA,
        BigInt(pair.outcomeIdA),
        pair.outcomeTokenB,
        BigInt(pair.outcomeIdB),
        usdtAmount
      );
      
      console.log(`Split Estimation for ${formatUnits(usdtAmount, 18)} USDT:`);
      console.log(`  Tokens to receive: ${formatUnits(splitEstimate.estimatedTokensReceived, 18)}`);
      console.log(`  Vault has tokens: ${splitEstimate.vaultHasTokens}`);
      console.log(`  Vault balance Token A: ${formatUnits(splitEstimate.vaultBalanceTokenA, pair.decimalsA)}`);
      console.log(`  Vault balance Token B: ${formatUnits(splitEstimate.vaultBalanceTokenB, pair.decimalsB)}`);
    } catch (error) {
      console.error('Error estimating split:', error);
    }
  }
  console.log();

  // Example 6: Check vault liquidity
  console.log('💎 Example 6: Check Vault Liquidity');
  try {
    const liquidity = await sdk.getVaultLiquidity();
    console.log(`Total assets: ${formatUnits(liquidity.totalAssets, 18)} USDT`);
    console.log(`Available for early exits: ${formatUnits(liquidity.availableLiquidity, 18)} USDT`);
  } catch (error) {
    console.error('Error checking liquidity:', error);
  }
  console.log();

  // Example 7: Find pair by token addresses
  console.log('🔎 Example 7: Find Specific Pair by Token Addresses');
  if (marketWithPair && marketWithPair.pairs[0]) {
    const pair = marketWithPair.pairs[0];
    
    const foundPair = sdk.findPair(
      pair.outcomeTokenA,
      BigInt(pair.outcomeIdA),
      pair.outcomeTokenB,
      BigInt(pair.outcomeIdB)
    );
    
    if (foundPair) {
      console.log(`✅ Found pair in market: ${foundPair.market.question}`);
      console.log(`   Pair status: ${foundPair.pair.status}`);
      console.log(`   Decimals: ${foundPair.pair.decimalsA} / ${foundPair.pair.decimalsB}`);
    }
  }
  console.log();

  console.log('✨ Example complete!');
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Error:', error);
    process.exit(1);
  });
