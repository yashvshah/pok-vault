import { GraphQLClient } from 'graphql-request';
import { keccak256, encodePacked, type Address } from 'viem';
import type { SubgraphOutcomePair, MarketStatus } from '../types/markets';
import { SUBGRAPH_URL } from '../config/constants';

const NEW_OUTCOME_PAIR_QUERY = `
  query GetNewOutcomePairs($first: Int = 100, $orderBy: NewOppositeOutcomeTokenPairAdded_orderBy = timestamp_, $orderDirection: OrderDirection = desc) {
    newOppositeOutcomeTokenPairAddeds(first: $first, orderBy: $orderBy, orderDirection: $orderDirection) {
      id
      outcomeIdA
      outcomeIdB
      earlyExitAmountContract
      outcomeTokenA
      outcomeTokenB
      decimalsA
      decimalsB
      block_number
      timestamp_
      transactionHash_
    }
  }
`;

const REMOVED_OUTCOME_PAIR_QUERY = `
  query GetRemovedOutcomePairs($first: Int = 100, $orderBy: OppositeOutcomeTokenPairRemoved_orderBy = timestamp_, $orderDirection: OrderDirection = desc) {
    oppositeOutcomeTokenPairRemoveds(first: $first, orderBy: $orderBy, orderDirection: $orderDirection) {
      id
      outcomeIdA
      outcomeIdB
      outcomeTokenA
      outcomeTokenB
      block_number
      timestamp_
      transactionHash_
    }
  }
`;

const PAUSED_OUTCOME_PAIR_QUERY = `
  query GetPausedOutcomePairs($first: Int = 100, $orderBy: OppositeOutcomeTokenPairPaused_orderBy = timestamp_, $orderDirection: OrderDirection = desc) {
    oppositeOutcomeTokenPairPauseds(first: $first, orderBy: $orderBy, orderDirection: $orderDirection) {
      id
      outcomeIdA
      outcomeIdB
      outcomeTokenA
      outcomeTokenB
      block_number
      timestamp_
      transactionHash_
    }
  }
`;

interface NewOutcomePairsResponse {
  newOppositeOutcomeTokenPairAddeds: SubgraphOutcomePair[];
}

interface RemovedOutcomePairsResponse {
  oppositeOutcomeTokenPairRemoveds: Array<{
    id: string;
    outcomeIdA: string;
    outcomeIdB: string;
    outcomeTokenA: string;
    outcomeTokenB: string;
    timestamp_: string;
  }>;
}

interface PausedOutcomePairsResponse {
  oppositeOutcomeTokenPairPauseds: Array<{
    id: string;
    outcomeIdA: string;
    outcomeIdB: string;
    outcomeTokenA: string;
    outcomeTokenB: string;
    timestamp_: string;
  }>;
}

export function createPairKey(
  tokenA: string,
  idA: string,
  tokenB: string,
  idB: string
): string {
  const bigIntA = BigInt(idA);
  const bigIntB = BigInt(idB);
  
  const addrComparison = tokenA.toLowerCase().localeCompare(tokenB.toLowerCase());
  
  let addr1: string, id1: bigint, addr2: string, id2: bigint;
  
  if (addrComparison < 0 || (addrComparison === 0 && bigIntA < bigIntB)) {
    addr1 = tokenA;
    id1 = bigIntA;
    addr2 = tokenB;
    id2 = bigIntB;
  } else {
    addr1 = tokenB;
    id1 = bigIntB;
    addr2 = tokenA;
    id2 = bigIntA;
  }
  
  return keccak256(
    encodePacked(
      ["address", "uint256", "address", "uint256"],
      [addr1 as Address, id1, addr2 as Address, id2]
    )
  );
}

export class SubgraphService {
  private client: GraphQLClient;

  constructor(subgraphUrl: string = SUBGRAPH_URL) {
    this.client = new GraphQLClient(subgraphUrl);
  }

  async fetchNewOutcomePairs(limit = 100): Promise<SubgraphOutcomePair[]> {
    const response = await this.client.request<NewOutcomePairsResponse>(
      NEW_OUTCOME_PAIR_QUERY,
      { first: limit }
    );
    return response.newOppositeOutcomeTokenPairAddeds || [];
  }

  async fetchRemovedOutcomePairs(limit = 100): Promise<Map<string, number>> {
    const response = await this.client.request<RemovedOutcomePairsResponse>(
      REMOVED_OUTCOME_PAIR_QUERY,
      { first: limit }
    );
    
    const removedMap = new Map<string, number>();
    response.oppositeOutcomeTokenPairRemoveds?.forEach(p => {
      const key = createPairKey(p.outcomeTokenA, p.outcomeIdA, p.outcomeTokenB, p.outcomeIdB);
      const timestamp = parseInt(p.timestamp_);
      if (!removedMap.has(key) || removedMap.get(key)! < timestamp) {
        removedMap.set(key, timestamp);
      }
    });
    
    return removedMap;
  }

  async fetchPausedOutcomePairs(limit = 100): Promise<Map<string, number>> {
    const response = await this.client.request<PausedOutcomePairsResponse>(
      PAUSED_OUTCOME_PAIR_QUERY,
      { first: limit }
    );
    
    const pausedMap = new Map<string, number>();
    response.oppositeOutcomeTokenPairPauseds?.forEach(p => {
      const key = createPairKey(p.outcomeTokenA, p.outcomeIdA, p.outcomeTokenB, p.outcomeIdB);
      const timestamp = parseInt(p.timestamp_);
      if (!pausedMap.has(key) || pausedMap.get(key)! < timestamp) {
        pausedMap.set(key, timestamp);
      }
    });
    
    return pausedMap;
  }

  calculatePairStatus(
    addedTimestamp: number,
    pausedTimestamp: number,
    removedTimestamp: number
  ): MarketStatus {
    if (removedTimestamp > addedTimestamp && removedTimestamp > pausedTimestamp) {
      return 'removed';
    } else if (pausedTimestamp > addedTimestamp && pausedTimestamp > removedTimestamp) {
      return 'paused';
    }
    return 'allowed';
  }
}
