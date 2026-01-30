import type { Address } from 'viem';
import type { SDKConfig, MarketSearchParams, MarketMetadata, MergeEstimationResult, SplitEstimationResult } from './types';
import { SubgraphService, createPairKey } from './services/subgraph';
import { MiddlewareService } from './services/middleware';
import { EstimationService } from './services/estimation';
import { MarketRegistry } from './registry/MarketRegistry';
import { DEFAULT_BSC_RPC_URL, MIDDLEWARE_BASE_URL } from './config/constants';

export class POKVaultSDK {
  private subgraphService: SubgraphService;
  private middlewareService: MiddlewareService;
  private estimationService: EstimationService;
  private marketRegistry: MarketRegistry;
  private initialized = false;
  private isUsingDefaultRpc: boolean;

  constructor(config?: SDKConfig) {
    const bscRpcUrl = config?.bscRpcUrl || DEFAULT_BSC_RPC_URL;
    this.isUsingDefaultRpc = !config?.bscRpcUrl;

    this.subgraphService = new SubgraphService();
    this.middlewareService = new MiddlewareService(MIDDLEWARE_BASE_URL);
    this.estimationService = new EstimationService(bscRpcUrl);
    this.marketRegistry = new MarketRegistry();
  }

  /**
   * Initialize the SDK by fetching all supported markets from subgraph and middleware
   * This must be called before using any other methods
   */
  async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    // Fetch outcome pairs from subgraph
    const [newPairs, pausedMap, removedMap] = await Promise.all([
      this.subgraphService.fetchNewOutcomePairs(),
      this.subgraphService.fetchPausedOutcomePairs(),
      this.subgraphService.fetchRemovedOutcomePairs(),
    ]);

    // Collect all tokens to fetch market info for
    const tokensToFetch: Array<{ tokenAddress: string; outcomeTokenId: string }> = [];
    
    for (const pair of newPairs) {
      tokensToFetch.push(
        { tokenAddress: pair.outcomeTokenA, outcomeTokenId: pair.outcomeIdA },
        { tokenAddress: pair.outcomeTokenB, outcomeTokenId: pair.outcomeIdB }
      );
    }

    // Batch fetch market info from middleware
    const marketInfoMap = await this.middlewareService.fetchMarketInfoBatch(tokensToFetch);

    // Build market metadata
    const marketsMap = new Map<string, MarketMetadata>();

    for (const pair of newPairs) {
      const pairKey = createPairKey(
        pair.outcomeTokenA,
        pair.outcomeIdA,
        pair.outcomeTokenB,
        pair.outcomeIdB
      );

      // Calculate pair status
      const addedTimestamp = parseInt(pair.timestamp_);
      const pausedTimestamp = pausedMap.get(pairKey) || 0;
      const removedTimestamp = removedMap.get(pairKey) || 0;
      const status = this.subgraphService.calculatePairStatus(
        addedTimestamp,
        pausedTimestamp,
        removedTimestamp
      );

      // Get market info
      const keyA = `${pair.outcomeTokenA}-${pair.outcomeIdA}`;
      const keyB = `${pair.outcomeTokenB}-${pair.outcomeIdB}`;
      const infoA = marketInfoMap.get(keyA);
      const infoB = marketInfoMap.get(keyB);

      if (!infoA || !infoB) {
        console.warn('Missing market info for pair:', pairKey);
        continue;
      }

      const marketIdA = infoA.marketInfo.id;
      const marketIdB = infoB.marketInfo.id;

      if (!marketIdA || !marketIdB) {
        console.warn('Missing market IDs for pair:', pairKey);
        continue;
      }

      // Create market key
      const marketKey = this.createMarketKey([
        { providerId: infoA.providerId, marketId: marketIdA },
        { providerId: infoB.providerId, marketId: marketIdB },
      ]);

      // Get or create market
      let market = marketsMap.get(marketKey);
      if (!market) {
        market = {
          marketKey,
          question: infoA.marketInfo.question || infoB.marketInfo.question || 'Unknown Market',
          providerQuestions: new Map(),
          providerImages: new Map(),
          providerTokenIds: new Map(),
          providerUrls: new Map(),
          pairs: [],
          overallStatus: 'removed',
        };

        // Populate provider data
        this.populateProviderData(market, infoA);
        this.populateProviderData(market, infoB);

        marketsMap.set(marketKey, market);
      }

      // Add pair
      market.pairs.push({
        key: pairKey,
        outcomeTokenA: pair.outcomeTokenA as Address,
        outcomeIdA: pair.outcomeIdA,
        outcomeIdAIsYesTokenId: infoA.marketInfo.yesTokenId === pair.outcomeIdA,
        outcomeTokenB: pair.outcomeTokenB as Address,
        outcomeIdB: pair.outcomeIdB,
        outcomeIdBIsYesTokenId: infoB.marketInfo.yesTokenId === pair.outcomeIdB,
        earlyExitAmountContract: pair.earlyExitAmountContract as Address,
        decimalsA: parseInt(pair.decimalsA),
        decimalsB: parseInt(pair.decimalsB),
        status,
        timestamp: addedTimestamp,
      });

      // Update overall status
      if (status === 'allowed') {
        market.overallStatus = 'allowed';
      } else if (status === 'paused' && market.overallStatus !== 'allowed') {
        market.overallStatus = 'paused';
      }
    }

