import toast from 'react-hot-toast';

type BridgeDirection = 'polygon-to-bsc' | 'bsc-to-polygon';
type OutcomeType = 'YES' | 'NO';

interface BridgeNotificationParams {
  txHash: string;
  direction: BridgeDirection;
  outcomeType: OutcomeType;
}

/**
 * Show a notification when a bridge transaction is initiated
 */
export function showBridgeStartedNotification({
  txHash,
  direction,
  outcomeType,
}: BridgeNotificationParams) {
  const directionText = direction === 'polygon-to-bsc' 
    ? 'Polygon → BSC' 
    : 'BSC → Polygon';
  
  const axelarUrl = `https://axelarscan.io/gmp/${txHash}`;

  toast.custom(
    (t) => (
      <div
        className={`${
          t.visible ? 'animate-enter' : 'animate-leave'
        } max-w-md w-full bg-[#1c0e0e] border border-primary/30 rounded-lg pointer-events-auto flex`}
      >
        <div className="flex-1 p-4">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              {/* Bridge icon */}
              <svg className="h-6 w-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
              </svg>
            </div>
            <div className="ml-3 flex-1">
              <p className="text-sm font-medium text-white">
                Bridge Started
              </p>
              <p className="mt-1 text-sm text-white/70">
                Bridging {outcomeType} tokens {directionText}
              </p>
              <button
                onClick={() => window.open(axelarUrl, '_blank')}
                className="mt-2 text-xs text-primary hover:text-primary/80 underline cursor-pointer"
              >
                Click here to view status on Axelarscan →
              </button>
            </div>
            <button
              onClick={() => toast.dismiss(t.id)}
              className="ml-4 flex-shrink-0 text-white/50 hover:text-white"
            >
              <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    ),
    {
      duration: 15000, // 15 seconds
    }
  );
}
