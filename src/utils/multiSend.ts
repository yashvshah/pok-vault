import { encodePacked, encodeFunctionData, type Address, type Hex } from 'viem';

export interface SafeTransaction {
  to: Address;
  value: bigint;
  data: Hex;
  operation?: 0 | 1; // 0 = call, 1 = delegatecall (must be 0 for MultiSendCallOnly)
}

/**
 * Pack a single transaction into the MultiSend format
 * Format: operation (1 byte) + to (20 bytes) + value (32 bytes) + dataLength (32 bytes) + data (variable)
 * Uses abi.encodePacked as per Gnosis spec - no padding between fields
 */
function packTransaction(tx: SafeTransaction): Hex {
  const operation = tx.operation ?? 0;
  
  // Convert data to bytes if it's a hex string
  const dataBytes = tx.data.startsWith('0x') ? tx.data.slice(2) : tx.data;
  const dataLength = BigInt(dataBytes.length / 2); // Length in bytes

  // Pack: operation (1) + to (20) + value (32) + dataLength (32)
  // Then manually append data bytes (not using 'bytes' type to avoid length prefix)
  const header = encodePacked(
    ['uint8', 'address', 'uint256', 'uint256'],
    [operation, tx.to, tx.value, dataLength]
  );

  // Remove '0x' prefix from header and data, then concatenate
  const headerWithoutPrefix = header.startsWith('0x') ? header.slice(2) : header;
  
  return `0x${headerWithoutPrefix}${dataBytes}` as Hex;
}

/**
 * Pack multiple transactions into a single bytes array for MultiSend
 */
export function packTransactionsForMultiSend(transactions: SafeTransaction[]): Hex {
  const packedTxs = transactions.map(packTransaction);
  
  // Concatenate all packed transactions
  const concatenated = packedTxs.reduce((acc, packed) => {
    const packedWithoutPrefix = packed.startsWith('0x') ? packed.slice(2) : packed;
    return acc + packedWithoutPrefix;
  }, '');

  return `0x${concatenated}` as Hex;
}

/**
 * Encode the multiSend function call
 * Function signature: multiSend(bytes calldata transactions)
 */
export function encodeMultiSendCall(transactions: SafeTransaction[]): Hex {
  const packedTransactions = packTransactionsForMultiSend(transactions);
  
  // Encode the multiSend function call
  const encodedData = encodeFunctionData({
    abi: [{
      name: 'multiSend',
      type: 'function',
      inputs: [{ name: 'transactions', type: 'bytes' }],
      outputs: [],
      stateMutability: 'payable',
    }],
    functionName: 'multiSend',
    args: [packedTransactions],
  });

  return encodedData;
}

/**
 * Parameters for Gnosis Safe execTransaction
 */
export interface SafeExecTransactionParams {
  to: Address;
  value: bigint;
  data: Hex;
  operation: 0 | 1; // 0 = call, 1 = delegatecall (must be 1 for MultiSend)
  safeTxGas: bigint;
  baseGas: bigint;
  gasPrice: bigint;
  gasToken: Address;
  refundReceiver: Address;
  signatures: Hex;
}

/**
 * Create parameters for executing a batch of transactions via MultiSendCallOnly
 * @param multiSendAddress - Address of MultiSendCallOnly contract
 * @param transactions - Array of transactions to batch
 * @param signatures - Combined signatures from Safe owners
 * @returns Parameters ready for Safe.execTransaction
 */
export function createMultiSendExecParams(
  multiSendAddress: Address,
  transactions: SafeTransaction[],
  signatures: Hex = '0x'
): SafeExecTransactionParams {
  console.log('Creating MultiSend exec params for transactions:', transactions);
  const multiSendData = encodeMultiSendCall(transactions);
  
  return {
    to: multiSendAddress,
    value: 0n, // No ETH sent to MultiSend itself
    data: multiSendData,
    operation: 1, // 1 = delegatecall (required for MultiSend)
    safeTxGas: 0n, // Let the Safe estimate
    baseGas: 0n,
    gasPrice: 0n,
    gasToken: '0x0000000000000000000000000000000000000000', // ETH
    refundReceiver: '0x0000000000000000000000000000000000000000',
    signatures,
  };
}

/**
 * Helper to create a Safe transaction object
 */
export function createSafeTransaction(
  to: Address,
  value: bigint,
  data: Hex,
  operation: 0 | 1 = 0
): SafeTransaction {
  return { to, value, data, operation };
}
