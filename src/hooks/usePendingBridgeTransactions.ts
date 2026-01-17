import { useQuery } from '@tanstack/react-query';
import { 
  polygonSourceBridgeClient, 
  bscReceiverBridgeClient,
  ERC1155_SINGLE_RECEIVED_QUERY,
  TRANSFER_BATCH_QUERY
} from '../config/subgraph';
import { 
  POLYMARKET_SOURCE_BRIDGE_POLYGON_ADDRESS,
  AXELAR_GATEWAY_BSC_ADDRESS
} from '../config/addresses';
import type { 
  SubgraphERC1155SingleReceived,
  SubgraphTransferBatch,
  PendingBridgeTransaction
} from '../types/vault';

interface ERC1155SingleReceivedResponse {
  erc1155SingleReceiveds: SubgraphERC1155SingleReceived[];
}

interface TransferBatchResponse {
  transferBatches: SubgraphTransferBatch[];
}

async function resolveDuplicatePendingBridges(txHashes: string[]): Promise<string[]> {
  // TODO: Implement logic to determine which transactions are actually pending
  // when multiple bridges have the same amount and tokenId
  // For now, return all as potentially pending
  console.log('Multiple bridges with same amount and tokenId found:', txHashes);
  return txHashes;
}

async function fetchPendingBridgesPolygonToBSC(userAddress: string): Promise<PendingBridgeTransaction[]> {
  // Fetch ERC1155SingleReceived events from Polygon source bridge
  const polygonReceived = await polygonSourceBridgeClient.request<ERC1155SingleReceivedResponse>(
    ERC1155_SINGLE_RECEIVED_QUERY,
    { userAddress: userAddress.toLowerCase() }
  );

  console.log('Polygon received events:', polygonReceived);

  // Fetch TransferBatch events from BSC receiver bridge
  const bscTransfers = await bscReceiverBridgeClient.request<TransferBatchResponse>(
    TRANSFER_BATCH_QUERY,
    {
      operator: AXELAR_GATEWAY_BSC_ADDRESS.toLowerCase(),
      from: '0x0000000000000000000000000000000000000000',
      to: userAddress.toLowerCase()
    }
  );

  console.log('BSC transfer events:', bscTransfers);

  const receivedEvents = polygonReceived.erc1155SingleReceiveds || [];
  const transferEvents = bscTransfers.transferBatches || [];

  // Create a map to track completed transfers
  const completedTransfers = new Map<string, number>();
  transferEvents.forEach(transfer => {
    transfer.ids.forEach((id, index) => {
      const key = `${id}-${transfer.values[index]}`;
      completedTransfers.set(key, (completedTransfers.get(key) || 0) + 1);
    });
  });

  // Track pending transactions and duplicates
  const pending: PendingBridgeTransaction[] = [];
  const duplicateMap = new Map<string, string[]>();

  receivedEvents.forEach(event => {
    const key = `${event.idParam}-${event.amount}`;
    const currentCount = completedTransfers.get(key) || 0;

    if (!duplicateMap.has(key)) {
      duplicateMap.set(key, []);
    }
    duplicateMap.get(key)!.push(event.transactionHash_);

    if (currentCount === 0) {
      // No matching transfer found - this is pending
      pending.push({
        direction: 'polygon-to-bsc',
        tokenId: event.idParam,
        amount: event.amount,
        to: event.to,
        timestamp: event.timestamp_,
        transactionHash: event.transactionHash_,
        from: event.from
      });
    } else {
      // Decrement the count for this combination
      completedTransfers.set(key, currentCount - 1);
    }
  });

  // Check for duplicates that need resolution
  for (const [key, txHashes] of duplicateMap.entries()) {
    const remainingCount = completedTransfers.get(key) || 0;
    if (txHashes.length > 1 && remainingCount < 0) {
      // Multiple initiations with same tokenId and amount, but not enough completions
      const needsResolution = await resolveDuplicatePendingBridges(txHashes);
      console.log('Duplicate bridges that need resolution:', needsResolution);
    }
  }

  return pending;
}

async function fetchPendingBridgesBSCToPolygon(userAddress: string): Promise<PendingBridgeTransaction[]> {
  // Fetch ERC1155SingleReceived events from BSC (bridged contract)
  const bscReceived = await bscReceiverBridgeClient.request<ERC1155SingleReceivedResponse>(
    ERC1155_SINGLE_RECEIVED_QUERY,
    { userAddress: userAddress.toLowerCase() }
  );

  // Fetch TransferBatch events from Polygon source bridge
  const polygonTransfers = await polygonSourceBridgeClient.request<TransferBatchResponse>(
    TRANSFER_BATCH_QUERY,
    {
      operator: POLYMARKET_SOURCE_BRIDGE_POLYGON_ADDRESS.toLowerCase(),
      from: POLYMARKET_SOURCE_BRIDGE_POLYGON_ADDRESS.toLowerCase(),
      to: userAddress.toLowerCase()
    }
  );

  const receivedEvents = bscReceived.erc1155SingleReceiveds || [];
  const transferEvents = polygonTransfers.transferBatches || [];

  // Create a map to track completed transfers
  const completedTransfers = new Map<string, number>();
  transferEvents.forEach(transfer => {
    transfer.ids.forEach((id, index) => {
      const key = `${id}-${transfer.values[index]}`;
      completedTransfers.set(key, (completedTransfers.get(key) || 0) + 1);
    });
  });

  // Track pending transactions and duplicates
  const pending: PendingBridgeTransaction[] = [];
  const duplicateMap = new Map<string, string[]>();

  receivedEvents.forEach(event => {
    const key = `${event.idParam}-${event.amount}`;
    const currentCount = completedTransfers.get(key) || 0;

    if (!duplicateMap.has(key)) {
      duplicateMap.set(key, []);
    }
    duplicateMap.get(key)!.push(event.transactionHash_);

    if (currentCount === 0) {
      // No matching transfer found - this is pending
      pending.push({
        direction: 'bsc-to-polygon',
        tokenId: event.idParam,
        amount: event.amount,
        to: event.to,
        timestamp: event.timestamp_,
        transactionHash: event.transactionHash_,
        from: event.from
      });
    } else {
      // Decrement the count for this combination
      completedTransfers.set(key, currentCount - 1);
    }
  });

  // Check for duplicates that need resolution
  for (const [key, txHashes] of duplicateMap.entries()) {
    const remainingCount = completedTransfers.get(key) || 0;
    if (txHashes.length > 1 && remainingCount < 0) {
      // Multiple initiations with same tokenId and amount, but not enough completions
      const needsResolution = await resolveDuplicatePendingBridges(txHashes);
      console.log('Duplicate bridges that need resolution:', needsResolution);
    }
  }

  return pending;
}

export function usePendingBridgeTransactions(userAddress?: string) {
  return useQuery({
    queryKey: ['pending-bridge-transactions', userAddress],
    queryFn: async (): Promise<PendingBridgeTransaction[]> => {
      if (!userAddress) return [];

      const [polygonToBSC, bscToPolygon] = await Promise.all([
        fetchPendingBridgesPolygonToBSC(userAddress),
        fetchPendingBridgesBSCToPolygon(userAddress)
      ]);

      return [...polygonToBSC, ...bscToPolygon];
    },
    enabled: !!userAddress,
    staleTime: 30000, // 30 seconds
  });
}
