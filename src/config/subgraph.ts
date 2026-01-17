import { GraphQLClient } from 'graphql-request';

export const SUBGRAPH_URL = 'https://api.goldsky.com/api/public/project_cmk8kaeveu7zx01u72pajfmi5/subgraphs/pokVault-BSC/1.0.0/gn';

export const subgraphClient = new GraphQLClient(SUBGRAPH_URL);

// Bridge subgraph URLs
export const POLYMARKET_SOURCE_BRIDGE_POLYGON_SUBGRAPH_URL = 'https://api.goldsky.com/api/public/project_cmk8kaeveu7zx01u72pajfmi5/subgraphs/pokVault-Polymarket-Source/1.0.0/gn';
export const POLYMARKET_RECEIVER_BRIDGE_BSC_SUBGRAPH_URL = 'https://api.goldsky.com/api/public/project_cmk8kaeveu7zx01u72pajfmi5/subgraphs/pokVault-polymarket-BSC-Receiver/1.0.0/gn';

export const polygonSourceBridgeClient = new GraphQLClient(POLYMARKET_SOURCE_BRIDGE_POLYGON_SUBGRAPH_URL);
export const bscReceiverBridgeClient = new GraphQLClient(POLYMARKET_RECEIVER_BRIDGE_BSC_SUBGRAPH_URL);

// GraphQL queries
export const DEPOSITS_QUERY = `
  query GetDeposits($first: Int = 100, $orderBy: Deposit_orderBy = timestamp_, $orderDirection: OrderDirection = desc) {
    deposits(first: $first, orderBy: $orderBy, orderDirection: $orderDirection) {
      id
      owner
      sender
      shares
      assets
      block_number
      timestamp_
      transactionHash_
    }
  }
`;

export const WITHDRAWALS_QUERY = `
  query GetWithdrawals($first: Int = 100, $orderBy: Withdraw_orderBy = timestamp_, $orderDirection: OrderDirection = desc) {
    withdraws(first: $first, orderBy: $orderBy, orderDirection: $orderDirection) {
      id
      owner
      sender
      shares
      assets
      block_number
      timestamp_
      transactionHash_
    }
  }
`;

export const NEW_OUTCOME_PAIR_QUERY = `
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

export const REMOVED_OUTCOME_PAIR_QUERY = `
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

export const PAUSED_OUTCOME_PAIR_QUERY = `
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

export const PROFIT_LOSS_REPORTED_QUERY = `
  query GetProfitLossReported($first: Int = 100, $orderBy: ProfitOrLossReported_orderBy = timestamp_, $orderDirection: OrderDirection = desc) {
    profitOrLossReporteds(first: $first, orderBy: $orderBy, orderDirection: $orderDirection) {
      id
      outcomeIdA
      outcomeIdB
      outcomeTokenA
      outcomeTokenB
      profitOrLoss
      block_number
      timestamp_
      transactionHash_
    }
  }
`;

export const EARLY_EXIT_QUERY = `
  query GetEarlyExits($first: Int = 100, $orderBy: EarlyExit_orderBy = timestamp_, $orderDirection: OrderDirection = desc) {
    earlyExits(first: $first, orderBy: $orderBy, orderDirection: $orderDirection) {
      id
      outcomeIdA
      outcomeIdB
      outcomeTokenA
      outcomeTokenB
      amount
      exitAmount
      block_number
      timestamp_
      transactionHash_
    }
  }
`;

export const SPLIT_OUTCOME_TOKENS_QUERY = `
  query GetSplitOutcomeTokens($first: Int = 100, $orderBy: SplitOppositeOutcomeToken_orderBy = timestamp_, $orderDirection: OrderDirection = desc) {
    splitOppositeOutcomeTokens(first: $first, orderBy: $orderBy, orderDirection: $orderDirection) {
      id
      outcomeIdA
      outcomeIdB
      outcomeTokenA
      outcomeTokenB
      amount
      block_number
      timestamp_
      transactionHash_
    }
  }
`;

// Bridge queries
export const ERC1155_SINGLE_RECEIVED_QUERY = `
  query GetERC1155SingleReceived($userAddress: String!, $first: Int = 1000) {
    erc1155SingleReceiveds(
      where: { to: $userAddress }
      first: $first
      orderBy: timestamp_
      orderDirection: desc
    ) {
      id
      from
      to
      idParam
      amount
      block_number
      timestamp_
      transactionHash_
    }
  }
`;

export const TRANSFER_BATCH_QUERY = `
  query GetTransferBatch($operator: String!, $from: String!, $to: String!, $first: Int = 1000) {
    transferBatches(
      where: { operator: $operator, from: $from, to: $to }
      first: $first
      orderBy: timestamp_
      orderDirection: desc
    ) {
      id
      operator
      from
      to
      ids
      values
      block_number
      timestamp_
      transactionHash_
    }
  }
`;