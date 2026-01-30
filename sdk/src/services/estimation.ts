import { createPublicClient, http, type Address, erc1155Abi } from 'viem';
import { bsc } from 'viem/chains';
import type { MergeEstimationParams, MergeEstimationResult, SplitEstimationParams, SplitEstimationResult } from '../types/estimation';
import { VAULT_ADDRESS } from '../config/addresses';
import { DEFAULT_BSC_RPC_URL } from '../config/constants';
import EarlyExitVaultAbi from '../abi/EarlyExitVault.json';

export class EstimationService {
  private client;

  constructor(rpcUrl: string = DEFAULT_BSC_RPC_URL) {
    this.client = createPublicClient({
      chain: bsc,
      transport: http(rpcUrl),
    });
  }

  async estimateMerge(params: MergeEstimationParams): Promise<MergeEstimationResult> {
    const { tokenA, tokenIdA, tokenB, tokenIdB, amount } = params;

    const results = await this.client.multicall({
      contracts: [
        {
          address: VAULT_ADDRESS,
          abi: EarlyExitVaultAbi,
          functionName: 'estimateEarlyExitAmount',
          args: [tokenA, tokenIdA, tokenB, tokenIdB, amount],
        },
        {
          address: VAULT_ADDRESS,
          abi: EarlyExitVaultAbi,
          functionName: 'totalAssets',
        },
        {
          address: VAULT_ADDRESS,
          abi: EarlyExitVaultAbi,
          functionName: 'totalEarlyExitedAmount',
        },
      ],
    });

    const estimatedUsdtReceived = (results[0].result as bigint) ?? 0n;
    const totalAssets = (results[1].result as bigint) ?? 0n;
    const totalEarlyExited = (results[2].result as bigint) ?? 0n;
    const availableVaultLiquidity = totalAssets - totalEarlyExited;
    const vaultHasLiquidity = availableVaultLiquidity >= estimatedUsdtReceived;

    return {
      estimatedUsdtReceived,
      vaultHasLiquidity,
      availableVaultLiquidity,
      totalAssets,
      totalEarlyExited,
    };
  }

  async estimateSplit(params: SplitEstimationParams): Promise<SplitEstimationResult> {
    const { tokenA, tokenIdA, tokenB, tokenIdB, usdtAmount } = params;

    const results = await this.client.multicall({
      contracts: [
        {
          address: VAULT_ADDRESS,
          abi: EarlyExitVaultAbi,
          functionName: 'estimateSplitOppositeOutcomeTokensAmount',
          args: [tokenA, tokenIdA, tokenB, tokenIdB, usdtAmount],
        },
        {
          address: tokenA,
          abi: erc1155Abi,
          functionName: 'balanceOf',
          args: [VAULT_ADDRESS, tokenIdA],
        },
        {
          address: tokenB,
          abi: erc1155Abi,
          functionName: 'balanceOf',
          args: [VAULT_ADDRESS, tokenIdB],
        },
      ],
    });

    const estimatedTokensReceived = (results[0].result as bigint) ?? 0n;
    const vaultBalanceTokenA = (results[1].result as bigint) ?? 0n;
    const vaultBalanceTokenB = (results[2].result as bigint) ?? 0n;
    const vaultHasTokens = vaultBalanceTokenA >= estimatedTokensReceived && 
                           vaultBalanceTokenB >= estimatedTokensReceived;

    return {
      estimatedTokensReceived,
      vaultHasTokens,
      vaultBalanceTokenA,
      vaultBalanceTokenB,
    };
  }

  async getVaultLiquidity(): Promise<{ totalAssets: bigint; availableLiquidity: bigint }> {
    const results = await this.client.multicall({
      contracts: [
        {
          address: VAULT_ADDRESS,
          abi: EarlyExitVaultAbi,
          functionName: 'totalAssets',
        },
        {
          address: VAULT_ADDRESS,
          abi: EarlyExitVaultAbi,
          functionName: 'totalEarlyExitedAmount',
        },
      ],
    });

    const totalAssets = (results[0].result as bigint) ?? 0n;
    const totalEarlyExited = (results[1].result as bigint) ?? 0n;
    const availableLiquidity = totalAssets - totalEarlyExited;

    return { totalAssets, availableLiquidity };
  }

  async getTokenBalance(tokenAddress: Address, tokenId: bigint, owner: Address): Promise<bigint> {
    const balance = await this.client.readContract({
      address: tokenAddress,
      abi: erc1155Abi,
      functionName: 'balanceOf',
      args: [owner, tokenId],
    });

    return (balance as bigint) ?? 0n;
  }
}
