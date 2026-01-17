import { encodeAbiParameters, encodeFunctionData, erc1155Abi, parseAbiParameters } from 'viem';
import type { Address } from 'viem';
import {
  AXELAR_GAS_SERVICE_POLYGON_ADDRESS,
  AXELAR_GAS_SERVICE_BSC_ADDRESS,
  AXELAR_POLYGON_CHAIN_NAME,
  AXELAR_BSC_CHAIN_NAME,
  POLYMARKET_SOURCE_BRIDGE_POLYGON_ADDRESS,
  POLYGON_ERC1155_BRIDGED_BSC_ADDRESS,
  POLYGON_ERC1155_POLYGON_ADDRESS,
  MULTI_SEND_CALL_ONLY_POLYGON_ADDRESS,
  MULTI_SEND_CALL_ONLY_BSC_ADDRESS,
  POLYMARKET_DESTINATION_BRIDGE_BSC_ADDRESS,
} from '../config/addresses';
import { createSafeTransaction, createMultiSendExecParams } from './multiSend';

// Axelar Gas Service ABI for payNativeGasForContractCall
const AXELAR_GAS_SERVICE_ABI = [
  {
    name: 'payNativeGasForContractCall',
    type: 'function',
    stateMutability: 'payable',
    inputs: [
      { name: 'sender', type: 'address' },
      { name: 'destinationChain', type: 'string' },
      { name: 'destinationAddress', type: 'string' },
      { name: 'payload', type: 'bytes' },
      { name: 'refundAddress', type: 'address' },
    ],
    outputs: [],
  },
] as const;

/**
 * Creates batched transactions for bridging Polymarket tokens from Polygon to BSC
 * Includes gas payment + ERC1155 transfer
 */
export function createPolygonToBSCBridgeBatch({
  fromAddress,
  refundAddress,
  toAddress,
  tokenId,
  amount,
  gasPaymentAmount,
}: {
  fromAddress: Address;
  refundAddress: Address;
  toAddress: Address;
  tokenId: bigint;
  amount: bigint;
  gasPaymentAmount: bigint;
}) {
  // Prepare payload: abi.encode(to, tokenIds, amounts)
  const payload = encodeAbiParameters(
    parseAbiParameters('address, uint256[], uint256[]'),
    [toAddress, [tokenId], [amount]]
  );

  // Transaction 1: Pay for bridge gas
  const gasPaymentTx = createSafeTransaction(
    AXELAR_GAS_SERVICE_POLYGON_ADDRESS,
    gasPaymentAmount,
    encodeFunctionData({
      abi: AXELAR_GAS_SERVICE_ABI,
      functionName: 'payNativeGasForContractCall',
      args: [
        POLYMARKET_SOURCE_BRIDGE_POLYGON_ADDRESS,
        AXELAR_BSC_CHAIN_NAME,
        POLYGON_ERC1155_BRIDGED_BSC_ADDRESS,
        payload,
        refundAddress,
      ],
    })
  );

  // Encode destination address for bridge
  const bridgeData = encodeAbiParameters(
    [{ type: 'address' }],
    [toAddress]
  );

  // Transaction 2: Bridge the ERC1155 token
  const bridgeTx = createSafeTransaction(
    POLYGON_ERC1155_POLYGON_ADDRESS,
    0n,
    encodeFunctionData({
      abi: erc1155Abi,
      functionName: 'safeTransferFrom',
      args: [fromAddress, POLYMARKET_SOURCE_BRIDGE_POLYGON_ADDRESS, tokenId, amount, bridgeData],
    })
  );

  // Create MultiSend exec params
  return createMultiSendExecParams(
    MULTI_SEND_CALL_ONLY_POLYGON_ADDRESS,
    [gasPaymentTx, bridgeTx]
  );
}

/**
 * Creates batched transactions for bridging Polymarket tokens from BSC to Polygon
 * Includes gas payment + ERC1155 transfer
 */
export function createBSCToPolygonBridgeBatch({
  fromAddress,
  refundAddress,
  toAddress,
  tokenId,
  amount,
  gasPaymentAmount,
}: {
  fromAddress: Address;
  refundAddress: Address;
  toAddress: Address;
  tokenId: bigint;
  amount: bigint;
  gasPaymentAmount: bigint;
}) {
  // Prepare payload: abi.encode(to, tokenIds, amounts)
  const payload = encodeAbiParameters(
    parseAbiParameters('address, uint256[], uint256[]'),
    [toAddress, [tokenId], [amount]]
  );

  // Transaction 1: Pay for bridge gas
  const gasPaymentTx = createSafeTransaction(
    AXELAR_GAS_SERVICE_BSC_ADDRESS,
    gasPaymentAmount,
    encodeFunctionData({
      abi: AXELAR_GAS_SERVICE_ABI,
      functionName: 'payNativeGasForContractCall',
      args: [
        POLYMARKET_DESTINATION_BRIDGE_BSC_ADDRESS,
        AXELAR_POLYGON_CHAIN_NAME,
        POLYMARKET_SOURCE_BRIDGE_POLYGON_ADDRESS,
        payload,
        refundAddress,
      ],
    })
  );

  // Encode destination address for bridge
  const bridgeData = encodeAbiParameters(
    [{ type: 'address' }],
    [toAddress]
  );

  // Transaction 2: Bridge the ERC1155 token
  const bridgeTx = createSafeTransaction(
    POLYGON_ERC1155_BRIDGED_BSC_ADDRESS,
    0n,
    encodeFunctionData({
      abi: erc1155Abi,
      functionName: 'safeTransferFrom',
      args: [fromAddress, POLYGON_ERC1155_BRIDGED_BSC_ADDRESS, tokenId, amount, bridgeData],
    })
  );

  // Create MultiSend exec params
  return createMultiSendExecParams(
    MULTI_SEND_CALL_ONLY_BSC_ADDRESS,
    [gasPaymentTx, bridgeTx]
  );
}
