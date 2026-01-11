import { useVaultActivities } from '../hooks/useVaultActivities';

interface VaultActivitiesTableProps {
  limit?: number;
}

function VaultActivitiesTable({ limit = 20 }: VaultActivitiesTableProps) {
  const { activities, isLoading, error } = useVaultActivities(limit);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#EC6769]"></div>
        <span className="ml-2 text-gray-600">Loading activities...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="text-red-800 font-medium">Error loading activities</div>
        <div className="text-red-600 text-sm mt-1">{error.message}</div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="px-6 py-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900">
          Vault Activities ({activities.length})
        </h2>
        <p className="text-sm text-gray-600 mt-1">
          Recent deposits, withdrawals, and outcome token activities
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Type
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Market
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Outcome Tokens
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                USDC Amount
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                User
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Transaction
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Time
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {activities.map((activity) => (
              <tr key={activity.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                    activity.type === 'deposit'
                      ? 'bg-green-100 text-green-800'
                      : activity.type === 'withdrawal'
                      ? 'bg-red-100 text-red-800'
                      : activity.type === 'new-outcome-pair'
                      ? 'bg-blue-100 text-blue-800'
                      : activity.type === 'removed-outcome-pair'
                      ? 'bg-orange-100 text-orange-800'
                      : activity.type === 'paused-outcome-pair'
                      ? 'bg-yellow-100 text-yellow-800'
                      : activity.type === 'profit-loss-reported'
                      ? 'bg-purple-100 text-purple-800'
                      : activity.type === 'early-exit'
                      ? 'bg-indigo-100 text-indigo-800'
                      : activity.type === 'split-outcome-tokens'
                      ? 'bg-pink-100 text-pink-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {activity.type.replace(/-/g, ' ')}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm text-gray-900 max-w-xs truncate">
                    {activity.market || 'Loading...'}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {activity.outcomeTokensAmount ? (
                    <span className="font-mono">
                      {Number(activity.outcomeTokensAmount).toLocaleString()}
                    </span>
                  ) : (
                    <span className="text-gray-400">-</span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {activity.usdCAmount ? (
                    <span className="font-mono">
                      ${Number(activity.usdCAmount).toLocaleString()}
                    </span>
                  ) : (
                    <span className="text-gray-400">-</span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="text-sm font-mono text-gray-900">
                    {activity.user.slice(0, 6)}...{activity.user.slice(-4)}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <a
                    href={`https://polygonscan.com/tx/${activity.transactionHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#EC6769] hover:text-[#d55a5c] text-sm font-mono"
                  >
                    {activity.transactionHash.slice(0, 6)}...{activity.transactionHash.slice(-4)}
                  </a>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {new Date(activity.timestamp * 1000).toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {activities.length === 0 && (
        <div className="px-6 py-8 text-center text-gray-500">
          No activities found
        </div>
      )}
    </div>
  );
}

export default VaultActivitiesTable;