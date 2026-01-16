import { useState, type FunctionComponent } from "react";
import { useReadContract, useWriteContract, useAccount } from "wagmi";
import { keccak256, encodePacked, isAddress } from "viem";
import EarlyExitVaultABI from "../abi/EarlyExitVault.json";
import EarlyExitAmountBasedOnFixedAPYABI from "../abi/EarlyExitAmountBasedOnFixedAPY.json";
import EarlyExitAmountFactoryBasedOnFixedAPYABI from "../abi/EarlyExitAmountFactoryBasedOnFixedAPYABI.json";
import { opinionService } from "../services/opinion";
import { polymarketService } from "../services/polymarket";
import {
  VAULT_ADDRESS,
  EARLY_EXIT_FACTORY_ADDRESS,
  POLYGON_ERC1155_BRIDGED_BSC_ADDRESS,
  OPINION_ERC1155_ADDRESS,
  POLYMARKET_DECIMALS,
  OPINION_DECIMALS,
} from "../config/addresses";

interface OppositeOutcomeTokensInfo {
  isAllowed: boolean;
  isPaused: boolean;
  decimalsA: number;
  decimalsB: number;
  earlyExitAmountContract: string;
  earlyExitedAmount: bigint;
}

interface MarketInputData {
  polymarketId: string;
  opinionId: string;
  polymarketInfo?: {
    question: string;
    yesTokenId: string;
    noTokenId: string;
    image?: string;
    endDate?: string;
  };
  opinionInfo?: {
    question: string;
    yesTokenId: string;
    noTokenId: string;
    thumbnailUrl?: string;
  };
}

