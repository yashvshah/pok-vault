import { useState, type FunctionComponent } from "react";
import { useAccount, useWriteContract, useChainId, useSwitchChain } from "wagmi";
import { polygon, bsc } from "wagmi/chains";
import { parseUnits, erc1155Abi, formatUnits } from "viem";
import { POLYGON_ERC1155_POLYGON_ADDRESS, POLYGON_ERC1155_BRIDGED_BSC_ADDRESS, OPINION_ERC1155_ADDRESS, POLYMARKET_SOURCE_BRIDGE_POLYGON_ADDRESS, POLYMARKET_DECIMALS } from "../config/addresses";
import { useErc1155Balance } from "../hooks/useErc1155Balance";
import MarketCard from "../components/MarketCard";
import MarketActionCard from "../components/MarketActionCard";
import BalanceItem from "../components/BalanceItem";
import MarketFilters, { type MarketFilterState } from "../components/MarketFilters";
import { useSupportedMarkets, type MarketStatus, type SupportedMarket } from "../hooks/useSupportedMarkets";


interface MarketsPageProps {}


function TokenBalances({ market }: { market: SupportedMarket }) {
  const { address } = useAccount();
  const { writeContract } = useWriteContract();
  const currentChainId = useChainId();
  const { switchChain } = useSwitchChain();
  const yesIdPoly = market.polymarketYesTokenId ? BigInt(market.polymarketYesTokenId) : 0n;
  const noIdPoly = market.polymarketNoTokenId ? BigInt(market.polymarketNoTokenId) : 0n;
  const yesIdOpinion = market.opinionYesTokenId ? BigInt(market.opinionYesTokenId) : 0n;
  const noIdOpinion = market.opinionNoTokenId ? BigInt(market.opinionNoTokenId) : 0n;

  const { data: balPolyYes } = useErc1155Balance({ tokenAddress: POLYGON_ERC1155_POLYGON_ADDRESS, tokenId: yesIdPoly, chainId: polygon.id });
  const { data: balPolyNo } = useErc1155Balance({ tokenAddress: POLYGON_ERC1155_POLYGON_ADDRESS, tokenId: noIdPoly, chainId: polygon.id });
  const { data: balOpinionYes } = useErc1155Balance({ tokenAddress: OPINION_ERC1155_ADDRESS, tokenId: yesIdOpinion, chainId: bsc.id });
  const { data: balOpinionNo } = useErc1155Balance({ tokenAddress: OPINION_ERC1155_ADDRESS, tokenId: noIdOpinion, chainId: bsc.id });
  const { data: balBridgedYes } = useErc1155Balance({ tokenAddress: POLYGON_ERC1155_BRIDGED_BSC_ADDRESS, tokenId: yesIdPoly, chainId: bsc.id });
  const { data: balBridgedNo } = useErc1155Balance({ tokenAddress: POLYGON_ERC1155_BRIDGED_BSC_ADDRESS, tokenId: noIdPoly, chainId: bsc.id });

  const [bridgeYesAmt, setBridgeYesAmt] = useState('0');
  const [bridgeNoAmt, setBridgeNoAmt] = useState('0');


  const onBridge = async (id: bigint, amtStr: string) => {
    if (!address) return;
    const value = parseUnits(amtStr || '0', POLYMARKET_DECIMALS);
    await writeContract({
      abi: erc1155Abi,
      address: POLYGON_ERC1155_POLYGON_ADDRESS,
      functionName: 'safeTransferFrom',
      args: [address, POLYMARKET_SOURCE_BRIDGE_POLYGON_ADDRESS, id, value, '0x'],
      chainId: polygon.id,
    });
  };

  return (
    <div className="text-xs text-white/80 space-y-3 mt-2">
      <div className="grid grid-cols-2 gap-3">
        <BalanceItem
          title="Polymarket YES (Polygon)"
          balance={formatUnits(balPolyYes ?? 0n, POLYMARKET_DECIMALS).toString()}
          action={(
            <div className="flex gap-2">
              <input className="w-24 rounded bg-black/40 px-2 py-1 text-white/80 border border-white/10" value={bridgeYesAmt} onChange={e => setBridgeYesAmt(e.target.value)} placeholder="amt" />
              <button className="rounded bg-primary/20 px-2 py-1 border border-primary/40" onClick={() => (currentChainId === polygon.id ? onBridge(yesIdPoly, bridgeYesAmt) : switchChain({ chainId: polygon.id }))} disabled={!address}>
                {currentChainId === polygon.id ? 'Bridge' : 'Switch chain to bridge'}
              </button>
            </div>
          )}
        />
        <BalanceItem
          title="Polymarket NO (Polygon)"
          balance={formatUnits(balPolyNo ?? 0n, POLYMARKET_DECIMALS).toString()}
          action={(
            <div className="flex gap-2">
              <input className="w-24 rounded bg-black/40 px-2 py-1 text-white/80 border border-white/10" value={bridgeNoAmt} onChange={e => setBridgeNoAmt(e.target.value)} placeholder="amt" />
              <button className="rounded bg-primary/20 px-2 py-1 border border-primary/40" onClick={() => (currentChainId === polygon.id ? onBridge(noIdPoly, bridgeNoAmt) : switchChain({ chainId: polygon.id }))} disabled={!address}>
                {currentChainId === polygon.id ? 'Bridge' : 'Switch chain to bridge'}
              </button>
            </div>
          )}
        />
        <BalanceItem title="Opinion YES (BSC)" balance={formatUnits(balOpinionYes ?? 0n, POLYMARKET_DECIMALS)} />
        <BalanceItem title="Opinion NO (BSC)" balance={formatUnits(balOpinionNo ?? 0n, POLYMARKET_DECIMALS)} />
        <BalanceItem title="Bridged Poly YES (BSC)" balance={formatUnits(balBridgedYes ?? 0n, POLYMARKET_DECIMALS)} />
        <BalanceItem title="Bridged Poly NO (BSC)" balance={formatUnits(balBridgedNo ?? 0n, POLYMARKET_DECIMALS)} />
        <BalanceItem title="Poly YES Pending Bridge" balance={"—"} action={<button className="rounded bg-white/10 px-2 py-1 border border-white/20">Complete Bridge</button>} />
        <BalanceItem title="Poly NO Pending Bridge" balance={"—"} action={<button className="rounded bg-white/10 px-2 py-1 border border-white/20">Complete Bridge</button>} />
      </div>
      <div className="text-white/50">Note: Bridging requires calling bridge function and then calling complete bridge to pay gas fees</div>
    </div>
  );
}

