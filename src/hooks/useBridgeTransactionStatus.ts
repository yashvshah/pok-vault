import { useQuery } from '@tanstack/react-query';
import { AxelarGMPRecoveryAPI, Environment, GMPStatus } from '@axelar-network/axelarjs-sdk';
import type { PendingBridgeTransaction, BridgeTransactionWithStatus } from '../types/vault';

const sdk = new AxelarGMPRecoveryAPI({
  environment: Environment.MAINNET,
});

interface BridgeStatusResult {
  transactionsWithStatus: BridgeTransactionWithStatus[];
  isLoading: boolean;
}

async function checkTransactionStatus(
  txHash: string
): Promise<{ status: string; isActuallyPending: boolean }> {
  try {
    // Query without event index first (Axelar will find the relevant event)
    const txStatus = await sdk.queryTransactionStatus(txHash);
    
    const status = txStatus.status as string;
    
    // If status is DEST_EXECUTED, the transaction is complete, not actually pending
    const isActuallyPending = status !== GMPStatus.DEST_EXECUTED;
    
    return { status, isActuallyPending };
  } catch (error) {
    console.error(`Error checking status for tx ${txHash}:`, error);
    // If we can't fetch status, assume it's pending
    return { status: GMPStatus.CANNOT_FETCH_STATUS, isActuallyPending: true };
  }
}

export function useBridgeTransactionStatus(
  pendingBridges: PendingBridgeTransaction[]
): BridgeStatusResult {
  const { data, isLoading } = useQuery({
    queryKey: ['bridge-statuses', pendingBridges.map(b => b.transactionHash).join(',')],
    queryFn: async (): Promise<BridgeTransactionWithStatus[]> => {
      if (pendingBridges.length === 0) return [];

      // Check status for all pending bridges
      const statusChecks = await Promise.all(
        pendingBridges.map(async (bridge) => {
          const { status, isActuallyPending } = await checkTransactionStatus(bridge.transactionHash);
          return {
            ...bridge,
            status,
            isActuallyPending
          };
        })
      );

      // Filter out transactions that are actually completed (DEST_EXECUTED)
      return statusChecks.filter(tx => tx.isActuallyPending);
    },
    enabled: pendingBridges.length > 0,
    staleTime: 60000, // 1 minute
    refetchInterval: 30000, // Refetch every 30 seconds to update statuses
  });

  return {
    transactionsWithStatus: data || [],
    isLoading
  };
}

// Helper function to get user-friendly status text
export function getStatusText(status?: string): string {
  if (!status) return 'Checking...';
  
  switch (status) {
    case GMPStatus.SRC_GATEWAY_CALLED:
      return 'Waiting for approval';
    case GMPStatus.SRC_GATEWAY_CONFIRMED:
      return 'Confirmed on source';
    case GMPStatus.APPROVING:
      return 'Approving...';
    case GMPStatus.DEST_GATEWAY_APPROVED:
      return 'Approved - Ready to execute';
    case GMPStatus.DEST_EXECUTING:
      return 'Executing...';
    case GMPStatus.EXPRESS_EXECUTED:
      return 'Express executed';
    case GMPStatus.DEST_EXECUTE_ERROR:
      return 'Execution error';
    case GMPStatus.FORECALLED:
      return 'Forecalled';
    case GMPStatus.FORECALLED_WITHOUT_GAS_PAID:
      return 'Forecalled - Gas unpaid';
    case GMPStatus.NOT_EXECUTED:
      return 'Not executed';
    case GMPStatus.NOT_EXECUTED_WITHOUT_GAS_PAID:
      return 'Not executed - Gas unpaid';
    case GMPStatus.INSUFFICIENT_FEE:
      return 'Insufficient fee';
    case GMPStatus.UNKNOWN_ERROR:
      return 'Unknown error';
    case GMPStatus.CANNOT_FETCH_STATUS:
      return 'Status unavailable';
    default:
      return status;
  }
}

// Helper function to get button style based on status
export function getStatusButtonStyle(status?: string): string {
  if (!status) return 'bg-white/10 border-white/20';
  
  switch (status) {
    case GMPStatus.DEST_GATEWAY_APPROVED:
      return 'bg-green-500/20 border-green-500/40 hover:bg-green-500/30';
    case GMPStatus.DEST_EXECUTE_ERROR:
    case GMPStatus.INSUFFICIENT_FEE:
    case GMPStatus.UNKNOWN_ERROR:
      return 'bg-red-500/20 border-red-500/40 hover:bg-red-500/30';
    case GMPStatus.NOT_EXECUTED_WITHOUT_GAS_PAID:
    case GMPStatus.FORECALLED_WITHOUT_GAS_PAID:
      return 'bg-yellow-500/20 border-yellow-500/40 hover:bg-yellow-500/30';
    case GMPStatus.DEST_EXECUTING:
    case GMPStatus.APPROVING:
      return 'bg-blue-500/20 border-blue-500/40 hover:bg-blue-500/30';
    default:
      return 'bg-white/10 border-white/20 hover:bg-white/20';
  }
}
