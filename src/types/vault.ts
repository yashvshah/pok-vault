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

// Types for table display
export interface VaultActivity {
  id: string;
  type: 'deposit' | 'withdrawal' | 'new-outcome-pair';
  market: string; // market info for new-outcome-pair, blank for deposits/withdrawals
  outcomeTokensAmount: string; // blank for deposits/withdrawals and new-outcome-pair
  usdCAmount: string; // blank for new-outcome-pair
  user: string; // blank for new-outcome-pair (not available in subgraph)
  transactionHash: string;
  timestamp: number;
}