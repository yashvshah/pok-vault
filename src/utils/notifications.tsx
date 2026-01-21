import toast from 'react-hot-toast';
import type { Address } from 'viem';
import { BridgeTransactionNotification } from '../components/BridgeTransactionNotification';

type BridgeDirection = 'polygon-to-bsc' | 'bsc-to-polygon';
type OutcomeType = 'YES' | 'NO';

interface BridgeNotificationParams {
  txHash: Address;
  direction: BridgeDirection;
  outcomeType: OutcomeType;
  chainId: number;
}

/**
 * Show a notification when a bridge transaction is initiated
 */
export function showBridgeStartedNotification({
  txHash,
  direction,
  outcomeType,
  chainId,
}: BridgeNotificationParams) {
  toast.custom(
    (t) => (
      <BridgeTransactionNotification
        txHash={txHash}
        direction={direction}
        outcomeType={outcomeType}
        chainId={chainId}
        toastId={t.id}
      />
    ),
    {
      duration: Infinity, // Keep notification until manually dismissed or transaction confirmed
    }
  );
}
