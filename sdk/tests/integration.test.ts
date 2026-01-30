import { describe, it, expect, beforeAll } from 'vitest';
import { POKVaultSDK } from '../src/PokVaultSDK';
import { parseUnits } from 'viem';

describe('POK Vault SDK - Integration Tests', () => {
  let sdk: POKVaultSDK;

  // Expected market data from the user
  const expectedMarket = {
    marketKey: 'opinion-3019_polymarket-537486',
    question: 'Will the U.S. collect between $200b and $500b in revenue in 2025?',
    overallStatus: 'allowed' as const,
    polymarket: {
      url: 'https://polymarket.com/market/will-the-us-collect-between-200b-and-500b-in-revenue-in-2025',
      yesTokenId: '19180751334892649957685662514970856594118361572000181281162861811532650604260',
      noTokenId: '50221315964000194764695024582522009520159992363520263771661265416131198909217',
      erc1155Address: '0x77b0052a346b22ea1f3112e3fcef079567ed9979',
    },
    opinion: {
      yesTokenId: '35513231639220004155539972249688601367978586874260018267891931866327496090530',
      noTokenId: '41474915856048334352183715970634308525944998923613111859944785870062124469780',
      erc1155Address: '0xAD1a38cEc043e70E83a3eC30443dB285ED10D774',
    },
  };

  beforeAll(async () => {
    console.log('Initializing SDK...');
    sdk = new POKVaultSDK();
    await sdk.initialize();
    console.log('SDK initialized successfully');
  }, 120000); // 2 minutes timeout for initialization

  describe('Initialization', () => {
    it('should initialize and fetch markets', () => {
      const markets = sdk.getAllMarkets();
      expect(markets.length).toBeGreaterThan(0);
      console.log(`✓ Found ${markets.length} markets`);
    });

    it('should contain the expected market', () => {
      const market = sdk.getMarket(expectedMarket.marketKey);
      expect(market).toBeDefined();
      expect(market?.marketKey).toBe(expectedMarket.marketKey);
      console.log(`✓ Found market: ${expectedMarket.marketKey}`);
    });

    it('should have correct market details', () => {
      const market = sdk.getMarket(expectedMarket.marketKey);
      expect(market).toBeDefined();
      
      // Check question
      expect(market!.question).toBe(expectedMarket.question);
      
      // Check status
      expect(market!.overallStatus).toBe(expectedMarket.overallStatus);
      
      // Check has two providers
      expect(market!.providerQuestions.size).toBeGreaterThanOrEqual(2);
      expect(market!.providerTokenIds.has('polymarket')).toBe(true);
      expect(market!.providerTokenIds.has('opinion')).toBe(true);
      
      console.log('✓ Market details match expected values');
    });

    it('should have correct token IDs for providers', () => {
      const market = sdk.getMarket(expectedMarket.marketKey);
      expect(market).toBeDefined();
      
      const polymarketTokens = market!.providerTokenIds.get('polymarket');
      expect(polymarketTokens).toBeDefined();
      expect(polymarketTokens!.yesTokenId).toBe(expectedMarket.polymarket.yesTokenId);
      expect(polymarketTokens!.noTokenId).toBe(expectedMarket.polymarket.noTokenId);
      
      const opinionTokens = market!.providerTokenIds.get('opinion');
      expect(opinionTokens).toBeDefined();
      expect(opinionTokens!.yesTokenId).toBe(expectedMarket.opinion.yesTokenId);
      expect(opinionTokens!.noTokenId).toBe(expectedMarket.opinion.noTokenId);
      
      console.log('✓ Token IDs match for both providers');
    });

    it('should have correct pairs', () => {
      const market = sdk.getMarket(expectedMarket.marketKey);
      expect(market).toBeDefined();
      expect(market!.pairs.length).toBeGreaterThanOrEqual(1);
      
      // Check that pairs have correct status
      const allowedPairs = market!.pairs.filter(p => p.status === 'allowed');
      expect(allowedPairs.length).toBeGreaterThan(0);
      
      console.log(`✓ Market has ${market!.pairs.length} pairs, ${allowedPairs.length} allowed`);
    });
  });

  describe('Market Search', () => {
    it('should find market by Polymarket URL', () => {
      const markets = sdk.findMarketsByUrl('polymarket.com/market/will-the-us-collect-between-200b-and-500b-in-revenue-in-2025');
      expect(markets.length).toBeGreaterThan(0);
      
      const found = markets.find(m => m.marketKey === expectedMarket.marketKey);
      expect(found).toBeDefined();
      
      console.log('✓ Found market by Polymarket URL');
    });

    it('should find market by Opinion URL pattern', () => {
      const markets = sdk.findMarketsByUrl('app.opinion.trade/detail?topicId=196');
      expect(markets.length).toBeGreaterThan(0);
      
      const found = markets.find(m => m.marketKey === expectedMarket.marketKey);
      expect(found).toBeDefined();
      
      console.log('✓ Found market by Opinion URL');
    });

    it('should find market by partial URL', () => {
      const markets = sdk.findMarketsByUrl('revenue-in-2025');
      expect(markets.length).toBeGreaterThan(0);
      
      const found = markets.find(m => m.marketKey === expectedMarket.marketKey);
      expect(found).toBeDefined();
      
      console.log('✓ Found market by partial URL');
    });

    it('should find market by status: allowed', () => {
      const markets = sdk.searchMarkets({ status: 'allowed' });
      expect(markets.length).toBeGreaterThan(0);
      
      const found = markets.find(m => m.marketKey === expectedMarket.marketKey);
      expect(found).toBeDefined();
      
      console.log(`✓ Found ${markets.length} allowed markets (including expected)`);
    });

    it('should find market by provider: opinion + status: allowed', () => {
      const markets = sdk.searchMarkets({
        provider: 'opinion',
        status: 'allowed',
      });
      expect(markets.length).toBeGreaterThan(0);
      
      const found = markets.find(m => m.marketKey === expectedMarket.marketKey);
      expect(found).toBeDefined();
      
      console.log(`✓ Found ${markets.length} allowed Opinion markets (including expected)`);
    });

    it('should find market by provider: opinion + status: allowed + question: revenue', () => {
      const markets = sdk.searchMarkets({
        provider: 'opinion',
        status: 'allowed',
        question: 'revenue',
      });
      expect(markets.length).toBeGreaterThan(0);
      
      const found = markets.find(m => m.marketKey === expectedMarket.marketKey);
      expect(found).toBeDefined();
      
      console.log(`✓ Found ${markets.length} markets matching all criteria (including expected)`);
    });
  });

  describe('Token Pair Finding', () => {
    it('should find pair by token addresses and IDs', () => {
      const market = sdk.getMarket(expectedMarket.marketKey);
      expect(market).toBeDefined();
      
      if (market && market.pairs.length > 0) {
        const pair = market.pairs[0];
        
        const result = sdk.findPair(
          pair.outcomeTokenA,
          BigInt(pair.outcomeIdA),
          pair.outcomeTokenB,
          BigInt(pair.outcomeIdB)
        );
        
        expect(result).toBeDefined();
        expect(result?.market.marketKey).toBe(expectedMarket.marketKey);
        expect(result?.pair.key).toBe(pair.key);
        
        console.log('✓ Found pair by token addresses and IDs');
      }
    });
  });

  describe('Estimation - Merge', () => {
    it('should estimate merge for the market', async () => {
      const market = sdk.getMarket(expectedMarket.marketKey);
      expect(market).toBeDefined();
      
      if (market && market.pairs.length > 0) {
        const pair = market.pairs[0];
        
        // Estimate merging 10 tokens worth (amount in USDT decimals)
        const amount = parseUnits('10', 18); // Amount in USDT decimals (18)
        
        const estimate = await sdk.estimateMerge(
          pair.outcomeTokenA,
          BigInt(pair.outcomeIdA),
          pair.outcomeTokenB,
          BigInt(pair.outcomeIdB),
          amount
        );
        
        expect(estimate).toBeDefined();
        expect(estimate.estimatedUsdtReceived).toBeGreaterThan(0n);
        expect(typeof estimate.vaultHasLiquidity).toBe('boolean');
        expect(estimate.availableVaultLiquidity).toBeGreaterThanOrEqual(0n);
        expect(estimate.totalAssets).toBeGreaterThan(0n);
        
        console.log('✓ Merge estimation successful');
        console.log(`  Estimated USDT: ${estimate.estimatedUsdtReceived}`);
        console.log(`  Vault has liquidity: ${estimate.vaultHasLiquidity}`);
        console.log(`  Available liquidity: ${estimate.availableVaultLiquidity}`);
      }
    });

    it('should handle merge estimation for different amounts', async () => {
      const market = sdk.getMarket(expectedMarket.marketKey);
      expect(market).toBeDefined();
      
      if (market && market.pairs.length > 0) {
        const pair = market.pairs[0];
        
        const amounts = ['1', '10', '100'];
        
        for (const amt of amounts) {
          const amount = parseUnits(amt, 18); // Amount in USDT decimals (18)
          
          const estimate = await sdk.estimateMerge(
            pair.outcomeTokenA,
            BigInt(pair.outcomeIdA),
            pair.outcomeTokenB,
            BigInt(pair.outcomeIdB),
            amount
          );
          
          expect(estimate.estimatedUsdtReceived).toBeGreaterThan(0n);
        }
        
        console.log(`✓ Merge estimation works for amounts: ${amounts.join(', ')}`);
      }
    });
  });

  describe('Estimation - Split', () => {
    it('should estimate split for the market', async () => {
      const market = sdk.getMarket(expectedMarket.marketKey);
      expect(market).toBeDefined();
      
      if (market && market.pairs.length > 0) {
        const pair = market.pairs[0];
        
        // Estimate splitting 10 USDT
        const usdtAmount = parseUnits('10', 18);
        
        const estimate = await sdk.estimateSplit(
          pair.outcomeTokenA,
          BigInt(pair.outcomeIdA),
          pair.outcomeTokenB,
          BigInt(pair.outcomeIdB),
          usdtAmount
        );
        
        expect(estimate).toBeDefined();
        expect(estimate.estimatedTokensReceived).toBeGreaterThan(0n);
        expect(typeof estimate.vaultHasTokens).toBe('boolean');
        expect(estimate.vaultBalanceTokenA).toBeGreaterThanOrEqual(0n);
        expect(estimate.vaultBalanceTokenB).toBeGreaterThanOrEqual(0n);
        
        console.log('✓ Split estimation successful');
        console.log(`  Estimated tokens: ${estimate.estimatedTokensReceived}`);
        console.log(`  Vault has tokens: ${estimate.vaultHasTokens}`);
        console.log(`  Vault balance A: ${estimate.vaultBalanceTokenA}`);
        console.log(`  Vault balance B: ${estimate.vaultBalanceTokenB}`);
      }
    });

    it('should handle split estimation for different USDT amounts', async () => {
      const market = sdk.getMarket(expectedMarket.marketKey);
      expect(market).toBeDefined();
      
      if (market && market.pairs.length > 0) {
        const pair = market.pairs[0];
        
        const amounts = ['1', '10', '50'];
        
        for (const amt of amounts) {
          const usdtAmount = parseUnits(amt, 18);
          
          const estimate = await sdk.estimateSplit(
            pair.outcomeTokenA,
            BigInt(pair.outcomeIdA),
            pair.outcomeTokenB,
            BigInt(pair.outcomeIdB),
            usdtAmount
          );
          
          expect(estimate.estimatedTokensReceived).toBeGreaterThan(0n);
        }
        
        console.log(`✓ Split estimation works for USDT amounts: ${amounts.join(', ')}`);
      }
    });
  });

  describe('Vault Liquidity', () => {
    it('should get vault liquidity information', async () => {
      const liquidity = await sdk.getVaultLiquidity();
      
      expect(liquidity).toBeDefined();
      expect(liquidity.totalAssets).toBeGreaterThan(0n);
      expect(liquidity.availableLiquidity).toBeGreaterThanOrEqual(0n);
      
      console.log('✓ Vault liquidity check successful');
      console.log(`  Total assets: ${liquidity.totalAssets}`);
      console.log(`  Available liquidity: ${liquidity.availableLiquidity}`);
    });
  });
});
