// Types for subgraph data
export interface SubgraphDeposit {
  id: string;
  owner: string;
  sender: string;
  shares: string;
  assets: string;
  block_number: string;
  timestamp_: string;
  transactionHash_: string;
}

export interface SubgraphWithdrawal {
  id: string;
  owner: string;
  sender: string;
  shares: string;
  assets: string;
  block_number: string;
  timestamp_: string;
  transactionHash_: string;
}

export interface SubgraphNewOppositeOutcomeTokenPairAdded {
  id: string;
  outcomeIdA: string;
  outcomeIdB: string;
  earlyExitAmountContract: string;
  outcomeTokenA: string;
  outcomeTokenB: string;
  decimalsA: string;
  decimalsB: string;
  block_number: string;
  timestamp_: string;
  transactionHash_: string;
}

export interface SubgraphOppositeOutcomeTokenPairRemoved {
  id: string;
  outcomeIdA: string;
  outcomeIdB: string;
  outcomeTokenA: string;
  outcomeTokenB: string;
  block_number: string;
  timestamp_: string;
  transactionHash_: string;
}

export interface SubgraphOppositeOutcomeTokenPairPaused {
  id: string;
  outcomeIdA: string;
  outcomeIdB: string;
  outcomeTokenA: string;
  outcomeTokenB: string;
  block_number: string;
  timestamp_: string;
  transactionHash_: string;
}

export interface SubgraphProfitOrLossReported {
  id: string;
  outcomeIdA: string;
  outcomeIdB: string;
  outcomeTokenA: string;
  outcomeTokenB: string;
  profitOrLoss: string;
  block_number: string;
  timestamp_: string;
  transactionHash_: string;
}

export interface SubgraphEarlyExit {
  id: string;
  outcomeIdA: string;
  outcomeIdB: string;
  outcomeTokenA: string;
  outcomeTokenB: string;
  amount: string;
  exitAmount: string;
  block_number: string;
  timestamp_: string;
  transactionHash_: string;
}

export interface SubgraphSplitOppositeOutcomeTokens {
  id: string;
  outcomeIdA: string;
  outcomeIdB: string;
  outcomeTokenA: string;
  outcomeTokenB: string;
  amount: string;
  block_number: string;
  timestamp_: string;
  transactionHash_: string;
}

// Bridge event types
export interface SubgraphERC1155SingleReceived {
  id: string;
  from: string;
  to: string;
  idParam: string;
  amount: string;
  block_number: string;
  timestamp_: string;
  transactionHash_: string;
}

export interface SubgraphTransferBatch {
  id: string;
  operator: string;
  from: string;
  to: string;
  ids: string[];
  values: string[];
  block_number: string;
  timestamp_: string;
  transactionHash_: string;
}

export interface PendingBridgeTransaction {
  direction: 'polygon-to-bsc' | 'bsc-to-polygon';
  tokenId: string;
  amount: string;
  to: string;
  timestamp: string;
  transactionHash: string;
  from: string;
}

export interface BridgeTransactionWithStatus extends PendingBridgeTransaction {
  status?: string;
  isActuallyPending: boolean;
}

// Types for table display
export interface VaultActivity {
  id: string;
  type: 'deposit' | 'withdrawal' | 'new-outcome-pair' | 'removed-outcome-pair' | 'paused-outcome-pair' | 'profit-loss-reported' | 'early-exit' | 'split-outcome-tokens';
  market: string; // market info for outcome-related activities, blank for deposits/withdrawals
  outcomeTokensAmount: string; // amount for outcome token activities
  USDTAmount: string; // USDT amount for deposits/withdrawals and profit-loss activities
  user: string; // blank for outcome-related activities (not available in subgraph)
  transactionHash: string;
  timestamp: number;
}