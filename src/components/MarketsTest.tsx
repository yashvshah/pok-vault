// Test component to verify markets data
import { useMemo } from 'react';
import { useNewOutcomePairs } from '../hooks/activities/useNewOutcomePairs';
import { useMarketInfos } from '../hooks/useMarketInfos';
import { useReadContracts } from 'wagmi';
import { encodePacked, keccak256 } from 'viem';
import EarlyExitVaultABI from '../abi/EarlyExitVault.json';
import type { PolymarketMarket } from '../services/polymarket';
import { erc1155Abi } from 'viem';
import {config} from "../../wagmi.config";

// Vault contract address (placeholder - needs to be updated)
const VAULT_ADDRESS = '0x69362094D0C2D8Be0818c0006e09B82c5CA59Af9' as const;

const POLYGON_ERC1155_ADDRESS = '0x4d97dcd97ec945f40cf65f87097ace5ea0476045';

function MarketsTest() {
//   const { address: userAddress } = useAccount();
const userAddress = "0x8A7f538B6f6Bdab69edD0E311aeDa9214bC5384A"; // For testing without wallet connection
  const { data: newOutcomePairs = [], isLoading, error } = useNewOutcomePairs(50);

  // Filter for Polymarket ERC1155 tokens only
  const polymarketPairs = useMemo(() => {
    return newOutcomePairs.filter((pair) =>
      pair.outcomeTokenA.toLowerCase() === POLYGON_ERC1155_ADDRESS.toLowerCase() ||
      pair.outcomeTokenB.toLowerCase() === POLYGON_ERC1155_ADDRESS.toLowerCase()
    );
  }, [newOutcomePairs]);

  // Get unique outcome IDs for market info
  const outcomeIds = useMemo(() => {
    const ids = new Set<string>();
    polymarketPairs.forEach((pair) => {
      if (pair.outcomeTokenA.toLowerCase() === POLYGON_ERC1155_ADDRESS.toLowerCase()) {
        ids.add(pair.outcomeIdA);
      }
      if (pair.outcomeTokenB.toLowerCase() === POLYGON_ERC1155_ADDRESS.toLowerCase()) {
        ids.add(pair.outcomeIdB);
      }
    });
    return Array.from(ids);
  }, [polymarketPairs]);

  // Fetch market info for outcome IDs
  const { data: marketInfos } = useMarketInfos(outcomeIds);

  // Create market info map
  const marketInfoMap = useMemo(() => {
    const map = new Map<string, PolymarketMarket>();
    outcomeIds.forEach((id, index) => {
      if (marketInfos?.[index]) {
        map.set(id, marketInfos[index]);
      }
    });
    return map;
  }, [outcomeIds, marketInfos]);

  // Prepare multicall contracts for vault info and balances
  const multicallContracts = useMemo(() => {
    const contracts: any[] = [];

    polymarketPairs.forEach((pair) => {
      // Generate the mapping key: keccak256(abi.encodePacked(outcomeTokenA, outcomeIdA, outcomeTokenB, outcomeIdB))
      const key = keccak256(encodePacked(
        ['address', 'uint256', 'address', 'uint256'],
        [pair.outcomeTokenA as `0x${string}`, BigInt(pair.outcomeIdA), pair.outcomeTokenB as `0x${string}`, BigInt(pair.outcomeIdB)]
      ));

      console.log('Generated key for pair:', key);

      // Vault info contract call
      contracts.push({
        address: VAULT_ADDRESS,
        abi: EarlyExitVaultABI,
        functionName: 'allowedOppositeOutcomeTokensInfo',
        args: [key],
      });

      // Balance calls for outcome token A (if user is connected)
      if (userAddress) {
        contracts.push({
          address: pair.outcomeTokenA,
          abi: erc1155Abi,
          functionName: 'balanceOf',
          args: [userAddress, BigInt(pair.outcomeIdA)],
        });
      }

      // Balance calls for outcome token B (if user is connected)
      if (userAddress) {
        contracts.push({
          address: pair.outcomeTokenB,
          abi: erc1155Abi,
          functionName: 'balanceOf',
          args: [userAddress, BigInt(pair.outcomeIdB)],
        });
      }
    });

    return contracts;
  }, [polymarketPairs, userAddress]);

  console.log('Multicall Contracts:', multicallContracts);

  const { data: multicallData, isLoading: multicallLoading } = useReadContracts({
    config,
    contracts: multicallContracts,
    query: {
      enabled: multicallContracts.length > 0,
    },
  });

  console.log('Multicall Data:', multicallData);

  // Process the multicall results
  const processedMarkets = useMemo(() => {
    if (!multicallData) return [];

    const results: any[] = [];
    let contractIndex = 0;

    polymarketPairs.forEach((pair) => {
      const marketInfoA = marketInfoMap.get(pair.outcomeIdA);
      const marketInfoB = marketInfoMap.get(pair.outcomeIdB);

      const vaultInfo = multicallData[contractIndex]?.result as any;
      contractIndex++;

      let balanceA = null;
      let balanceB = null;

      // Get balances if available
      if (userAddress && pair.outcomeTokenA.toLowerCase() === POLYGON_ERC1155_ADDRESS.toLowerCase()) {
        balanceA = multicallData[contractIndex]?.result as bigint;
        contractIndex++;
      }

      if (userAddress && pair.outcomeTokenB.toLowerCase() === POLYGON_ERC1155_ADDRESS.toLowerCase()) {
        balanceB = multicallData[contractIndex]?.result as bigint;
        contractIndex++;
      }

      results.push({
        pair,
        marketInfoA,
        marketInfoB,
        vaultInfo: vaultInfo ? {
          isAllowed: vaultInfo[0],
          isPaused: vaultInfo[1],
          decimalsA: vaultInfo[2],
          decimalsB: vaultInfo[3],
          earlyExitAmountContract: vaultInfo[4],
          earlyExitedAmount: vaultInfo[5],
        } : null,
        balanceA,
        balanceB,
      });
    });

    return results;
  }, [polymarketPairs, marketInfoMap, multicallData, userAddress]);

  if (isLoading || multicallLoading) return <div>Loading markets...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div>
      <h1>Markets ({processedMarkets.length})</h1>
      {!userAddress && <p>Please connect your wallet to see token balances</p>}
      <div className="space-y-4">
        {processedMarkets.map((market, index) => (
          <div key={index} className="border p-4 rounded">
            <h3>Market Pair {index + 1}</h3>

            <div className="grid grid-cols-2 gap-4 mt-2">
              <div>
                <h4>Token A</h4>
                <div>Token Address: {market.pair.outcomeTokenA}</div>
                {/* <div>Outcome ID: {market.pair.outcomeIdA}</div> */}
                <div>Market: {market.marketInfoA?.question || 'N/A'}</div>
                {userAddress && <div>Balance: {market.balanceA?.toString() || 'N/A'}</div>}
              </div>

              <div>
                <h4>Token B</h4>
                <div>Token Address: {market.pair.outcomeTokenB}</div>
                {/* <div>Outcome ID: {market.pair.outcomeIdB}</div> */}
                <div>Market: {market.marketInfoB?.question || 'N/A'}</div>
                {userAddress && <div>Balance: {market.balanceB?.toString() || 'N/A'}</div>}
              </div>
            </div>

            <div className="mt-4">
              <h4>Vault Info</h4>
              {market.vaultInfo ? (
                <div className="grid grid-cols-2 gap-4">
                  <div>Is Allowed: {market.vaultInfo.isAllowed ? 'Yes' : 'No'}</div>
                  <div>Is Paused: {market.vaultInfo.isPaused ? 'Yes' : 'No'}</div>
                  <div>Decimals A: {market.vaultInfo.decimalsA}</div>
                  <div>Decimals B: {market.vaultInfo.decimalsB}</div>
                  <div>Early Exit Contract: {market.vaultInfo.earlyExitAmountContract}</div>
                  <div>Early Exited Amount: {market.vaultInfo.earlyExitedAmount?.toString()}</div>
                </div>
              ) : (
                <div>No vault info available</div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default MarketsTest;