import { useState } from "react";
import { useReadContracts } from "wagmi";
import { bsc } from "wagmi/chains";
import { FiCopy, FiCheck } from "react-icons/fi";
import type { SupportedMarket } from "../hooks/useSupportedMarkets";
import { providerRegistry } from "../services/providers";
import EarlyExitAmountAbi from "../abi/EarlyExitAmountBasedOnFixedAPYConfigurable.json";
import type { Address, Abi } from "viem";

interface CopyMarketMetadataProps {
  market: SupportedMarket;
}

interface EarlyExitContractData {
  address: string;
  fixedTimeAfterExpiry: {
    raw: string;
    formatted: string;
  };
  marketExpiryTime: {
    raw: string;
    formatted: string;
  };
  expectedApy: {
    raw: string;
    formatted: string;
  };
}

export default function CopyMarketMetadata({ market }: CopyMarketMetadataProps) {
  const [copied, setCopied] = useState(false);

  // Helper functions for formatting (from ManageMarketsPage)
  const formatAPY = (apy: bigint | undefined) => {
    if (!apy) return "N/A";
    return `${(Number(apy) / 100).toFixed(2)}%`;
  };

  const formatHours = (seconds: bigint | undefined) => {
    if (!seconds) return "N/A";
    return `${(Number(seconds) / 3600).toFixed(1)} hours`;
  };

  const formatDateTime = (timestamp: bigint | undefined) => {
    if (!timestamp) return "N/A";
    const date = new Date(Number(timestamp) * 1000);
    return date.toLocaleString();
  };

  // Build contracts array for batch reading early exit contract data
  const contracts = market.pairs.flatMap((pair) => [
    {
      address: pair.earlyExitAmountContract as Address,
      abi: EarlyExitAmountAbi as Abi,
      functionName: "fixedTimeAfterExpiry",
      chainId: bsc.id,
    },
    {
      address: pair.earlyExitAmountContract as Address,
      abi: EarlyExitAmountAbi as Abi,
      functionName: "marketExpiryTime",
      chainId: bsc.id,
    },
    {
      address: pair.earlyExitAmountContract as Address,
      abi: EarlyExitAmountAbi as Abi,
      functionName: "expectedApy",
      chainId: bsc.id,
    },
  ]);

  const { data: contractsData, isLoading } = useReadContracts({
    contracts,
  });

  const handleCopy = async () => {
    // Build provider-specific data
    const providersData: Record<string, {
      name: string;
      question: string;
      url?: string;
      yesTokenId: string;
      noTokenId: string;
      erc1155Address: string;
      decimals: number;
    }> = {};

    for (const [providerId, question] of market.providerQuestions.entries()) {
      const provider = providerRegistry.getById(providerId);
      const tokenIds = market.providerTokenIds.get(providerId);
      const url = market.providerUrls.get(providerId);

      if (provider && tokenIds) {
        providersData[providerId] = {
          name: provider.name,
          question,
          url,
          yesTokenId: tokenIds.yesTokenId,
          noTokenId: tokenIds.noTokenId,
          erc1155Address: provider.erc1155Address,
          decimals: provider.decimals,
        };
      }
    }

    // Build pairs data with early exit contract info
    const pairsData = market.pairs.map((pair, idx) => {
      // Extract contract data for this pair (3 values per pair: fixedTimeAfterExpiry, marketExpiryTime, expectedApy)
      const baseIndex = idx * 3;
      const fixedTimeRaw = contractsData?.[baseIndex]?.result as bigint | undefined;
      const marketExpiryRaw = contractsData?.[baseIndex + 1]?.result as bigint | undefined;
      const expectedApyRaw = contractsData?.[baseIndex + 2]?.result as bigint | undefined;

      const earlyExitData: EarlyExitContractData = {
        address: pair.earlyExitAmountContract,
        fixedTimeAfterExpiry: {
          raw: fixedTimeRaw?.toString() || "N/A",
          formatted: formatHours(fixedTimeRaw),
        },
        marketExpiryTime: {
          raw: marketExpiryRaw?.toString() || "N/A",
          formatted: formatDateTime(marketExpiryRaw),
        },
        expectedApy: {
          raw: expectedApyRaw?.toString() || "N/A",
          formatted: formatAPY(expectedApyRaw),
        },
      };

      return {
        pairKey: pair.key,
        outcomeTokenA: {
          address: pair.outcomeTokenA,
          tokenId: pair.outcomeIdA,
          isYesToken: pair.outcomeIdAIsYesTokenId,
          outcome: pair.outcomeIdAIsYesTokenId ? "YES" : "NO",
          decimals: pair.decimalsA,
        },
        outcomeTokenB: {
          address: pair.outcomeTokenB,
          tokenId: pair.outcomeIdB,
          isYesToken: pair.outcomeIdBIsYesTokenId,
          outcome: pair.outcomeIdBIsYesTokenId ? "YES" : "NO",
          decimals: pair.decimalsB,
        },
        earlyExitContract: earlyExitData,
        status: pair.status,
        timestamp: pair.timestamp,
      };
    });

    const metadata = {
      marketKey: market.marketKey,
      question: market.question,
      overallStatus: market.overallStatus,
      providers: providersData,
      pairs: pairsData,
    };

    try {
      await navigator.clipboard.writeText(JSON.stringify(metadata, null, 2));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Failed to copy metadata:", error);
    }
  };

  return (
    <button
      onClick={handleCopy}
      disabled={isLoading}
      className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-white/80 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 rounded-md transition-all disabled:opacity-50 disabled:cursor-not-allowed"
      title="Copy market metadata as JSON"
    >
      {copied ? (
        <>
          <FiCheck className="text-green-400" />
          <span className="text-green-400">Copied!</span>
        </>
      ) : (
        <>
          <FiCopy />
          <span>{isLoading ? "Loading..." : "Metadata"}</span>
        </>
      )}
    </button>
  );
}