const MarketsPage: FunctionComponent<MarketsPageProps> = () => {
  const [amount, setAmount] = useState("0.00");
  const [filters, setFilters] = useState<MarketFilterState>({
    search: "",
    status: "All",
    markets: ["Polymarket", "Opinion"],
  });
  const { data: markets = [], isLoading, error } = useSupportedMarkets();

  // Apply filters to markets
  const filteredMarkets = markets.filter(market => {
    // Search filter
    if (filters.search && !market.question.toLowerCase().includes(filters.search.toLowerCase())) {
      return false;
    }
    
    // Status filter
    if (filters.status !== "All" && market.overallStatus !== filters.status.toLowerCase()) {
      return false;
    }
    
    return true;
  });

  const getStatusColor = (status: MarketStatus) => {
    switch (status) {
      case 'allowed':
        return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'paused':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'removed':
        return 'bg-red-500/20 text-red-400 border-red-500/30';
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  const getStatusText = (status: MarketStatus) => {
    switch (status) {
      case 'allowed':
        return '✅ Active';
      case 'paused':
        return '⏸️ Paused';
      case 'removed':
        return '🔴 Expired';
      default:
        return status;
    }
  };

  if (isLoading) {
    return (
      <div className="mx-30 mb-10">
        <h1 className="text-5xl font-League-Spartan mt-10">Supported Markets</h1>
        <p className="text-gray-400 mt-5 max-w-lg">
          Loading supported markets...
        </p>
        <div className="mt-10 flex justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-30 mb-10">
        <h1 className="text-5xl font-League-Spartan mt-10">Supported Markets</h1>
        <p className="text-red-400 mt-5 max-w-lg">
          Error loading markets. Please try again later.
        </p>
      </div>
    );
  }

  if (markets.length === 0) {
    return (
      <div className="mx-30 mb-10">
        <h1 className="text-5xl font-League-Spartan mt-10">Supported Markets</h1>
        <p className="text-gray-400 mt-5 max-w-lg">
          No supported markets found. Check back later!
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="mx-30 mb-10">
        <h1 className="text-5xl font-League-Spartan mt-10">Supported Markets</h1>
        <p className="text-gray-400 mt-5 max-w-lg">
          Buy opposite outcome tokens in following markets for less than 1 dollar and get back USDT immediately.
        </p>

        <MarketFilters
          availableMarkets={["Polymarket", "Opinion"]}
          onChange={(newFilters) => setFilters(newFilters)}
        />

        <div className="grid grid-cols-2 gap-5 items-start mt-6">
          {filteredMarkets.map((market) => {
            const marketPlatforms = [
              market.polymarketQuestion && { name: "Polymarket", question: market.polymarketQuestion },
              market.opinionQuestion && { name: "Opinion", question: market.opinionQuestion },
            ].filter(Boolean) as { name: string; question: string }[];

            return (
              <MarketCard
                key={market.marketKey}
                image={market.polymarketImage || market.opinionThumbnail || "/public/imageNotFound.png"}
                question={market.question}
                status={getStatusText(market.overallStatus)}
                statusColor={getStatusColor(market.overallStatus)}
                markets={marketPlatforms}
                balances={<TokenBalances market={market} />}
                actionTabs={[
                  {
                    key: "merge",
                    label: "Merge & Exit",
                    content: (
                      <div className="space-y-4">
                        {market.pairs.map((pair, idx) => {
                          // Determine which tokens are in this pair
                          const isPolyA = pair.outcomeTokenA.toLowerCase() === "0x4d97dcd97ec945f40cf65f87097ace5ea0476045";
                          const tokenAName = isPolyA ? "Polymarket" : "Opinion (Bridged)";
                          const tokenBName = !isPolyA ? "Polymarket" : "Opinion (Bridged)";
                          
                          return (
                            <div key={pair.key} className="border-b border-white/10 pb-4 last:border-0">
                              <MarketActionCard
                                title={`Pair ${idx + 1}: ${tokenAName} + ${tokenBName}`}
                                inputLabel="Amount to Merge"
                                inputValue={amount}
                                maxValue="0.00"
                                receiveItems={[
                                  {
                                    amount: "0.00",
                                    token: "USDC.e",
                                    highlight: "primary",
                                  },
                                ]}
                                buttonLabel="Merge & Exit"
                                disabled={pair.status !== 'allowed'}
                                disabledReason={pair.status === 'paused' ? 'Pair is paused' : pair.status === 'removed' ? 'Pair has been removed' : undefined}
                                onInputChange={setAmount}
                                onSubmit={() => {
                                  console.log("Merge submitted:", amount, pair);
                                }}
                              />
                            </div>
                          );
                        })}
                      </div>
                    ),
                  },
                  {
                    key: "split",
                    label: "Split & Acquire",
                    content: (
                      <div className="space-y-4">
                        {market.pairs.map((pair, idx) => {
                          const isPolyA = pair.outcomeTokenA.toLowerCase() === "0x4d97dcd97ec945f40cf65f87097ace5ea0476045";
                          const tokenAName = isPolyA ? "Polymarket" : "Opinion (Bridged)";
                          const tokenBName = !isPolyA ? "Polymarket" : "Opinion (Bridged)";
                          
                          return (
                            <div key={pair.key} className="border-b border-white/10 pb-4 last:border-0">
                              <MarketActionCard
                                title={`Pair ${idx + 1}: ${tokenAName} + ${tokenBName}`}
                                inputLabel="Amount to Split"
                                inputValue={amount}
                                maxValue="0.00"
                                receiveItems={[
                                  {
                                    amount: "0.00",
                                    token: `Token A (${pair.decimalsA} decimals)`,
                                    highlight: "yellow",
                                  },
                                  {
                                    amount: "0.00",
                                    token: `Token B (${pair.decimalsB} decimals)`,
                                    highlight: "yellow",
                                  },
                                ]}
                                buttonLabel="Split & Acquire"
                                disabled={pair.status !== 'allowed'}
                                disabledReason={pair.status === 'paused' ? 'Pair is paused' : pair.status === 'removed' ? 'Pair has been removed' : undefined}
                                onInputChange={setAmount}
                                onSubmit={() => {
                                  console.log("Split submitted:", amount, pair);
                                }}
                              />
                            </div>
                          );
                        })}
                      </div>
                    ),
                  },
                ]}
              />
            );
          })}
        </div>
      </div>
    </>
  );
};

export default MarketsPage;
