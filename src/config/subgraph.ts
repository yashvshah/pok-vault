import { GraphQLClient } from 'graphql-request';

export const SUBGRAPH_URL = 'https://api.goldsky.com/api/public/project_cmk8kaeveu7zx01u72pajfmi5/subgraphs/pokVault/1.0.0/gn';

export const subgraphClient = new GraphQLClient(SUBGRAPH_URL);

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