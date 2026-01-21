import toast from 'react-hot-toast';
import { useWaitForTransactionReceipt } from 'wagmi';
import type { Address } from 'viem';

type BridgeDirection = 'polygon-to-bsc' | 'bsc-to-polygon';
type OutcomeType = 'YES' | 'NO';

interface BridgeTransactionNotificationProps {
  txHash: Address;
  direction: BridgeDirection;
  outcomeType: OutcomeType;
  chainId: number;
  toastId: string;
}

/**
 * Component that shows transaction status with loader until confirmed
 */
export function BridgeTransactionNotification({
  txHash,
  direction,
  outcomeType,
  chainId,
  toastId,
}: BridgeTransactionNotificationProps) {
  const { isLoading, isSuccess } = useWaitForTransactionReceipt({
    hash: txHash,
    chainId,
  });

  const directionText = direction === 'polygon-to-bsc' 
    ? 'Polygon → BSC' 
    : 'BSC → Polygon';
  
  const explorerUrl = chainId === 137 
    ? `https://polygonscan.com/tx/${txHash}`
    : `https://bscscan.com/tx/${txHash}`;
  
  const axelarUrl = `https://axelarscan.io/gmp/${txHash}`;

  return (
    <div className="max-w-md w-full bg-[#1c0e0e] border border-primary/30 rounded-lg pointer-events-auto flex">
      <div className="flex-1 p-4">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            {isLoading ? (
              /* Loading spinner */
              <div className="h-6 w-6">
                <svg className="animate-spin h-6 w-6 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              </div>
            ) : (
              /* Bridge icon */
              <svg className="h-6 w-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
              </svg>
            )}
          </div>
          <div className="ml-3 flex-1">
            <p className="text-sm font-medium text-white">
              {isLoading ? 'Confirming Transaction...' : 'Bridge Transaction Submitted'}
            </p>
            <p className="mt-1 text-sm text-white/70">
              Bridging {outcomeType} tokens {directionText}
            </p>
            
            {isLoading ? (
              <a
                href={explorerUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 text-xs text-primary hover:text-primary/80 underline cursor-pointer block"
              >
                View on {chainId === 137 ? 'Polygonscan' : 'BSCscan'} →
              </a>
            ) : isSuccess ? (
              <a
                href={axelarUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 text-xs text-primary hover:text-primary/80 underline cursor-pointer block"
              >
                Track bridge status on Axelarscan →
              </a>
            ) : null}
          </div>
          <button
            onClick={() => toast.dismiss(toastId)}
            className="ml-4 flex-shrink-0 text-white/50 hover:text-white"
          >
            <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
