import type { Address } from 'viem';
import type { MarketMetadata, OutcomeTokenPair, MarketSearchParams } from '../types';

export class MarketRegistry {
  private markets: Map<string, MarketMetadata> = new Map();
  private urlIndex: Map<string, Set<string>> = new Map();
  private providerIndex: Map<string, Set<string>> = new Map();
  private tokenPairIndex: Map<string, string> = new Map();

  addMarket(market: MarketMetadata): void {
    this.markets.set(market.marketKey, market);
    
    // Index by URLs
    for (const url of market.providerUrls.values()) {
      const normalizedUrl = url.toLowerCase();
      if (!this.urlIndex.has(normalizedUrl)) {
        this.urlIndex.set(normalizedUrl, new Set());
      }
      this.urlIndex.get(normalizedUrl)!.add(market.marketKey);
    }
    
    // Index by providers
    for (const provider of market.providerQuestions.keys()) {
      if (!this.providerIndex.has(provider)) {
        this.providerIndex.set(provider, new Set());
      }
      this.providerIndex.get(provider)!.add(market.marketKey);
    }
    
    // Index by token pairs
    for (const pair of market.pairs) {
      const pairKey = this.createTokenPairKey(
        pair.outcomeTokenA,
        pair.outcomeIdA,
        pair.outcomeTokenB,
        pair.outcomeIdB
      );
      this.tokenPairIndex.set(pairKey, market.marketKey);
    }
  }

  getAllMarkets(): MarketMetadata[] {
    return Array.from(this.markets.values());
  }

  getMarketByKey(marketKey: string): MarketMetadata | undefined {
    return this.markets.get(marketKey);
  }

  searchMarkets(params: MarketSearchParams): MarketMetadata[] {
    let results = this.getAllMarkets();

    if (params.url) {
      const matchingMarkets = this.searchByUrl(params.url);
      results = results.filter(m => matchingMarkets.includes(m));
    }

    if (params.provider) {
      const providerMarketKeys = this.providerIndex.get(params.provider.toLowerCase());
      if (providerMarketKeys) {
        results = results.filter(m => providerMarketKeys.has(m.marketKey));
      } else {
        results = [];
      }
    }

    if (params.status) {
      results = results.filter(m => m.overallStatus === params.status);
    }

    if (params.question) {
      const query = params.question.toLowerCase();
      results = results.filter(m => 
        m.question.toLowerCase().includes(query) ||
        Array.from(m.providerQuestions.values()).some((q: string) => q.toLowerCase().includes(query))
      );
    }

    return results;
  }

  searchByUrl(urlPattern: string): MarketMetadata[] {
    const pattern = urlPattern.toLowerCase();
    const matchingMarkets = new Set<string>();

    for (const [url, marketKeys] of this.urlIndex.entries()) {
      if (url.includes(pattern) || pattern.includes(url)) {
        marketKeys.forEach(key => matchingMarkets.add(key));
      }
    }

    return Array.from(matchingMarkets).map(key => this.markets.get(key)!).filter(Boolean);
  }

  findPairByTokens(
    tokenA: Address,
    tokenIdA: bigint,
    tokenB: Address,
    tokenIdB: bigint
  ): { market: MarketMetadata; pair: OutcomeTokenPair } | null {
    const pairKey = this.createTokenPairKey(tokenA, tokenIdA.toString(), tokenB, tokenIdB.toString());
    const marketKey = this.tokenPairIndex.get(pairKey);
    
    if (!marketKey) {
      return null;
    }

    const market = this.markets.get(marketKey);
    if (!market) {
      return null;
    }

    const pair = market.pairs.find((p: OutcomeTokenPair) => 
      (p.outcomeTokenA.toLowerCase() === tokenA.toLowerCase() && p.outcomeIdA === tokenIdA.toString() &&
       p.outcomeTokenB.toLowerCase() === tokenB.toLowerCase() && p.outcomeIdB === tokenIdB.toString()) ||
      (p.outcomeTokenA.toLowerCase() === tokenB.toLowerCase() && p.outcomeIdA === tokenIdB.toString() &&
       p.outcomeTokenB.toLowerCase() === tokenA.toLowerCase() && p.outcomeIdB === tokenIdA.toString())
    );

    if (!pair) {
      return null;
    }

    return { market, pair };
  }

  private createTokenPairKey(
    tokenA: Address | string,
    tokenIdA: string,
    tokenB: Address | string,
    tokenIdB: string
  ): string {
    const addrA = tokenA.toLowerCase();
    const addrB = tokenB.toLowerCase();
    
    if (addrA < addrB) {
      return `${addrA}-${tokenIdA}-${addrB}-${tokenIdB}`;
    } else if (addrA > addrB) {
      return `${addrB}-${tokenIdB}-${addrA}-${tokenIdA}`;
    } else {
      const idA = BigInt(tokenIdA);
      const idB = BigInt(tokenIdB);
      if (idA < idB) {
        return `${addrA}-${tokenIdA}-${addrB}-${tokenIdB}`;
      } else {
        return `${addrB}-${tokenIdB}-${addrA}-${tokenIdA}`;
      }
    }
  }

  clear(): void {
    this.markets.clear();
    this.urlIndex.clear();
    this.providerIndex.clear();
    this.tokenPairIndex.clear();
  }
}
