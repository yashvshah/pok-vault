export interface SDKConfig {
  bscRpcUrl?: string;
}

export interface MarketSearchParams {
  url?: string;
  provider?: string;
  status?: 'allowed' | 'paused' | 'removed';
  question?: string;
}