    // Add all markets to registry
    for (const market of marketsMap.values()) {
      this.marketRegistry.addMarket(market);
    }

    this.initialized = true;
  }

  /**
   * Get all supported markets
   */
  getAllMarkets(): MarketMetadata[] {
    this.ensureInitialized();
    return this.marketRegistry.getAllMarkets();
  }

  /**
   * Search for markets by various criteria
   */
  searchMarkets(params: MarketSearchParams): MarketMetadata[] {
    this.ensureInitialized();
    return this.marketRegistry.searchMarkets(params);
  }

  /**
   * Find markets that contain the given URL pattern
   */
  findMarketsByUrl(urlPattern: string): MarketMetadata[] {
    this.ensureInitialized();
    return this.marketRegistry.searchByUrl(urlPattern);
  }

  /**
   * Get a specific market by its key
   */
  getMarket(marketKey: string): MarketMetadata | undefined {
    this.ensureInitialized();
    return this.marketRegistry.getMarketByKey(marketKey);
  }

  /**
   * Find a specific pair by token addresses and IDs
   */
  findPair(tokenA: Address, tokenIdA: bigint, tokenB: Address, tokenIdB: bigint) {
    this.ensureInitialized();
    return this.marketRegistry.findPairByTokens(tokenA, tokenIdA, tokenB, tokenIdB);
  }

  /**
   * Estimate merge (early exit) - returns amount of USDT received
   * @param tokenA Address of first outcome token
   * @param tokenIdA Token ID of first outcome token
   * @param tokenB Address of second outcome token
   * @param tokenIdB Token ID of second outcome token
   * @param amount Amount to merge in USDT decimals (18)
   */
  async estimateMerge(
    tokenA: Address,
    tokenIdA: bigint,
    tokenB: Address,
    tokenIdB: bigint,
    amount: bigint
  ): Promise<MergeEstimationResult> {
    this.ensureInitialized();
    this.warnIfUsingDefaultRpc();
    return this.estimationService.estimateMerge({
      tokenA,
      tokenIdA,
      tokenB,
      tokenIdB,
      amount,
    });
  }

  /**
   * Estimate split - returns amount of outcome tokens received
   * @param tokenA Address of first outcome token
   * @param tokenIdA Token ID of first outcome token
   * @param tokenB Address of second outcome token
   * @param tokenIdB Token ID of second outcome token
   * @param usdtAmount USDT amount to split in USDT decimals (18)
   */
  async estimateSplit(
    tokenA: Address,
    tokenIdA: bigint,
    tokenB: Address,
    tokenIdB: bigint,
    usdtAmount: bigint
  ): Promise<SplitEstimationResult> {
    this.ensureInitialized();
    this.warnIfUsingDefaultRpc();
    return this.estimationService.estimateSplit({
      tokenA,
      tokenIdA,
      tokenB,
      tokenIdB,
      usdtAmount,
    });
  }

  /**
   * Get current vault liquidity information
   */
  async getVaultLiquidity(): Promise<{ totalAssets: bigint; availableLiquidity: bigint }> {
    return this.estimationService.getVaultLiquidity();
  }

  /**
   * Refresh market data by re-initializing
   */
  async refresh(): Promise<void> {
    this.marketRegistry.clear();
    this.initialized = false;
    await this.initialize();
  }

  private ensureInitialized(): void {
    if (!this.initialized) {
      throw new Error('SDK not initialized. Call initialize() first.');
    }
  }

  private warnIfUsingDefaultRpc(): void {
    if (this.isUsingDefaultRpc) {
      console.warn(
        '⚠️  [POKVaultSDK] Using default BSC RPC URL. Performance may be slow. ' +
        'Consider providing your own RPC URL for better performance: ' +
        'new POKVaultSDK({ bscRpcUrl: "your-rpc-url" })'
      );
    }
  }

  private createMarketKey(
    markets: Array<{ providerId: string; marketId: string }>
  ): string {
    if (markets.length === 0) return '';
    
    const sorted = [...markets].sort((a, b) => 
      a.providerId.localeCompare(b.providerId)
    );
    
    return sorted.map(m => `${m.providerId}-${m.marketId}`).join('_');
  }

  private populateProviderData(
    market: MarketMetadata,
    info: { marketInfo: any; providerId: string }
  ): void {
    const providerId = info.providerId;
    const data = info.marketInfo;

    market.providerQuestions.set(providerId, data.question);
    
    if (data.thumbnailUrl) {
      market.providerImages.set(providerId, data.thumbnailUrl);
    }
    
    if (data.yesTokenId || data.noTokenId) {
      market.providerTokenIds.set(providerId, {
        yesTokenId: data.yesTokenId,
        noTokenId: data.noTokenId,
      });
    }
    
    const url = this.middlewareService.constructProviderUrl(providerId, data);
    if (url) {
      market.providerUrls.set(providerId, url);
    }
  }
}
