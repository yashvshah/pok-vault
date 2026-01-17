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

async function fetchPendingBridgesPolygonToBSC(addresses: string[]): Promise<PendingBridgeTransaction[]> {
  if (addresses.length === 0) return [];

  const lowercaseAddresses = addresses.map(addr => addr.toLowerCase());
  
  // Fetch ERC1155SingleReceived events from Polygon source bridge
  const polygonReceived = await polygonSourceBridgeClient.request<ERC1155SingleReceivedResponse>(
    ERC1155_SINGLE_RECEIVED_QUERY,
    { userAddresses: lowercaseAddresses }
  );

  console.log('Polygon received events:', polygonReceived);

  // Fetch TransferBatch events from BSC receiver bridge
  const bscTransfers = await bscReceiverBridgeClient.request<TransferBatchResponse>(
    TRANSFER_BATCH_QUERY,
    {
      operator: AXELAR_GATEWAY_BSC_ADDRESS.toLowerCase(),
      from: '0x0000000000000000000000000000000000000000',
      userAddresses: lowercaseAddresses
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

  console.log('Pending Polygon to BSC bridges:', pending);

  return pending;
}

//@dev there is bug where there is no way to know if the brdige was completed on the bridge receiver contract without tracking 
// the events of polymarket tokenIds themselves. The source doesn't emit an event when bridge is completed.
async function fetchPendingBridgesBSCToPolygon(addresses: string[]): Promise<PendingBridgeTransaction[]> {
  if (addresses.length === 0) return [];

  const lowercaseAddresses = addresses.map(addr => addr.toLowerCase());
  
  // Fetch ERC1155SingleReceived events from BSC (bridged contract)
  const bscReceived = await bscReceiverBridgeClient.request<ERC1155SingleReceivedResponse>(
    ERC1155_SINGLE_RECEIVED_QUERY,
    { userAddresses: lowercaseAddresses }
  );

  // Fetch TransferBatch events from Polygon source bridge
  // This doesn't work because a succesful bridge doesn't emit an event in the source contract
  // it emits the event in Polymarket conditional token and there no way to oeasily fetch those events
  // const polygonTransfers = await polygonSourceBridgeClient.request<TransferBatchResponse>(
  //   TRANSFER_BATCH_QUERY,
  //   {
  //     operator: POLYMARKET_SOURCE_BRIDGE_POLYGON_ADDRESS.toLowerCase(),
  //     from: POLYMARKET_SOURCE_BRIDGE_POLYGON_ADDRESS.toLowerCase(),
  //     userAddresses: lowercaseAddresses
  //   }
  // );

  const receivedEvents = bscReceived.erc1155SingleReceiveds || [];
  // const transferEvents = polygonTransfers.transferBatches  || [];

  // Create a map to track completed transfers
  // const completedTransfers = new Map<string, number>();
  // transferEvents.forEach(transfer => {
  //   transfer.ids.forEach((id, index) => {
  //     const key = `${id}-${transfer.values[index]}`;
  //     completedTransfers.set(key, (completedTransfers.get(key) || 0) + 1);
  //   });
  // });

  const completedTransfers = new Map<string, number>();

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

export function usePendingBridgeTransactions(
  userAddress?: string,
  polymarketSafe?: string | null,
  opinionSafe?: string | null,
  isSafeLoading?: boolean
) {
  return useQuery({
    queryKey: ['pending-bridge-transactions', userAddress, polymarketSafe, opinionSafe],
    queryFn: async (): Promise<PendingBridgeTransaction[]> => {
      // Collect all addresses to query
      const addresses: string[] = [];
      
      if (userAddress) {
        addresses.push(userAddress);
      }
      if (polymarketSafe) {
        addresses.push(polymarketSafe);
      }
      if (opinionSafe) {
        addresses.push(opinionSafe);
      }

      if (addresses.length === 0) return [];

      const [polygonToBSC, bscToPolygon] = await Promise.all([
        fetchPendingBridgesPolygonToBSC(addresses),
        fetchPendingBridgesBSCToPolygon(addresses)
      ]);

      return [...polygonToBSC, ...bscToPolygon];
    },
    // Wait until safe detection is complete before querying
    enabled: !!userAddress && !isSafeLoading,
    staleTime: 30000, // 30 seconds
  });
}
