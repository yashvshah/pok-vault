import type { FunctionComponent } from 'react';
import { useSendCallsSync } from 'wagmi';
import type { BatchCall } from '../hooks/useAtomicBatch';

interface BatchExecutorProps {
  batchCalls: BatchCall[];
  onRemoveCall: (index: number) => void;
  onClearCalls: () => void;
  chainId?: number;
}

const BatchExecutor: FunctionComponent<BatchExecutorProps> = ({
  batchCalls,
  onRemoveCall,
  onClearCalls,
}) => {
  const { sendCallsSync, isPending } = useSendCallsSync();

  const handleExecuteBatch = () => {
    if (batchCalls.length === 0) return;

    sendCallsSync({
      calls: batchCalls.map(call => ({
        to: call.to,
        data: call.data,
        value: call.value,
      })),
    }, {
      onSuccess: () => {
        onClearCalls();
      },
    });
  };

  if (batchCalls.length === 0) {
    return null;
  }

  return (
    <div className="fixed bottom-6 right-6 max-w-md z-50">
      <div className="gradiant-border shadow-2xl">
        <div className="box-of-gradiant-border p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-semibold">Batch Transactions ({batchCalls.length})</h3>
            <button
              onClick={onClearCalls}
              className="text-gray-400 hover:text-white text-sm"
            >
              Clear All
            </button>
          </div>

          <div className="space-y-2 max-h-64 overflow-y-auto mb-4">
            {batchCalls.map((call, idx) => (
              <div
                key={idx}
                className="flex items-start justify-between gap-2 p-2 bg-black/30 rounded"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white truncate">{call.description}</p>
                  <p className="text-xs text-gray-400 truncate">To: {call.to}</p>
                </div>
                <button
                  onClick={() => onRemoveCall(idx)}
                  className="text-red-400 hover:text-red-300 text-xs shrink-0"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>

          <button
            onClick={handleExecuteBatch}
            disabled={isPending}
            className="w-full bg-primary hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-2.5 px-4 rounded transition-colors"
          >
            {isPending ? 'Executing...' : `Execute ${batchCalls.length} Transaction${batchCalls.length > 1 ? 's' : ''}`}
          </button>
        </div>
      </div>
    </div>
  );
};

export default BatchExecutor;
