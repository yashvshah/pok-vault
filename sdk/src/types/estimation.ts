import type { Address } from 'viem';

export interface MergeEstimationParams {
  tokenA: Address;
  tokenIdA: bigint;
  tokenB: Address;
  tokenIdB: bigint;
  /** Amount in USDT decimals (18) */
  amount: bigint;
}

export interface MergeEstimationResult {
  estimatedUsdtReceived: bigint;
  vaultHasLiquidity: boolean;
  availableVaultLiquidity: bigint;
  totalAssets: bigint;
  totalEarlyExited: bigint;
}

export interface SplitEstimationParams {
  tokenA: Address;
  tokenIdA: bigint;
  tokenB: Address;
  tokenIdB: bigint;
  /** USDT amount in USDT decimals (18) */
  usdtAmount: bigint;
}

export interface SplitEstimationResult {
  estimatedTokensReceived: bigint;
  vaultHasTokens: boolean;
  vaultBalanceTokenA: bigint;
  vaultBalanceTokenB: bigint;
}
