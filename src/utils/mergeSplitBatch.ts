import { encodeFunctionData, erc1155Abi, erc20Abi } from 'viem';
import type { Address } from 'viem';
import {
  VAULT_ADDRESS,
  MULTI_SEND_CALL_ONLY_BSC_ADDRESS,
} from '../config/addresses';
import { createSafeTransaction, createMultiSendExecParams } from './multiSend';
import EarlyExitVaultAbi from '../abi/EarlyExitVault.json';

/**
 * Creates batched transactions for merge (early exit) with ERC1155 approvals
 * Includes setApprovalForAll for both tokens + earlyExit
 */
export function createMergeBatchWithApprovals({
  tokenA,
  tokenB,
  tokenIdA,
  tokenIdB,
  amountUsdt,
  recipient,
  needsApprovalA,
  needsApprovalB,
}: {
  tokenA: Address;
  tokenB: Address;
  tokenIdA: bigint;
  tokenIdB: bigint;
  amountUsdt: bigint;
  recipient: Address;
  needsApprovalA: boolean;
  needsApprovalB: boolean;
}) {
  const transactions = [];

  // Add approval for token A if needed
  if (needsApprovalA) {
    transactions.push(
      createSafeTransaction(
        tokenA,
        0n,
        encodeFunctionData({
          abi: erc1155Abi,
          functionName: 'setApprovalForAll',
          args: [VAULT_ADDRESS, true],
        })
      )
    );
  }

  // Add approval for token B if needed
  if (needsApprovalB) {
    transactions.push(
      createSafeTransaction(
        tokenB,
        0n,
        encodeFunctionData({
          abi: erc1155Abi,
          functionName: 'setApprovalForAll',
          args: [VAULT_ADDRESS, true],
        })
      )
    );
  }

  // Add the merge transaction
  transactions.push(
    createSafeTransaction(
      VAULT_ADDRESS,
      0n,
      encodeFunctionData({
        abi: EarlyExitVaultAbi,
        functionName: 'earlyExit',
        args: [tokenA, tokenIdA, tokenB, tokenIdB, amountUsdt, recipient],
      })
    )
  );

  return createMultiSendExecParams(
    MULTI_SEND_CALL_ONLY_BSC_ADDRESS,
    transactions
  );
}

/**
 * Creates batched transactions for split with USDT approval
 * Includes approve + splitOppositeOutcomeTokens
 */
export function createSplitBatchWithApproval({
  usdtToken,
  amountUsdt,
  tokenA,
  tokenB,
  tokenIdA,
  tokenIdB,
  recipient,
  needsApproval,
}: {
  usdtToken: Address;
  amountUsdt: bigint;
  tokenA: Address;
  tokenB: Address;
  tokenIdA: bigint;
  tokenIdB: bigint;
  recipient: Address;
  needsApproval: boolean;
}) {
  const transactions = [];

  // Add USDT approval if needed
  if (needsApproval) {
    transactions.push(
      createSafeTransaction(
        usdtToken,
        0n,
        encodeFunctionData({
          abi: erc20Abi,
          functionName: 'approve',
          args: [VAULT_ADDRESS, amountUsdt],
        })
      )
    );
  }

  // Add the split transaction
  transactions.push(
    createSafeTransaction(
      VAULT_ADDRESS,
      0n,
      encodeFunctionData({
        abi: EarlyExitVaultAbi,
        functionName: 'splitOppositeOutcomeTokens',
        args: [tokenA, tokenIdA, tokenB, tokenIdB, amountUsdt, recipient],
      })
    )
  );

  return createMultiSendExecParams(
    MULTI_SEND_CALL_ONLY_BSC_ADDRESS,
    transactions
  );
}
