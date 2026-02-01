import { useState, type FunctionComponent } from "react";
import { useReadContract, useWriteContract, useAccount } from "wagmi";
import { useParams, useNavigate } from "react-router-dom";
import { keccak256, encodePacked, isAddress, encodeFunctionData } from "viem";
import type { Address } from "viem";
import { bsc } from "wagmi/chains";
import EarlyExitVaultABI from "../abi/EarlyExitVault.json";
import EarlyExitAmountBasedOnFixedAPYConfigurableABI from "../abi/EarlyExitAmountBasedOnFixedAPYConfigurable.json";
import EarlyExitAmountFactoryBasedOnFixedAPYConfigurableABI from "../abi/EarlyExitAmountFactoryBasedOnFixedAPYConfigurableABI.json";
import { providerRegistry } from "../services/providers";
import ProviderPairSelector from "../components/ProviderPairSelector";
import { generateProviderPairs } from "../utils/providerPairs";
import { fetchProviderMarket, type ProviderMarketInfo } from "../utils/providerMarketFetch";
import {
  VAULT_ADDRESS,
  EARLY_EXIT_FACTORY_ADDRESS,
} from "../config/addresses";
import { useAtomicBatch } from "../hooks/useAtomicBatch";
import BatchExecutor from "../components/BatchExecutor";

interface OppositeOutcomeTokensInfo {
  isAllowed: boolean;
  isPaused: boolean;
  decimalsA: number;
  decimalsB: number;
  earlyExitAmountContract: string;
  earlyExitedAmount: bigint;
}

interface MarketInputData {
  provider1Id: string;
  provider2Id: string;
  provider1Info?: ProviderMarketInfo;
  provider2Info?: ProviderMarketInfo;
}