const ManageMarketsPage: FunctionComponent = () => {
  const [polymarketId, setPolymarketId] = useState("");
  const [opinionId, setOpinionId] = useState("");
  const [fetchedMarket, setFetchedMarket] = useState<MarketInputData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [earlyExitContractAddress, setEarlyExitContractAddress] = useState("");
  const [showCreateContract, setShowCreateContract] = useState(false);

  console.log("Fetched Market:", fetchedMarket);
  
  // Factory contract creation inputs
  const [newMarketExpiryDate, setNewMarketExpiryDate] = useState("");
  const [newExpectedAPY, setNewExpectedAPY] = useState("");
  const [newFixedTimeHours, setNewFixedTimeHours] = useState("");

  const { address } = useAccount();
  const { writeContract } = useWriteContract();

  // Read owner from contract
  const { data: ownerAddress } = useReadContract({
    address: VAULT_ADDRESS,
    abi: EarlyExitVaultABI,
    functionName: "owner",
  }) as { data: string | undefined };

  const isOwner = address && ownerAddress && address.toLowerCase() === ownerAddress.toLowerCase();

  // Read early exit contract parameters if address is valid
  const isValidEarlyExitAddress = earlyExitContractAddress && isAddress(earlyExitContractAddress);

  const { data: expectedAPY } = useReadContract({
    address: isValidEarlyExitAddress ? (earlyExitContractAddress as `0x${string}`) : undefined,
    abi: EarlyExitAmountBasedOnFixedAPYABI,
    functionName: "EXPECTED_APY",
    query: {
      enabled: !!isValidEarlyExitAddress,
    },
  }) as { data: bigint | undefined };

  const { data: fixedTimeAfterExpiry } = useReadContract({
    address: isValidEarlyExitAddress ? (earlyExitContractAddress as `0x${string}`) : undefined,
    abi: EarlyExitAmountBasedOnFixedAPYABI,
    functionName: "FIXED_TIME_AFTER_EXPIRY",
    query: {
      enabled: !!isValidEarlyExitAddress,
    },
  }) as { data: bigint | undefined };

  const { data: marketExpiryTime } = useReadContract({
    address: isValidEarlyExitAddress ? (earlyExitContractAddress as `0x${string}`) : undefined,
    abi: EarlyExitAmountBasedOnFixedAPYABI,
    functionName: "MARKET_EXPIRY_TIME",
    query: {
      enabled: !!isValidEarlyExitAddress,
    },
  }) as { data: bigint | undefined };

  // Helper functions for formatting
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

  const formatEarlyExitedAmount = (amount: bigint | undefined) => {
    if (!amount) return "0";
    const formatted = Number(amount) / 1e18;
    return formatted.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 });
  };

  // Helper function to sort token pairs (lesser one first)
  const getSortedTokenPair = (
    tokenA: string,
    idA: string,
    tokenB: string,
    idB: string
  ): [[string, bigint], [string, bigint]] => {
    const bigIntA = BigInt(idA);
    const bigIntB = BigInt(idB);
    
    // Compare addresses first
    const addrComparison = tokenA.toLowerCase().localeCompare(tokenB.toLowerCase());
    
    if (addrComparison < 0 || (addrComparison === 0 && bigIntA < bigIntB)) {
      return [[tokenA, bigIntA], [tokenB, bigIntB]];
    } else {
      return [[tokenB, bigIntB], [tokenA, bigIntA]];
    }
  };

  // Calculate hash for YES Poly + NO Opinion pair
  const yesPolyNoOpinionHash = fetchedMarket?.polymarketInfo?.yesTokenId && fetchedMarket?.opinionInfo?.noTokenId
    ? (() => {
        const [[addr1, id1], [addr2, id2]] = getSortedTokenPair(
          POLYGON_ERC1155_BRIDGED_BSC_ADDRESS,
          fetchedMarket.polymarketInfo.yesTokenId,
          OPINION_ERC1155_ADDRESS,
          fetchedMarket.opinionInfo.noTokenId
        );
        return keccak256(
          encodePacked(
            ["address", "uint256", "address", "uint256"],
            [addr1 as `0x${string}`, id1, addr2 as `0x${string}`, id2]
          )
        );
      })()
    : undefined;

  // Calculate hash for NO Poly + YES Opinion pair
  const noPolyYesOpinionHash = fetchedMarket?.polymarketInfo?.noTokenId && fetchedMarket?.opinionInfo?.yesTokenId
    ? (() => {
        const [[addr1, id1], [addr2, id2]] = getSortedTokenPair(
          POLYGON_ERC1155_BRIDGED_BSC_ADDRESS,
          fetchedMarket.polymarketInfo.noTokenId,
          OPINION_ERC1155_ADDRESS,
          fetchedMarket.opinionInfo.yesTokenId
        );
        return keccak256(
          encodePacked(
            ["address", "uint256", "address", "uint256"],
            [addr1 as `0x${string}`, id1, addr2 as `0x${string}`, id2]
          )
        );
      })()
    : undefined;

  // Read contract data for YES Poly + NO Opinion
  const { data: yesPolyNoOpinionRawData } = useReadContract({
    address: VAULT_ADDRESS,
    abi: EarlyExitVaultABI,
    functionName: "allowedOppositeOutcomeTokensInfo",
    args: yesPolyNoOpinionHash ? [yesPolyNoOpinionHash] : undefined,
    query: {
      enabled: !!yesPolyNoOpinionHash,
    },
  }) as { data: readonly [boolean, boolean, number, number, string, bigint] | undefined };

  // Map array response to structured object
  const yesPolyNoOpinionInfo: OppositeOutcomeTokensInfo | undefined = yesPolyNoOpinionRawData
    ? {
        isAllowed: yesPolyNoOpinionRawData[0],
        isPaused: yesPolyNoOpinionRawData[1],
        decimalsA: yesPolyNoOpinionRawData[2],
        decimalsB: yesPolyNoOpinionRawData[3],
        earlyExitAmountContract: yesPolyNoOpinionRawData[4],
        earlyExitedAmount: yesPolyNoOpinionRawData[5],
      }
    : undefined;

  // Read contract data for NO Poly + YES Opinion
  const { data: noPolyYesOpinionRawData } = useReadContract({
    address: VAULT_ADDRESS,
    abi: EarlyExitVaultABI,
    functionName: "allowedOppositeOutcomeTokensInfo",
    args: noPolyYesOpinionHash ? [noPolyYesOpinionHash] : undefined,
    query: {
      enabled: !!noPolyYesOpinionHash,
    },
  }) as { data: readonly [boolean, boolean, number, number, string, bigint] | undefined };

  // Map array response to structured object
  const noPolyYesOpinionInfo: OppositeOutcomeTokensInfo | undefined = noPolyYesOpinionRawData
    ? {
        isAllowed: noPolyYesOpinionRawData[0],
        isPaused: noPolyYesOpinionRawData[1],
        decimalsA: noPolyYesOpinionRawData[2],
        decimalsB: noPolyYesOpinionRawData[3],
        earlyExitAmountContract: noPolyYesOpinionRawData[4],
        earlyExitedAmount: noPolyYesOpinionRawData[5],
      }
    : undefined;

  const fetchPolymarketInfo = async (slug: string) => {
    try {
      const market = await polymarketService.getMarketBySlug(slug);
      
      if (!market) {
        throw new Error("Failed to fetch Polymarket market data");
      }

      return {
        question: market.question,
        yesTokenId: market.yesTokenId,
        noTokenId: market.noTokenId,
        image: market.image,
        endDate: market.endDate,
      };
    } catch (error) {
      console.error("Error fetching Polymarket info:", error);
      throw error;
    }
  };

  const fetchOpinionInfo = async (marketId: string) => {
    try {
      const opinionData = await opinionService.getMarketById(marketId);
      
      if (!opinionData) {
        throw new Error("Failed to fetch Opinion market data");
      }

      return {
        question: opinionData.marketTitle,
        yesTokenId: opinionData.yesTokenId,
        noTokenId: opinionData.noTokenId,
        thumbnailUrl: opinionData.thumbnailUrl,
      };
    } catch (error) {
      console.error("Error fetching Opinion info:", error);
      throw error;
    }
  };

  const handleFetchMarkets = async () => {
    if (!polymarketId || !opinionId) {
      return;
    }

    setIsLoading(true);
    try {
      const [polyInfo, opinionInfo] = await Promise.all([
        fetchPolymarketInfo(polymarketId),
        fetchOpinionInfo(opinionId),
      ]);

      setFetchedMarket({
        polymarketId,
        opinionId,
        polymarketInfo: polyInfo,
        opinionInfo: opinionInfo,
      });
    } catch (error) {
      console.error("Error fetching market info:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateEarlyExitContract = () => {
    if (!newMarketExpiryDate || !newExpectedAPY || !newFixedTimeHours) return;

    // Convert datetime to timestamp
    const marketExpiryTimestamp = BigInt(Math.floor(new Date(newMarketExpiryDate).getTime() / 1000));
    
    // Convert percentage to basis points (e.g., 5% -> 500)
    const expectedAPYBasisPoints = BigInt(Math.floor(parseFloat(newExpectedAPY) * 100));
    
    // Convert hours to seconds
    const fixedTimeSeconds = BigInt(Math.floor(parseFloat(newFixedTimeHours) * 3600));

    writeContract({
      address: EARLY_EXIT_FACTORY_ADDRESS,
      abi: EarlyExitAmountFactoryBasedOnFixedAPYABI,
      functionName: "createEarlyExitAmountContract",
      args: [marketExpiryTimestamp, expectedAPYBasisPoints, fixedTimeSeconds],
    });
  };

  const handleAllowYesPolyNoOpinion = () => {
    if (!fetchedMarket || !earlyExitContractAddress) return;
    
    const [[addr1, id1], [addr2, id2]] = getSortedTokenPair(
      POLYGON_ERC1155_BRIDGED_BSC_ADDRESS,
      fetchedMarket.polymarketInfo!.yesTokenId,
      OPINION_ERC1155_ADDRESS,
      fetchedMarket.opinionInfo!.noTokenId
    );

    // Determine decimals based on which token is first after sorting
    const decimals1 = addr1.toLowerCase() === POLYGON_ERC1155_BRIDGED_BSC_ADDRESS.toLowerCase() ? POLYMARKET_DECIMALS : OPINION_DECIMALS;
    const decimals2 = addr2.toLowerCase() === POLYGON_ERC1155_BRIDGED_BSC_ADDRESS.toLowerCase() ? POLYMARKET_DECIMALS : OPINION_DECIMALS;

    writeContract({
      address: VAULT_ADDRESS,
      abi: EarlyExitVaultABI,
      functionName: "addAllowedOppositeOutcomeTokens",
      args: [
        addr1,
        decimals1,
        id1,
        addr2,
        decimals2,
        id2,
        earlyExitContractAddress as `0x${string}`,
      ],
    });
  };

  const handleAllowNoPolyYesOpinion = () => {
    if (!fetchedMarket || !earlyExitContractAddress) return;
    
    const [[addr1, id1], [addr2, id2]] = getSortedTokenPair(
      POLYGON_ERC1155_BRIDGED_BSC_ADDRESS,
      fetchedMarket.polymarketInfo!.noTokenId,
      OPINION_ERC1155_ADDRESS,
      fetchedMarket.opinionInfo!.yesTokenId
    );

    // Determine decimals based on which token is first after sorting
    const decimals1 = addr1.toLowerCase() === POLYGON_ERC1155_BRIDGED_BSC_ADDRESS.toLowerCase() ? POLYMARKET_DECIMALS : OPINION_DECIMALS;
    const decimals2 = addr2.toLowerCase() === POLYGON_ERC1155_BRIDGED_BSC_ADDRESS.toLowerCase() ? POLYMARKET_DECIMALS : OPINION_DECIMALS;

    writeContract({
      address: VAULT_ADDRESS,
      abi: EarlyExitVaultABI,
      functionName: "addAllowedOppositeOutcomeTokens",
      args: [
        addr1,
        decimals1,
        id1,
        addr2,
        decimals2,
        id2,
        earlyExitContractAddress as `0x${string}`,
      ],
    });
  };

  return (
    <div className="mx-30 mb-10">
      <h1 className="text-5xl font-League-Spartan mt-10">Manage Markets</h1>
      <p className="text-gray-400 mt-5 max-w-lg">
        Add new market pairs or view existing supported markets for early exit arbitrage.
      </p>

      <div className="mt-10 p-6 gradiant-border">
        <div className="box-of-gradiant-border">
          <h2 className="text-2xl font-semibold mb-6">Add Market Pair</h2>
          
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-white/80 mb-2">
                Polymarket Market Slug
              </label>
              <input
                type="text"
                value={polymarketId}
                onChange={(e) => setPolymarketId(e.target.value)}
                placeholder="e.g., fed-decreases-interest-rates-by-50-bps"
                className="w-full px-4 py-3 rounded-lg bg-black/30 border border-white/10 text-white placeholder-white/40 focus:outline-none focus:border-primary"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-white/80 mb-2">
                Opinion Market ID
              </label>
              <input
                type="text"
                value={opinionId}
                onChange={(e) => setOpinionId(e.target.value)}
                placeholder="Enter Opinion market ID"
                className="w-full px-4 py-3 rounded-lg bg-black/30 border border-white/10 text-white placeholder-white/40 focus:outline-none focus:border-primary"
              />
            </div>
          </div>

          <button
            onClick={handleFetchMarkets}
            disabled={!polymarketId || !opinionId || isLoading}
            className="w-full py-3 rounded-lg bg-primary hover:bg-primary/80 disabled:bg-gray-500 disabled:cursor-not-allowed text-white font-medium transition-colors"
          >
            {isLoading ? "Fetching Market Info..." : "Fetch Market Info"}
          </button>

          {/* Fetched Market Display */}
          {fetchedMarket && (
            <div className="mt-6 p-5 rounded-lg bg-black/30 border border-white/10">
              <h3 className="text-xl font-semibold mb-4">Market Information</h3>
              
              <div className="space-y-4 mb-6">
                <div>
                  <div className="flex items-start gap-4 mb-3">
                    {fetchedMarket.polymarketInfo?.image && (
                      <img 
                        src={fetchedMarket.polymarketInfo.image} 
                        alt="Polymarket" 
                        className="w-16 h-16 rounded-lg object-cover"
                      />
                    )}
                    <div className="flex-1">
                      <h4 className="text-sm font-medium text-primary mb-2">Polymarket</h4>
                      <p className="text-white/80 mb-1">{fetchedMarket.polymarketInfo?.question}</p>
                    </div>
                  </div>
                  <div className="text-sm text-white/60 space-y-1">
                    {fetchedMarket.polymarketInfo?.endDate && (
                      <p className="text-white/70 mb-2">
                        <span className="font-semibold">End Date:</span> {new Date(fetchedMarket.polymarketInfo.endDate).toLocaleString()}
                      </p>
                    )}
                    <p className="font-mono break-all">YES Token ID: {fetchedMarket.polymarketInfo?.yesTokenId}</p>
                    <p className="font-mono break-all">NO Token ID: {fetchedMarket.polymarketInfo?.noTokenId}</p>
                  </div>
                </div>

                <div className="border-t border-white/10 pt-4">
                  <div className="flex items-start gap-4 mb-3">
                    {fetchedMarket.opinionInfo?.thumbnailUrl && (
                      <img 
                        src={fetchedMarket.opinionInfo.thumbnailUrl} 
                        alt="Opinion" 
                        className="w-16 h-16 rounded-lg object-cover"
                      />
                    )}
                    <div className="flex-1">
                      <h4 className="text-sm font-medium text-purple-400 mb-2">Opinion</h4>
                      <p className="text-white/80 mb-1">{fetchedMarket.opinionInfo?.question}</p>
                    </div>
                  </div>
                  <div className="text-sm text-white/60 space-y-1">
                    <p className="font-mono break-all">YES Token ID: {fetchedMarket.opinionInfo?.yesTokenId}</p>
                    <p className="font-mono break-all">NO Token ID: {fetchedMarket.opinionInfo?.noTokenId}</p>
                  </div>
                </div>
              </div>

              {/* Owner-only section */}
              {isOwner && (
                <>
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-white/80 mb-2">
                      Early Exit Amount Contract Address
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={earlyExitContractAddress}
                        onChange={(e) => setEarlyExitContractAddress(e.target.value)}
                        placeholder="0x..."
                        className="flex-1 px-4 py-3 rounded-lg bg-black/30 border border-white/10 text-white placeholder-white/40 focus:outline-none focus:border-primary"
                      />
                      <button
                        onClick={() => setShowCreateContract(!showCreateContract)}
                        className="px-6 py-3 rounded-lg bg-yellow-600 hover:bg-yellow-700 text-white font-medium transition-colors whitespace-nowrap"
                      >
                        {showCreateContract ? "Hide Create" : "Create New"}
                      </button>
                    </div>
                  </div>

                  {/* Create New Contract Form */}
                  {showCreateContract && (
                    <div className="mb-6 p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/30">
                      <h4 className="text-sm font-medium text-yellow-400 mb-4">Create New Early Exit Contract</h4>
                      <div className="grid grid-cols-3 gap-4 mb-4">
                        <div>
                          <label className="block text-xs font-medium text-white/80 mb-2">
                            Market Expiry Date & Time
                          </label>
                          <input
                            type="datetime-local"
                            value={newMarketExpiryDate}
                            onChange={(e) => setNewMarketExpiryDate(e.target.value)}
                            className="w-full px-3 py-2 rounded-lg bg-black/30 border border-white/10 text-white text-sm focus:outline-none focus:border-yellow-400"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-white/80 mb-2">
                            Expected APY (%)
                          </label>
                          <input
                            type="number"
                            step="0.01"
                            value={newExpectedAPY}
                            onChange={(e) => setNewExpectedAPY(e.target.value)}
                            placeholder="e.g., 5.00"
                            className="w-full px-3 py-2 rounded-lg bg-black/30 border border-white/10 text-white text-sm placeholder-white/40 focus:outline-none focus:border-yellow-400"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-white/80 mb-2">
                            Fixed Time After Expiry (hours)
                          </label>
                          <input
                            type="number"
                            step="0.1"
                            value={newFixedTimeHours}
                            onChange={(e) => setNewFixedTimeHours(e.target.value)}
                            placeholder="e.g., 24"
                            className="w-full px-3 py-2 rounded-lg bg-black/30 border border-white/10 text-white text-sm placeholder-white/40 focus:outline-none focus:border-yellow-400"
                          />
                        </div>
                      </div>
                      <button
                        onClick={handleCreateEarlyExitContract}
                        disabled={!newMarketExpiryDate || !newExpectedAPY || !newFixedTimeHours}
                        className="w-full py-3 rounded-lg bg-yellow-600 hover:bg-yellow-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-medium transition-colors"
                      >
                        Create Contract
                      </button>
                    </div>
                  )}

                  {/* Contract Parameters Display */}
                  {isValidEarlyExitAddress && (expectedAPY || fixedTimeAfterExpiry || marketExpiryTime) && (
                    <div className="mb-6 p-4 rounded-lg bg-purple-500/10 border border-purple-500/30">
                      <h4 className="text-sm font-medium text-purple-400 mb-3">Early Exit Contract Parameters</h4>
                      <div className="grid grid-cols-3 gap-4 text-sm text-white/80">
                        <div>
                          <p className="text-white/60 mb-1">Expected APY</p>
                          <p className="font-semibold text-purple-300">{formatAPY(expectedAPY)}</p>
                        </div>
                        <div>
                          <p className="text-white/60 mb-1">Fixed Time After Expiry</p>
                          <p className="font-semibold text-purple-300">{formatHours(fixedTimeAfterExpiry)}</p>
                        </div>
                        <div>
                          <p className="text-white/60 mb-1">Market Expiry Time</p>
                          <p className="font-semibold text-purple-300">{formatDateTime(marketExpiryTime)}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                  <div>
                    <button
                      onClick={handleAllowYesPolyNoOpinion}
                      disabled={yesPolyNoOpinionInfo?.isAllowed || !earlyExitContractAddress}
                      className={`w-full py-3 rounded-lg font-medium transition-colors ${
                        yesPolyNoOpinionInfo?.isAllowed || !earlyExitContractAddress
                          ? "bg-gray-600 cursor-not-allowed"
                          : "bg-green-600 hover:bg-green-700"
                      } text-white`}
                    >
                      {yesPolyNoOpinionInfo?.isAllowed ? "✓ Already Allowed" : "Allow YES Poly + NO Opinion"}
                    </button>
                    {yesPolyNoOpinionInfo?.isAllowed && (
                      <div className="mt-3 p-3 rounded-lg bg-green-500/10 border border-green-500/30 text-sm text-white/80 space-y-1">
                        <p className="text-green-400 font-medium mb-2">Pair Information:</p>
                        <p><span className="text-white/60">Is Allowed:</span> {yesPolyNoOpinionInfo.isAllowed ? "✅ Yes" : "❌ No"}</p>
                        <p><span className="text-white/60">Is Paused:</span> {yesPolyNoOpinionInfo.isPaused ? "⏸️ Yes" : "✅ No"}</p>
                        <p><span className="text-white/60">Early Exited Amount:</span> {formatEarlyExitedAmount(yesPolyNoOpinionInfo.earlyExitedAmount)}</p>
                        <p className="font-mono break-all text-xs"><span className="text-white/60">Exit Contract:</span> {yesPolyNoOpinionInfo.earlyExitAmountContract}</p>
                      </div>
                    )}
                  </div>
                  
                  {/* NO Poly + YES Opinion Button */}
                  <div>
                    <button
                      onClick={handleAllowNoPolyYesOpinion}
                      disabled={noPolyYesOpinionInfo?.isAllowed || !earlyExitContractAddress}
                      className={`w-full py-3 rounded-lg font-medium transition-colors ${
                        noPolyYesOpinionInfo?.isAllowed || !earlyExitContractAddress
                          ? "bg-gray-600 cursor-not-allowed"
                          : "bg-blue-600 hover:bg-blue-700"
                      } text-white`}
                    >
                      {noPolyYesOpinionInfo?.isAllowed ? "✓ Already Allowed" : "Allow NO Poly + YES Opinion"}
                    </button>
                    {noPolyYesOpinionInfo?.isAllowed && (
                      <div className="mt-3 p-3 rounded-lg bg-blue-500/10 border border-blue-500/30 text-sm text-white/80 space-y-1">
                        <p className="text-blue-400 font-medium mb-2">Pair Information:</p>
                        <p><span className="text-white/60">Is Allowed:</span> {noPolyYesOpinionInfo.isAllowed ? "✅ Yes" : "❌ No"}</p>
                        <p><span className="text-white/60">Is Paused:</span> {noPolyYesOpinionInfo.isPaused ? "⏸️ Yes" : "✅ No"}</p>
                        <p><span className="text-white/60">Early Exited Amount:</span> {formatEarlyExitedAmount(noPolyYesOpinionInfo.earlyExitedAmount)}</p>
                        <p className="font-mono break-all text-xs"><span className="text-white/60">Exit Contract:</span> {noPolyYesOpinionInfo.earlyExitAmountContract}</p>
                      </div>
                    )}
                  </div>
                </div>
              </>
              )}

              {/* Show status info for non-owners */}
              {!isOwner && (yesPolyNoOpinionInfo?.isAllowed || noPolyYesOpinionInfo?.isAllowed) && (
                <div className="space-y-4">
                  {yesPolyNoOpinionInfo?.isAllowed && (
                    <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/30 text-sm text-white/80 space-y-1">
                      <p className="text-green-400 font-medium mb-2">YES Poly + NO Opinion - Pair Information:</p>
                      <p><span className="text-white/60">Is Allowed:</span> {yesPolyNoOpinionInfo.isAllowed ? "✅ Yes" : "❌ No"}</p>
                      <p><span className="text-white/60">Is Paused:</span> {yesPolyNoOpinionInfo.isPaused ? "⏸️ Yes" : "✅ No"}</p>
                      <p><span className="text-white/60">Early Exited Amount:</span> {formatEarlyExitedAmount(yesPolyNoOpinionInfo.earlyExitedAmount)}</p>
                      <p className="font-mono break-all text-xs"><span className="text-white/60">Exit Contract:</span> {yesPolyNoOpinionInfo.earlyExitAmountContract}</p>
                    </div>
                  )}
                  
                  {noPolyYesOpinionInfo?.isAllowed && (
                    <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/30 text-sm text-white/80 space-y-1">
                      <p className="text-blue-400 font-medium mb-2">NO Poly + YES Opinion - Pair Information:</p>
                      <p><span className="text-white/60">Is Allowed:</span> {noPolyYesOpinionInfo.isAllowed ? "✅ Yes" : "❌ No"}</p>
                      <p><span className="text-white/60">Is Paused:</span> {noPolyYesOpinionInfo.isPaused ? "⏸️ Yes" : "✅ No"}</p>
                      <p><span className="text-white/60">Early Exited Amount:</span> {formatEarlyExitedAmount(noPolyYesOpinionInfo.earlyExitedAmount)}</p>
                      <p className="font-mono break-all text-xs"><span className="text-white/60">Exit Contract:</span> {noPolyYesOpinionInfo.earlyExitAmountContract}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ManageMarketsPage;
