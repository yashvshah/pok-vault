import type { Address } from 'viem';

export type MarketStatus = 'allowed' | 'paused' | 'removed';

export interface OutcomeTokenPair {
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
  status: MarketStatus;
  timestamp: number;
}

export interface MarketMetadata {
  marketKey: string;
  question: string;
  providerQuestions: Map<string, string>;
  providerImages: Map<string, string>;
  providerTokenIds: Map<string, { yesTokenId: string; noTokenId: string }>;
  providerTokenAddresses: Map<string, Address>;
  providerUrls: Map<string, string>;
  pairs: OutcomeTokenPair[];
  overallStatus: MarketStatus;
}

export interface SubgraphOutcomePair {
  id: string;
  outcomeIdA: string;
  outcomeIdB: string;
  earlyExitAmountContract: string;
  outcomeTokenA: string;
  outcomeTokenB: string;
  decimalsA: string;
  decimalsB: string;
  block_number: string;
  timestamp_: string;
  transactionHash_: string;
}

export interface MiddlewareMarketData {
  id: string;
  question: string;
  yesTokenId: string;
  noTokenId: string;
  status?: string;
  thumbnailUrl?: string;
  url?: string;
  parentMarketId?: string;
}

export interface MiddlewareMarketResponse {
  tokenAddress: string;
  outcomeTokenId: string;
  marketInfo: MiddlewareMarketData;
}
