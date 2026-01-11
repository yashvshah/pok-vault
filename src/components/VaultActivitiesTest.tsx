// Test component to verify vault activities hook
import { useVaultActivities } from '../hooks/useVaultActivities';

function VaultActivitiesTest() {
  const { activities, isLoading, error } = useVaultActivities(10);

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div>
      <h2>Vault Activities ({activities.length})</h2>
      <div className="space-y-2">
        {activities.map((activity) => (
          <div key={activity.id} className="border p-4 rounded">
            <div>Type: {activity.type}</div>
            <div>Market: {activity.market || 'N/A'}</div>
            <div>Outcome Tokens: {activity.outcomeTokensAmount || 'N/A'}</div>
            <div>USDC Amount: {activity.usdCAmount || 'N/A'}</div>
            <div>User: {activity.user}</div>
            <div>Tx Hash: {activity.transactionHash}</div>
            <div>Timestamp: {new Date(activity.timestamp * 1000).toLocaleString()}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default VaultActivitiesTest;