const ManageMarketsPage: FunctionComponent = () => {
  const { providerPair: urlProviderPair } = useParams<{ providerPair?: string }>();
  const navigate = useNavigate();
  
  // Get all available provider pairs
  const availablePairs = generateProviderPairs();
  const defaultPair = availablePairs[0]?.id || '';
  
  // Use URL param or default to first pair
  const selectedProviderPair = urlProviderPair && availablePairs.some(p => p.id === urlProviderPair)
    ? urlProviderPair
    : defaultPair;
  
  // Handle provider pair change
  const handleProviderPairChange = (pairId: string) => {
    navigate(`/manage-markets/${pairId}`);
  };
  
  // Parse selected provider pair to get individual providers
  const [provider1Id, provider2Id] = selectedProviderPair.split('-');
  const provider1 = providerRegistry.getById(provider1Id);
  const provider2 = providerRegistry.getById(provider2Id);
  
  const [inputValue1, setInputValue1] = useState("");
  const [inputValue2, setInputValue2] = useState("");
  const [fetchedMarket, setFetchedMarket] = useState<MarketInputData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [earlyExitContractAddress, setEarlyExitContractAddress] = useState("");
  const [showCreateContract, setShowCreateContract] = useState(false);
  
  // Factory contract creation inputs
  const [newMarketExpiryDate, setNewMarketExpiryDate] = useState("");
  const [newExpectedAPY, setNewExpectedAPY] = useState("");
  const [newFixedTimeHours, setNewFixedTimeHours] = useState("");

  const { address } = useAccount();
  const { writeContract } = useWriteContract();

  // Atomic batching support
  const {
    isAtomicBatchingSupported,
    batchCalls,
    addCall,
    removeCall,
    clearCalls,
  } = useAtomicBatch(bsc.id);

  // Handler for selecting a child market (for providers that support it)
  const handleSelectChildMarket = (providerKey: 'provider1Info' | 'provider2Info', childMarketId: number) => {
    if (!fetchedMarket) return;
    
    const providerInfo = fetchedMarket[providerKey];
    if (!providerInfo?.childMarkets) return;
    
    const selectedChild = providerInfo.childMarkets.find(
      (child) => child.marketId === childMarketId
    );
    
    if (!selectedChild) return;
    
    // Combine parent title + child title for the question
    const combinedQuestion = `${providerInfo.question} - ${selectedChild.marketTitle}`;
    
    // Use parent thumbnail if this is a categorical market
    const thumbnailToUse = providerInfo.parentThumbnailUrl || providerInfo.thumbnailUrl;
    
    setFetchedMarket({
      ...fetchedMarket,
      [providerKey]: {
        ...providerInfo,
        question: combinedQuestion,
        yesTokenId: selectedChild.yesTokenId,
        noTokenId: selectedChild.noTokenId,
        thumbnailUrl: thumbnailToUse,
        selectedChildMarketId: childMarketId,
      },
    });
  };

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
    abi: EarlyExitAmountBasedOnFixedAPYConfigurableABI,
    functionName: "expectedApy",
    query: {
      enabled: !!isValidEarlyExitAddress,
    },
    chainId: bsc.id,
  }) as { data: bigint | undefined };

  const { data: fixedTimeAfterExpiry } = useReadContract({
    address: isValidEarlyExitAddress ? (earlyExitContractAddress as `0x${string}`) : undefined,
    abi: EarlyExitAmountBasedOnFixedAPYConfigurableABI,
    functionName: "fixedTimeAfterExpiry",
    query: {
      enabled: !!isValidEarlyExitAddress,
    },
    chainId: bsc.id,
  }) as { data: bigint | undefined };

  const { data: marketExpiryTime } = useReadContract({
    address: isValidEarlyExitAddress ? (earlyExitContractAddress as `0x${string}`) : undefined,
    abi: EarlyExitAmountBasedOnFixedAPYConfigurableABI,
    functionName: "marketExpiryTime",
    query: {
      enabled: !!isValidEarlyExitAddress,
    },
    chainId: bsc.id,
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

  // Calculate hash for YES Provider1 + NO Provider2 pair
  const yesP1NoP2Hash = fetchedMarket?.provider1Info?.yesTokenId && fetchedMarket?.provider2Info?.noTokenId && provider1 && provider2
    ? (() => {
        const [[addr1, id1], [addr2, id2]] = getSortedTokenPair(
          provider1.erc1155Address,
          fetchedMarket.provider1Info.yesTokenId,
          provider2.erc1155Address,
          fetchedMarket.provider2Info.noTokenId
        );
        return keccak256(
          encodePacked(
            ["address", "uint256", "address", "uint256"],
            [addr1 as `0x${string}`, id1, addr2 as `0x${string}`, id2]
          )
        );
      })()
    : undefined;

  // Calculate hash for NO Provider1 + YES Provider2 pair
  const noP1YesP2Hash = fetchedMarket?.provider1Info?.noTokenId && fetchedMarket?.provider2Info?.yesTokenId && provider1 && provider2
    ? (() => {
        const [[addr1, id1], [addr2, id2]] = getSortedTokenPair(
          provider1.erc1155Address,
          fetchedMarket.provider1Info.noTokenId,
          provider2.erc1155Address,
          fetchedMarket.provider2Info.yesTokenId
        );
        return keccak256(
          encodePacked(
            ["address", "uint256", "address", "uint256"],
            [addr1 as `0x${string}`, id1, addr2 as `0x${string}`, id2]
          )
        );
      })()
    : undefined;

  // Read contract data for YES P1 + NO P2
  const { data: yesP1NoP2RawData } = useReadContract({
    address: VAULT_ADDRESS,
    abi: EarlyExitVaultABI,
    functionName: "allowedOppositeOutcomeTokensInfo",
    args: yesP1NoP2Hash ? [yesP1NoP2Hash] : undefined,
    query: {
      enabled: !!yesP1NoP2Hash,
    },
  }) as { data: readonly [boolean, boolean, number, number, string, bigint] | undefined };

  // Map array response to structured object
  const yesP1NoP2Info: OppositeOutcomeTokensInfo | undefined = yesP1NoP2RawData
    ? {
        isAllowed: yesP1NoP2RawData[0],
        isPaused: yesP1NoP2RawData[1],
        decimalsA: yesP1NoP2RawData[2],
        decimalsB: yesP1NoP2RawData[3],
        earlyExitAmountContract: yesP1NoP2RawData[4],
        earlyExitedAmount: yesP1NoP2RawData[5],
      }
    : undefined;

  // Read contract data for NO P1 + YES P2
  const { data: noP1YesP2RawData } = useReadContract({
    address: VAULT_ADDRESS,
    abi: EarlyExitVaultABI,
    functionName: "allowedOppositeOutcomeTokensInfo",
    args: noP1YesP2Hash ? [noP1YesP2Hash] : undefined,
    query: {
      enabled: !!noP1YesP2Hash,
    },
  }) as { data: readonly [boolean, boolean, number, number, string, bigint] | undefined };

  // Map array response to structured object
  const noP1YesP2Info: OppositeOutcomeTokensInfo | undefined = noP1YesP2RawData
    ? {
        isAllowed: noP1YesP2RawData[0],
        isPaused: noP1YesP2RawData[1],
        decimalsA: noP1YesP2RawData[2],
        decimalsB: noP1YesP2RawData[3],
        earlyExitAmountContract: noP1YesP2RawData[4],
        earlyExitedAmount: noP1YesP2RawData[5],
      }
    : undefined;

  const handleFetchMarkets = async () => {
    if (!inputValue1 || !inputValue2 || !provider1 || !provider2) {
      return;
    }

    setIsLoading(true);
    try {
      const [provider1Info, provider2Info] = await Promise.all([
        fetchProviderMarket(provider1, inputValue1),
        fetchProviderMarket(provider2, inputValue2),
      ]);

      if (!provider1Info || !provider2Info) {
        throw new Error("Failed to fetch market data");
      }

      setFetchedMarket({
        provider1Id: provider1.id,
        provider2Id: provider2.id,
        provider1Info,
        provider2Info,
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

    const args = [marketExpiryTimestamp, expectedAPYBasisPoints, fixedTimeSeconds];

    if (isAtomicBatchingSupported) {
      const data = encodeFunctionData({
        abi: EarlyExitAmountFactoryBasedOnFixedAPYConfigurableABI,
        functionName: "createEarlyExitAmountConfigurableContract",
        args,
      });
      
      addCall({
        to: EARLY_EXIT_FACTORY_ADDRESS as Address,
        data: data as `0x${string}`,
        description: `Create Early Exit Contract (APY: ${newExpectedAPY}%)`,
      });
    } else {
      writeContract({
        address: EARLY_EXIT_FACTORY_ADDRESS,
        abi: EarlyExitAmountFactoryBasedOnFixedAPYConfigurableABI,
        functionName: "createEarlyExitAmountConfigurableContract",
        args,
      });
    }
  };

  const handleAllowYesP1NoP2 = () => {
    if (!fetchedMarket || !earlyExitContractAddress || !provider1 || !provider2) return;
    
    const [[addr1, id1], [addr2, id2]] = getSortedTokenPair(
      provider1.erc1155Address,
      fetchedMarket.provider1Info!.yesTokenId,
      provider2.erc1155Address,
      fetchedMarket.provider2Info!.noTokenId
    );

    // Determine decimals based on which token is first after sorting
    const decimals1 = addr1.toLowerCase() === provider1.erc1155Address.toLowerCase() ? provider1.decimals : provider2.decimals;
    const decimals2 = addr2.toLowerCase() === provider1.erc1155Address.toLowerCase() ? provider1.decimals : provider2.decimals;

    const args = [
      addr1,
      decimals1,
      id1,
      addr2,
      decimals2,
      id2,
      earlyExitContractAddress as `0x${string}`,
    ];

    if (isAtomicBatchingSupported) {
      const data = encodeFunctionData({
        abi: EarlyExitVaultABI,
        functionName: "addAllowedOppositeOutcomeTokens",
        args,
      });
      
      addCall({
        to: VAULT_ADDRESS as Address,
        data: data as `0x${string}`,
        description: `Allow YES ${provider1.name} + NO ${provider2.name}`,
      });
    } else {
      writeContract({
        address: VAULT_ADDRESS,
        abi: EarlyExitVaultABI,
        functionName: "addAllowedOppositeOutcomeTokens",
        args,
      });
    }
  };

  const handleAllowNoP1YesP2 = () => {
    if (!fetchedMarket || !earlyExitContractAddress || !provider1 || !provider2) return;
    
    const [[addr1, id1], [addr2, id2]] = getSortedTokenPair(
      provider1.erc1155Address,
      fetchedMarket.provider1Info!.noTokenId,
      provider2.erc1155Address,
      fetchedMarket.provider2Info!.yesTokenId
    );

    // Determine decimals based on which token is first after sorting
    const decimals1 = addr1.toLowerCase() === provider1.erc1155Address.toLowerCase() ? provider1.decimals : provider2.decimals;
    const decimals2 = addr2.toLowerCase() === provider1.erc1155Address.toLowerCase() ? provider1.decimals : provider2.decimals;

    const args = [
      addr1,
      decimals1,
      id1,
      addr2,
      decimals2,
      id2,
      earlyExitContractAddress as `0x${string}`,
    ];

    if (isAtomicBatchingSupported) {
      const data = encodeFunctionData({
        abi: EarlyExitVaultABI,
        functionName: "addAllowedOppositeOutcomeTokens",
        args,
      });
      
      addCall({
        to: VAULT_ADDRESS as Address,
        data: data as `0x${string}`,
        description: `Allow NO ${provider1.name} + YES ${provider2.name}`,
      });
    } else {
      writeContract({
        address: VAULT_ADDRESS,
        abi: EarlyExitVaultABI,
        functionName: "addAllowedOppositeOutcomeTokens",
        args,
      });
    }
  };

  return (
    <div className="mx-30 mb-10">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mt-6 sm:mt-8 md:mt-10">
        <div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-League-Spartan">Manage Markets</h1>
          <p className="text-gray-400 mt-2 max-w-lg">
            Add new market pairs or view existing supported markets for early exit arbitrage.
          </p>
        </div>
        <ProviderPairSelector 
          selectedPair={selectedProviderPair}
          onPairChange={handleProviderPairChange}
        />
      </div>

      <div className="mt-6 sm:mt-8 md:mt-10 p-4 sm:p-5 md:p-6 gradiant-border">
        <div className="box-of-gradiant-border">
          <h2 className="text-xl sm:text-2xl font-semibold mb-4 sm:mb-6">Add Market Pair</h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-white/80 mb-2">
                {provider1?.name || 'Provider 1'} {provider1?.inputType === 'slug' ? 'Market Slug' : 'Market ID'}
              </label>
              <input
                type="text"
                value={inputValue1}
                onChange={(e) => setInputValue1(e.target.value)}
                placeholder={provider1?.inputPlaceholder || 'Enter market identifier'}
                className="w-full px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg bg-black/30 border border-white/10 text-white placeholder-white/40 focus:outline-none focus:border-primary"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-white/80 mb-2">
                {provider2?.name || 'Provider 2'} {provider2?.inputType === 'slug' ? 'Market Slug' : 'Market ID'}
              </label>
              <input
                type="text"
                value={inputValue2}
                onChange={(e) => setInputValue2(e.target.value)}
                placeholder={provider2?.inputPlaceholder || 'Enter market identifier'}
                className="w-full px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg bg-black/30 border border-white/10 text-white placeholder-white/40 focus:outline-none focus:border-primary"
              />
            </div>
          </div>

          <button
            onClick={handleFetchMarkets}
            disabled={!inputValue1 || !inputValue2 || isLoading}
            className="w-full py-3 rounded-lg bg-primary hover:bg-primary/80 disabled:bg-gray-500 disabled:cursor-not-allowed text-white font-medium transition-colors"
          >
            {isLoading ? "Fetching Market Info..." : "Fetch Market Info"}
          </button>

          {/* Fetched Market Display */}
          {fetchedMarket && (
            <div className="mt-6 p-5 rounded-lg bg-black/30 border border-white/10">
              <h3 className="text-lg sm:text-xl font-semibold mb-4">Market Information</h3>
              
              <div className="space-y-4 mb-6">
                {/* Provider 1 Market Info */}
                <div>
                  <div className="flex items-start gap-4 mb-3">
                    {fetchedMarket.provider1Info?.thumbnailUrl && (
                      <img 
                        src={fetchedMarket.provider1Info.thumbnailUrl} 
                        alt={provider1?.name} 
                        className="w-16 h-16 rounded-lg object-cover"
                      />
                    )}
                    <div className="flex-1">
                      <h4 className="text-sm font-medium text-primary mb-2">{provider1?.name || 'Provider 1'}</h4>
                      <p className="text-white/80 mb-1">{fetchedMarket.provider1Info?.question}</p>
                    </div>
                  </div>
                  <div className="text-sm text-white/60 space-y-1">
                    <p className="font-mono break-all">YES Token ID: {fetchedMarket.provider1Info?.yesTokenId}</p>
                    <p className="font-mono break-all">NO Token ID: {fetchedMarket.provider1Info?.noTokenId}</p>
                  </div>

                  {/* Child Markets Selection for Provider 1 */}
                  {provider1?.supportsChildMarkets && fetchedMarket.provider1Info?.childMarkets && fetchedMarket.provider1Info.childMarkets.length > 0 && !fetchedMarket.provider1Info.selectedChildMarketId && (
                    <div className="mt-4 p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/30">
                      <p className="text-yellow-400 text-sm font-medium mb-3">
                        ⚠️ This is a categorical market. Please select a submarket:
                      </p>
                      <div className="space-y-2 max-h-60 overflow-y-auto">
                        {fetchedMarket.provider1Info.childMarkets.map((child) => (
                          <button
                            key={child.marketId}
                            onClick={() => handleSelectChildMarket('provider1Info', child.marketId)}
                            className="w-full text-left px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg bg-black/30 hover:bg-black/50 border border-white/10 hover:border-primary/50 transition-all"
                          >
                            <div className="flex justify-between items-start">
                              <div className="flex-1">
                                <p className="text-white font-medium">{child.marketTitle}</p>
                                <p className="text-xs text-white/50 mt-1">Market ID: {child.marketId}</p>
                              </div>
                              <span className="text-xs px-2 py-1 rounded bg-green-500/20 text-green-400">
                                {child.status === 2 ? 'Active' : 'Created'}
                              </span>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {provider1?.supportsChildMarkets && fetchedMarket.provider1Info?.selectedChildMarketId && (
                    <div className="mt-3 p-2 rounded bg-green-500/10 border border-green-500/30">
                      <p className="text-green-400 text-xs">✓ Submarket selected (ID: {fetchedMarket.provider1Info.selectedChildMarketId})</p>
                    </div>
                  )}
                </div>

                {/* Provider 2 Market Info */}
                <div className="border-t border-white/10 pt-4">
                  <div className="flex items-start gap-4 mb-3">
                    {fetchedMarket.provider2Info?.thumbnailUrl && (
                      <img 
                        src={fetchedMarket.provider2Info.thumbnailUrl} 
                        alt={provider2?.name} 
                        className="w-16 h-16 rounded-lg object-cover"
                      />
                    )}
                    <div className="flex-1">
                      <h4 className="text-sm font-medium text-purple-400 mb-2">{provider2?.name || 'Provider 2'}</h4>
                      <p className="text-white/80 mb-1">{fetchedMarket.provider2Info?.question}</p>
                    </div>
                  </div>

                  {/* Child Markets Selection for Provider 2 */}
                  {provider2?.supportsChildMarkets && fetchedMarket.provider2Info?.childMarkets && fetchedMarket.provider2Info.childMarkets.length > 0 && !fetchedMarket.provider2Info.selectedChildMarketId && (
                    <div className="mb-4 p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/30">
                      <p className="text-yellow-400 text-sm font-medium mb-3">
                        ⚠️ This is a categorical market. Please select a submarket:
                      </p>
                      <div className="space-y-2 max-h-60 overflow-y-auto">
                        {fetchedMarket.provider2Info.childMarkets.map((child) => (
                          <button
                            key={child.marketId}
                            onClick={() => handleSelectChildMarket('provider2Info', child.marketId)}
                            className="w-full text-left px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg bg-black/30 hover:bg-black/50 border border-white/10 hover:border-primary/50 transition-all"
                          >
                            <div className="flex justify-between items-start">
                              <div className="flex-1">
                                <p className="text-white font-medium">{child.marketTitle}</p>
                                <p className="text-xs text-white/50 mt-1">Market ID: {child.marketId}</p>
                              </div>
                              <span className="text-xs px-2 py-1 rounded bg-green-500/20 text-green-400">
                                {child.status === 2 ? 'Active' : 'Created'}
                              </span>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {provider2?.supportsChildMarkets && fetchedMarket.provider2Info?.selectedChildMarketId && (
                    <div className="mb-3 p-2 rounded bg-green-500/10 border border-green-500/30">
                      <p className="text-green-400 text-xs">✓ Submarket selected (ID: {fetchedMarket.provider2Info.selectedChildMarketId})</p>
                    </div>
                  )}

                  <div className="text-sm text-white/60 space-y-1">
                    <p className="font-mono break-all">YES Token ID: {fetchedMarket.provider2Info?.yesTokenId}</p>
                    <p className="font-mono break-all">NO Token ID: {fetchedMarket.provider2Info?.noTokenId}</p>
                  </div>
                </div>
              </div>

             
              {(
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
                        className="flex-1 px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg bg-black/30 border border-white/10 text-white placeholder-white/40 focus:outline-none focus:border-primary"
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

                  {/* Action Buttons */}
                  {/* Helper function for checking if child market needs selection */}
                  {(() => {
                    const needsChildMarketSelection = (providerInfo: ProviderMarketInfo | undefined, provider: typeof provider1 | typeof provider2) => {
                      return provider?.supportsChildMarkets && providerInfo?.childMarkets && providerInfo.childMarkets.length > 0 && !providerInfo.selectedChildMarketId;
                    };

                    const p1NeedsSelection = needsChildMarketSelection(fetchedMarket.provider1Info, provider1);
                    const p2NeedsSelection = needsChildMarketSelection(fetchedMarket.provider2Info, provider2);
                    const anyNeedsSelection = p1NeedsSelection || p2NeedsSelection;

                    return (
                      <>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          {/* YES Provider1 + NO Provider2 Button */}
                          <div>
                            <button
                              onClick={handleAllowYesP1NoP2}
                              disabled={yesP1NoP2Info?.isAllowed || !earlyExitContractAddress || anyNeedsSelection}
                              className={`w-full py-3 rounded-lg font-medium transition-colors ${
                                yesP1NoP2Info?.isAllowed || !earlyExitContractAddress || anyNeedsSelection
                                  ? "bg-gray-600 cursor-not-allowed"
                                  : "bg-green-600 hover:bg-green-700"
                              } text-white`}
                            >
                              {!isOwner ? "Not Allowed if you are not the owner" : (yesP1NoP2Info?.isAllowed ? "✓ Already Allowed" : anyNeedsSelection ? "Select submarket first" : `Allow YES ${provider1?.name} + NO ${provider2?.name}`)}
                            </button>
                            {yesP1NoP2Info?.isAllowed && (
                              <div className="mt-3 p-3 rounded-lg bg-green-500/10 border border-green-500/30 text-sm text-white/80 space-y-1">
                                <p className="text-green-400 font-medium mb-2">Pair Information:</p>
                                <p><span className="text-white/60">Is Allowed:</span> {yesP1NoP2Info.isAllowed ? "✅ Yes" : "❌ No"}</p>
                                <p><span className="text-white/60">Is Paused:</span> {yesP1NoP2Info.isPaused ? "⏸️ Yes" : "✅ No"}</p>
                                <p><span className="text-white/60">Early Exited Amount:</span> {formatEarlyExitedAmount(yesP1NoP2Info.earlyExitedAmount)}</p>
                                <p className="font-mono break-all text-xs"><span className="text-white/60">Exit Contract:</span> {yesP1NoP2Info.earlyExitAmountContract}</p>
                              </div>
                            )}
                          </div>
                          
                          {/* NO Provider1 + YES Provider2 Button */}
                          <div>
                            <button
                              onClick={handleAllowNoP1YesP2}
                              disabled={noP1YesP2Info?.isAllowed || !earlyExitContractAddress || anyNeedsSelection}
                              className={`w-full py-3 rounded-lg font-medium transition-colors ${
                                noP1YesP2Info?.isAllowed || !earlyExitContractAddress || anyNeedsSelection
                                  ? "bg-gray-600 cursor-not-allowed"
                                  : "bg-blue-600 hover:bg-blue-700"
                              } text-white`}
                            >
                              {!isOwner ? "Not Allowed if you are not the owner" : (noP1YesP2Info?.isAllowed ? "✓ Already Allowed" : anyNeedsSelection ? "Select submarket first" : `Allow NO ${provider1?.name} + YES ${provider2?.name}`)}
                            </button>
                            {noP1YesP2Info?.isAllowed && (
                              <div className="mt-3 p-3 rounded-lg bg-blue-500/10 border border-blue-500/30 text-sm text-white/80 space-y-1">
                                <p className="text-blue-400 font-medium mb-2">Pair Information:</p>
                                <p><span className="text-white/60">Is Allowed:</span> {noP1YesP2Info.isAllowed ? "✅ Yes" : "❌ No"}</p>
                                <p><span className="text-white/60">Is Paused:</span> {noP1YesP2Info.isPaused ? "⏸️ Yes" : "✅ No"}</p>
                                <p><span className="text-white/60">Early Exited Amount:</span> {formatEarlyExitedAmount(noP1YesP2Info.earlyExitedAmount)}</p>
                                <p className="font-mono break-all text-xs"><span className="text-white/60">Exit Contract:</span> {noP1YesP2Info.earlyExitAmountContract}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      </>
                    );
                  })()}
                </>
              )}

              {(yesP1NoP2Info?.isAllowed || noP1YesP2Info?.isAllowed) && (
                <div className="space-y-4">
                  {yesP1NoP2Info?.isAllowed && (
                    <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/30 text-sm text-white/80 space-y-1">
                      <p className="text-green-400 font-medium mb-2">YES {provider1?.name} + NO {provider2?.name} - Pair Information:</p>
                      <p><span className="text-white/60">Is Allowed:</span> {yesP1NoP2Info.isAllowed ? "✅ Yes" : "❌ No"}</p>
                      <p><span className="text-white/60">Is Paused:</span> {yesP1NoP2Info.isPaused ? "⏸️ Yes" : "✅ No"}</p>
                      <p><span className="text-white/60">Early Exited Amount:</span> {formatEarlyExitedAmount(yesP1NoP2Info.earlyExitedAmount)}</p>
                      <p className="font-mono break-all text-xs"><span className="text-white/60">Exit Contract:</span> {yesP1NoP2Info.earlyExitAmountContract}</p>
                    </div>
                  )}
                  
                  {noP1YesP2Info?.isAllowed && (
                    <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/30 text-sm text-white/80 space-y-1">
                      <p className="text-blue-400 font-medium mb-2">NO {provider1?.name} + YES {provider2?.name} - Pair Information:</p>
                      <p><span className="text-white/60">Is Allowed:</span> {noP1YesP2Info.isAllowed ? "✅ Yes" : "❌ No"}</p>
                      <p><span className="text-white/60">Is Paused:</span> {noP1YesP2Info.isPaused ? "⏸️ Yes" : "✅ No"}</p>
                      <p><span className="text-white/60">Early Exited Amount:</span> {formatEarlyExitedAmount(noP1YesP2Info.earlyExitedAmount)}</p>
                      <p className="font-mono break-all text-xs"><span className="text-white/60">Exit Contract:</span> {noP1YesP2Info.earlyExitAmountContract}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Batch Executor - shown when batching is supported and there are calls */}
      {isAtomicBatchingSupported && (
        <BatchExecutor
          batchCalls={batchCalls}
          onRemoveCall={removeCall}
          onClearCalls={clearCalls}
          chainId={bsc.id}
        />
      )}
    </div>
  );
};

export default ManageMarketsPage;
