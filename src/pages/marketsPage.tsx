import { useState, type FunctionComponent } from "react";
import { useAccount, useChainId, useSwitchChain, useReadContract, useBalance, useWriteContract } from "wagmi";
import { polygon, bsc } from "wagmi/chains";
import { parseUnits, erc1155Abi, formatUnits, encodeAbiParameters } from "viem";
import type { Address } from "viem";
import EarlyExitVaultAbi from "../abi/EarlyExitVault.json";
import { POLYGON_ERC1155_POLYGON_ADDRESS, POLYGON_ERC1155_BRIDGED_BSC_ADDRESS, OPINION_ERC1155_ADDRESS, POLYMARKET_SOURCE_BRIDGE_POLYGON_ADDRESS, POLYMARKET_DESTINATION_BRIDGE_BSC_ADDRESS, POLYMARKET_DECIMALS, VAULT_ADDRESS, OPINION_DECIMALS, USDT_ADDRESS, USDT_DECIMALS } from "../config/addresses";
import { useErc1155Balance } from "../hooks/useErc1155Balance";
import { useSafeAddresses } from "../hooks/useSafeAddresses";
import { useSafeWrite } from "../hooks/useSafeWrite";
import MarketCard from "../components/MarketCard";
import MarketActionCard from "../components/MarketActionCard";
import BalanceItem from "../components/BalanceItem";
import MarketFilters, { type MarketFilterState } from "../components/MarketFilters";
import { useSupportedMarkets, type MarketStatus, type SupportedMarket } from "../hooks/useSupportedMarkets";


// eslint-disable-next-line @typescript-eslint/no-empty-object-type
interface MarketsPageProps {}


function TokenBalances({ market }: { market: SupportedMarket }) {
  const { address } = useAccount();
  const currentChainId = useChainId();
  const { switchChain } = useSwitchChain();
  
  // Detect Gnosis Safe addresses
  const { 
    polymarketSafe, 
    opinionSafe, 
    usePolymarketSafe, 
    useOpinionSafe,
    setUsePolymarketSafe,
    setUseOpinionSafe 
  } = useSafeAddresses(address);
  
  // Use safe write hooks
  const { write: writePolygon } = useSafeWrite({ 
    safeAddress: usePolymarketSafe ? polymarketSafe : null, 
    chainId: polygon.id 
  });
  const { write: writeBsc } = useSafeWrite({ 
    safeAddress: useOpinionSafe ? opinionSafe : null, 
    chainId: bsc.id 
  });
  
  const yesIdPoly = market.polymarketYesTokenId ? BigInt(market.polymarketYesTokenId) : 0n;
  const noIdPoly = market.polymarketNoTokenId ? BigInt(market.polymarketNoTokenId) : 0n;
  const yesIdOpinion = market.opinionYesTokenId ? BigInt(market.opinionYesTokenId) : 0n;
  const noIdOpinion = market.opinionNoTokenId ? BigInt(market.opinionNoTokenId) : 0n;

  // Determine owner addresses based on safe usage
  const polyOwner = usePolymarketSafe ? polymarketSafe : null;
  const bscOwner = useOpinionSafe ? opinionSafe : null;

  const { data: balPolyYes } = useErc1155Balance({ tokenAddress: POLYGON_ERC1155_POLYGON_ADDRESS, tokenId: yesIdPoly, chainId: polygon.id, ownerAddress: polyOwner });
  const { data: balPolyNo } = useErc1155Balance({ tokenAddress: POLYGON_ERC1155_POLYGON_ADDRESS, tokenId: noIdPoly, chainId: polygon.id, ownerAddress: polyOwner });
  const { data: balOpinionYes } = useErc1155Balance({ tokenAddress: OPINION_ERC1155_ADDRESS, tokenId: yesIdOpinion, chainId: bsc.id, ownerAddress: bscOwner });
  const { data: balOpinionNo } = useErc1155Balance({ tokenAddress: OPINION_ERC1155_ADDRESS, tokenId: noIdOpinion, chainId: bsc.id, ownerAddress: bscOwner });
  const { data: balBridgedYes } = useErc1155Balance({ tokenAddress: POLYGON_ERC1155_BRIDGED_BSC_ADDRESS, tokenId: yesIdPoly, chainId: bsc.id, ownerAddress: bscOwner });
  const { data: balBridgedNo } = useErc1155Balance({ tokenAddress: POLYGON_ERC1155_BRIDGED_BSC_ADDRESS, tokenId: noIdPoly, chainId: bsc.id, ownerAddress: bscOwner });

  const [bridgeToBscYesAmt, setBridgeToBscYesAmt] = useState('0');
  const [bridgeToBscNoAmt, setBridgeToBscNoAmt] = useState('0');
  const [bridgeToPolygonYesAmt, setBridgeToPolygonYesAmt] = useState('0');
  const [bridgeToPolygonNoAmt, setBridgeToPolygonNoAmt] = useState('0');

  const onBridgeToBsc = async (id: bigint, amtStr: string) => {
    if (!address) return;
    const from = usePolymarketSafe && polymarketSafe ? polymarketSafe : address;
    const to = useOpinionSafe && opinionSafe ? opinionSafe : address;
    const value = parseUnits(amtStr || '0', POLYMARKET_DECIMALS);
    
    // Encode the destination address for the bridge
    const data = encodeAbiParameters(
      [{ type: 'address' }],
      [to]
    );
    
    await writePolygon({
      abi: erc1155Abi,
      address: POLYGON_ERC1155_POLYGON_ADDRESS,
      functionName: 'safeTransferFrom',
      args: [from, POLYMARKET_SOURCE_BRIDGE_POLYGON_ADDRESS, id, value, data],
    });
  };

  const onBridgeToPolygon = async (id: bigint, amtStr: string) => {
    if (!address) return;
    const from = useOpinionSafe && opinionSafe ? opinionSafe : address;
    const to = usePolymarketSafe && polymarketSafe ? polymarketSafe : address;
    const value = parseUnits(amtStr || '0', POLYMARKET_DECIMALS);
    
    // Encode the destination address for the bridge
    const data = encodeAbiParameters(
      [{ type: 'address' }],
      [to]
    );
    
    await writeBsc({
      abi: erc1155Abi,
      address: POLYGON_ERC1155_BRIDGED_BSC_ADDRESS,
      functionName: 'safeTransferFrom',
      args: [from, POLYMARKET_DESTINATION_BRIDGE_BSC_ADDRESS, id, value, data],
    });
  };

  return (
    <div className="text-xs text-white/80 space-y-3 mt-2">
      {/* Safe Detection Notices */}
      {polymarketSafe && (
        <div className="rounded-lg bg-blue-500/10 border border-blue-500/30 p-3">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium text-blue-400">Polymarket Account (Gnosis Safe) Detected</div>
              <div className="text-xs text-white/60 mt-1">Address: {polymarketSafe}</div>
              <div className="text-xs text-white/60">
                {usePolymarketSafe ? 'Using Safe for transactions' : 'Using EOA for transactions'}
              </div>
            </div>
            <button
              className="rounded bg-blue-500/20 px-3 py-1.5 border border-blue-500/40 text-xs hover:bg-blue-500/30"
              onClick={() => setUsePolymarketSafe(!usePolymarketSafe)}
            >
              {usePolymarketSafe ? 'Switch to EOA' : 'Switch to Safe'}
            </button>
          </div>
        </div>
      )}
      {opinionSafe && (
        <div className="rounded-lg bg-blue-500/10 border border-blue-500/30 p-3">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium text-blue-400">Opinion Gnosis Safe Detected (BSC)</div>
              <div className="text-xs text-white/60 mt-1">Address: {opinionSafe}</div>
              <div className="text-xs text-white/60">
                {useOpinionSafe ? 'Using Safe for transactions' : 'Using EOA for transactions'}
              </div>
            </div>
            <button
              className="rounded bg-blue-500/20 px-3 py-1.5 border border-blue-500/40 text-xs hover:bg-blue-500/30"
              onClick={() => setUseOpinionSafe(!useOpinionSafe)}
            >
              {useOpinionSafe ? 'Switch to EOA' : 'Switch to Safe'}
            </button>
          </div>
        </div>
      )}
      
      <div className="grid grid-cols-2 gap-3">
        <BalanceItem
          title="Polymarket YES (Polygon)"
          balance={formatUnits(balPolyYes ?? 0n, POLYMARKET_DECIMALS).toString()}
          action={(
            <div className="flex gap-2">
              <input className="w-24 rounded bg-black/40 px-2 py-1 text-white/80 border border-white/10" value={bridgeToBscYesAmt} onChange={e => setBridgeToBscYesAmt(e.target.value)} placeholder="amt" />
              <button className="rounded bg-primary/20 px-2 py-1 border border-primary/40 text-xs" onClick={() => (currentChainId === polygon.id ? onBridgeToBsc(yesIdPoly, bridgeToBscYesAmt) : switchChain({ chainId: polygon.id }))} disabled={!address}>
                {currentChainId === polygon.id ? 'Bridge to BSC' : 'Switch to Polygon'}
              </button>
            </div>
          )}
        />
        <BalanceItem
          title="Polymarket NO (Polygon)"
          balance={formatUnits(balPolyNo ?? 0n, POLYMARKET_DECIMALS).toString()}
          action={(
            <div className="flex gap-2">
              <input className="w-24 rounded bg-black/40 px-2 py-1 text-white/80 border border-white/10" value={bridgeToBscNoAmt} onChange={e => setBridgeToBscNoAmt(e.target.value)} placeholder="amt" />
              <button className="rounded bg-primary/20 px-2 py-1 border border-primary/40 text-xs" onClick={() => (currentChainId === polygon.id ? onBridgeToBsc(noIdPoly, bridgeToBscNoAmt) : switchChain({ chainId: polygon.id }))} disabled={!address}>
                {currentChainId === polygon.id ? 'Bridge to BSC' : 'Switch to Polygon'}
              </button>
            </div>
          )}
        />
        <BalanceItem 
          title="Bridged Polymarket YES (BSC)" 
          balance={formatUnits(balBridgedYes ?? 0n, POLYMARKET_DECIMALS)}
          action={(
            <div className="flex gap-2">
              <input className="w-24 rounded bg-black/40 px-2 py-1 text-white/80 border border-white/10" value={bridgeToPolygonYesAmt} onChange={e => setBridgeToPolygonYesAmt(e.target.value)} placeholder="amt" />
              <button className="rounded bg-primary/20 px-2 py-1 border border-primary/40 text-xs" onClick={() => (currentChainId === bsc.id ? onBridgeToPolygon(yesIdPoly, bridgeToPolygonYesAmt) : switchChain({ chainId: bsc.id }))} disabled={!address}>
                {currentChainId === bsc.id ? 'Bridge to Polygon' : 'Switch to BSC'}
              </button>
            </div>
          )}
        />
        <BalanceItem 
          title="Bridged Polymarket NO (BSC)" 
          balance={formatUnits(balBridgedNo ?? 0n, POLYMARKET_DECIMALS)}
          action={(
            <div className="flex gap-2">
              <input className="w-24 rounded bg-black/40 px-2 py-1 text-white/80 border border-white/10" value={bridgeToPolygonNoAmt} onChange={e => setBridgeToPolygonNoAmt(e.target.value)} placeholder="amt" />
              <button className="rounded bg-primary/20 px-2 py-1 border border-primary/40 text-xs" onClick={() => (currentChainId === bsc.id ? onBridgeToPolygon(noIdPoly, bridgeToPolygonNoAmt) : switchChain({ chainId: bsc.id }))} disabled={!address}>
                {currentChainId === bsc.id ? 'Bridge to Polygon' : 'Switch to BSC'}
              </button>
            </div>
          )}
        />
        <BalanceItem title="Opinion YES (BSC)" balance={formatUnits(balOpinionYes ?? 0n, OPINION_DECIMALS)} />
        <BalanceItem title="Opinion NO (BSC)" balance={formatUnits(balOpinionNo ?? 0n, OPINION_DECIMALS)} />
        <BalanceItem title="Polymarket YES Pending (Polygon → BSC)" balance={"—"} action={<button className="rounded bg-white/10 px-2 py-1 border border-white/20 text-xs">Complete Bridge</button>} />
        <BalanceItem title="Polymarket NO Pending (Polygon → BSC)" balance={"—"} action={<button className="rounded bg-white/10 px-2 py-1 border border-white/20 text-xs">Complete Bridge</button>} />
        <BalanceItem title="Polymarket YES Pending (BSC → Polygon)" balance={"—"} action={<button className="rounded bg-white/10 px-2 py-1 border border-white/20 text-xs">Complete Bridge</button>} />
        <BalanceItem title="Polymarket NO Pending (BSC → Polygon)" balance={"—"} action={<button className="rounded bg-white/10 px-2 py-1 border border-white/20 text-xs">Complete Bridge</button>} />
      </div>
      <div className="text-white/50">Note: Bridging requires calling bridge function and then calling complete bridge to pay gas fees</div>
    </div>
  );
}

function PairMergeAction({ pair, idx, amount, onInputChange }: { pair: SupportedMarket["pairs"][number]; idx: number; amount: string; onInputChange: (v: string) => void }) {
  const { address } = useAccount();
  const currentChainId = useChainId();
  const { switchChain } = useSwitchChain();
  
  // Detect safe and use safe write
  const { opinionSafe, useOpinionSafe } = useSafeAddresses(address);
  const { write: writeBsc } = useSafeWrite({ 
    safeAddress: useOpinionSafe ? opinionSafe : null, 
    chainId: bsc.id 
  });

  const idA = BigInt(pair.outcomeIdA);
  const idB = BigInt(pair.outcomeIdB);
  
  // Use safe address for balance reads if applicable
  const bscOwner = useOpinionSafe ? opinionSafe : null;
  const { data: balA } = useErc1155Balance({ tokenAddress: pair.outcomeTokenA as Address, tokenId: idA, chainId: bsc.id, ownerAddress: bscOwner });
  const { data: balB } = useErc1155Balance({ tokenAddress: pair.outcomeTokenB as Address, tokenId: idB, chainId: bsc.id, ownerAddress: bscOwner });

  const balAFormatted = formatUnits(balA ?? 0n, pair.decimalsA);
  const balBFormatted = formatUnits(balB ?? 0n, pair.decimalsB);
  
  // Max is the lesser of the two balances
  const maxAmount = balA && balB 
    ? (Number(balAFormatted) < Number(balBFormatted) ? balAFormatted : balBFormatted)
    : '0';

  const amountUsdt = parseUnits(amount || '0', 18);
  const reqA = parseUnits(amount || '0', pair.decimalsA);
  const reqB = parseUnits(amount || '0', pair.decimalsB);
  const enough = (balA ?? 0n) >= reqA && (balB ?? 0n) >= reqB;

  const { data: estimated } = useReadContract({
    abi: EarlyExitVaultAbi,
    address: VAULT_ADDRESS,
    functionName: 'estimateEarlyExitAmount',
    args: [pair.outcomeTokenA as Address, idA, pair.outcomeTokenB as Address, idB, amountUsdt],
    chainId: bsc.id,
  });
  const receiveAmount = estimated ? formatUnits(estimated as bigint, 18) : '0.00';

  const onSubmit = async () => {
    if (!address) return;
    if (currentChainId !== bsc.id) {
      switchChain({ chainId: bsc.id });
      return;
    }
    if (!enough) return;
    const recipient = useOpinionSafe && opinionSafe ? opinionSafe : address;
    await writeBsc({
      abi: EarlyExitVaultAbi,
      address: VAULT_ADDRESS,
      functionName: 'earlyExit',
      args: [pair.outcomeTokenA as Address, idA, pair.outcomeTokenB as Address, idB, amountUsdt, recipient],
    });
  };

  const onMaxClick = () => {
    onInputChange(maxAmount);
  };

  const isPolyA = pair.outcomeTokenA.toLowerCase() === POLYGON_ERC1155_BRIDGED_BSC_ADDRESS.toLowerCase();
  const tokenAName = isPolyA ? "Polymarket (Bridged)" : "Opinion";
  const tokenBName = !isPolyA ? "Polymarket (Bridged)" : "Opinion";

  return (
    <div className="border-b border-white/10 pb-4 last:border-0">
      <MarketActionCard
        title={`Pair ${idx + 1}: ${tokenAName} + ${tokenBName}`}
        inputLabel="Amount to Merge"
        inputValue={amount}
        balanceInfo={`${tokenAName}: ${balAFormatted} | ${tokenBName}: ${balBFormatted}`}
        onMaxClick={onMaxClick}
        receiveItems={[{ amount: receiveAmount, token: 'USDT', highlight: 'primary' }]}
        buttonLabel={!enough ? 'Insufficient balance to merge and exit' : currentChainId === bsc.id ? 'Merge & Exit' : 'Switch chain to merge and exit'}
        disabled={pair.status !== 'allowed'}
        buttonDisabled={!enough || pair.status !== 'allowed'}
        disabledReason={pair.status === 'paused' ? 'Pair is paused' : pair.status === 'removed' ? 'Pair has been removed' : undefined}
        onInputChange={onInputChange}
        onSubmit={onSubmit}
      />
    </div>
  );
}

function PairSplitAction({ pair, idx, amount, onInputChange }: { pair: SupportedMarket["pairs"][number]; idx: number; amount: string; onInputChange: (v: string) => void }) {
  const { address } = useAccount();
  const currentChainId = useChainId();
  const { switchChain } = useSwitchChain();
  
  // Detect safe and use safe write
  const { opinionSafe, useOpinionSafe } = useSafeAddresses(address);
  const { write: writeBsc } = useSafeWrite({ 
    safeAddress: useOpinionSafe ? opinionSafe : null, 
    chainId: bsc.id 
  });

  const idA = BigInt(pair.outcomeIdA);
  const idB = BigInt(pair.outcomeIdB);
  const amountUsdt = parseUnits(amount || '0', 18);

  // Use safe address for USDT balance if applicable
  const bscOwner = useOpinionSafe && opinionSafe ? opinionSafe : address;
  const { data: usdtBal } = useBalance({ address: bscOwner, chainId: bsc.id, token: USDT_ADDRESS });
  const enoughUsdt = (usdtBal?.value ?? 0n) >= amountUsdt;
  const usdtBalFormatted = formatUnits(usdtBal?.value ?? 0n, 18);

  const { data: estSplit } = useReadContract({
    abi: EarlyExitVaultAbi,
    address: VAULT_ADDRESS,
    functionName: 'estimateSplitOppositeOutcomeTokensAmount',
    args: [pair.outcomeTokenA as Address, idA, pair.outcomeTokenB as Address, idB, amountUsdt],
    chainId: bsc.id,
  });

  const onSubmit = async () => {
    if (!address) return;
    if (currentChainId !== bsc.id) {
      switchChain({ chainId: bsc.id });
      return;
    }
    if (!enoughUsdt) return;
    const recipient = useOpinionSafe && opinionSafe ? opinionSafe : address;
    await writeBsc({
      abi: EarlyExitVaultAbi,
      address: VAULT_ADDRESS,
      functionName: 'splitOppositeOutcomeTokens',
      args: [pair.outcomeTokenA as Address, idA, pair.outcomeTokenB as Address, idB, amountUsdt, recipient],
    });
  };

  const onMaxClick = () => {
    onInputChange(usdtBalFormatted);
  };

  const isPolyA = pair.outcomeTokenA.toLowerCase() === POLYGON_ERC1155_BRIDGED_BSC_ADDRESS.toLowerCase();
  const tokenAName = isPolyA ? "Polymarket (Bridged)" : "Opinion";
  const tokenBName = !isPolyA ? "Polymarket (Bridged)" : "Opinion";

  const estSplitAmt: bigint = typeof estSplit === 'bigint' ? estSplit : 0n;
  const tokenAmtA = formatUnits(estSplitAmt, USDT_DECIMALS);
  const tokenAmtB = formatUnits(estSplitAmt, USDT_DECIMALS);

  return (
    <div className="border-b border-white/10 pb-4 last:border-0">
      <MarketActionCard
        title={`Pair ${idx + 1}: ${tokenAName} + ${tokenBName}`}
        inputLabel="Amount to Split"
        inputValue={amount}
        balanceInfo={`USDT Balance: ${usdtBalFormatted}`}
        onMaxClick={onMaxClick}
        receiveItems={[
          { amount: tokenAmtA, token: `Token A (${pair.decimalsA} decimals)`, highlight: 'yellow' },
          { amount: tokenAmtB, token: `Token B (${pair.decimalsB} decimals)`, highlight: 'yellow' },
        ]}
        buttonLabel={!enoughUsdt ? 'Insufficient USDT balance to split and acquire' : currentChainId === bsc.id ? 'Split & Acquire' : 'Switch chain to split'}
        disabled={pair.status !== 'allowed'}
        buttonDisabled={!enoughUsdt || pair.status !== 'allowed'}
        disabledReason={pair.status === 'paused' ? 'Pair is paused' : pair.status === 'removed' ? 'Pair has been removed' : undefined}
        onInputChange={onInputChange}
        onSubmit={onSubmit}
      />
    </div>
  );
}

function OwnerActionsForPair({ pair, idx }: { pair: SupportedMarket["pairs"][number]; idx: number }) {
  const { address } = useAccount();
  const currentChainId = useChainId();
  const { switchChain } = useSwitchChain();
  const { writeContract } = useWriteContract();
  
  const [profitLossAmount, setProfitLossAmount] = useState('0');
  const [isRemoving, setIsRemoving] = useState(false);
  const [isStartingRedeem, setIsStartingRedeem] = useState(false);
  const [isReportingProfit, setIsReportingProfit] = useState(false);
  const [isReportingAndRemoving, setIsReportingAndRemoving] = useState(false);

  const idA = BigInt(pair.outcomeIdA);
  const idB = BigInt(pair.outcomeIdB);
  
  const isPolyA = pair.outcomeTokenA.toLowerCase() === POLYGON_ERC1155_BRIDGED_BSC_ADDRESS.toLowerCase();
  const tokenAName = isPolyA ? "Polymarket (Bridged)" : "Opinion";
  const tokenBName = !isPolyA ? "Polymarket (Bridged)" : "Opinion";

  const onRemovePair = async () => {
    if (!address || currentChainId !== bsc.id) {
      switchChain({ chainId: bsc.id });
      return;
    }
    setIsRemoving(true);
    try {
      await writeContract({
        abi: EarlyExitVaultAbi,
        address: VAULT_ADDRESS,
        functionName: 'removeAllowedOppositeOutcomeTokens',
        args: [pair.outcomeTokenA as Address, idA, pair.outcomeTokenB as Address, idB],
        chainId: bsc.id,
      });
    } catch (error) {
      console.error('Failed to remove pair:', error);
    } finally {
      setIsRemoving(false);
    }
  };

  const onStartRedeem = async () => {
    if (!address || currentChainId !== bsc.id) {
      switchChain({ chainId: bsc.id });
      return;
    }
    setIsStartingRedeem(true);
    try {
      await writeContract({
        abi: EarlyExitVaultAbi,
        address: VAULT_ADDRESS,
        functionName: 'startRedeemProcess',
        args: [pair.outcomeTokenA as Address, idA, pair.outcomeTokenB as Address, idB],
        chainId: bsc.id,
      });
    } catch (error) {
      console.error('Failed to start redeem:', error);
    } finally {
      setIsStartingRedeem(false);
    }
  };

  const onReportProfitOrLoss = async () => {
    if (!address || currentChainId !== bsc.id) {
      switchChain({ chainId: bsc.id });
      return;
    }
    const amount = parseUnits(profitLossAmount || '0', 18);
    if (amount === 0n) return;
    
    setIsReportingProfit(true);
    try {
      await writeContract({
        abi: EarlyExitVaultAbi,
        address: VAULT_ADDRESS,
        functionName: 'reportProfitOrLoss',
        args: [pair.outcomeTokenA as Address, idA, pair.outcomeTokenB as Address, idB, amount],
        chainId: bsc.id,
      });
    } catch (error) {
      console.error('Failed to report profit/loss:', error);
    } finally {
      setIsReportingProfit(false);
    }
  };

  const onReportProfitOrLossAndRemove = async () => {
    if (!address || currentChainId !== bsc.id) {
      switchChain({ chainId: bsc.id });
      return;
    }
    const amount = parseUnits(profitLossAmount || '0', 18);
    // if (amount === 0n) return;
    
    setIsReportingAndRemoving(true);
    try {
      await writeContract({
        abi: EarlyExitVaultAbi,
        address: VAULT_ADDRESS,
        functionName: 'reportProfitOrLossAndRemovePair',
        args: [pair.outcomeTokenA as Address, idA, pair.outcomeTokenB as Address, idB, amount],
        chainId: bsc.id,
      });
    } catch (error) {
      console.error('Failed to report and remove:', error);
    } finally {
      setIsReportingAndRemoving(false);
    }
  };

  const needsChainSwitch = currentChainId !== bsc.id;

  return (
    <div className="border-b border-white/10 pb-4 last:border-0">
      <div className="text-sm font-medium text-white/90 mb-3">
        Owner Actions - Pair {idx + 1}: {tokenAName} + {tokenBName}
      </div>
      
      <div className="space-y-3">
        {/* Remove Pair */}
        <div className="rounded-lg bg-red-500/10 border border-red-500/30 p-3">
          <div className="text-xs text-white/80 mb-2">Remove this outcome pair from vault</div>
          <button
            className="w-full rounded bg-red-500/20 px-3 py-2 border border-red-500/40 text-xs hover:bg-red-500/30 disabled:opacity-50"
            onClick={onRemovePair}
            disabled={isRemoving || pair.status === 'removed'}
          >
            {needsChainSwitch ? 'Switch to BSC to Remove' : isRemoving ? 'Removing...' : 'Remove Pair'}
          </button>
        </div>

        {/* Start Redeem Process */}
        <div className="rounded-lg bg-blue-500/10 border border-blue-500/30 p-3">
          <div className="text-xs text-white/80 mb-2">Start redemption process (after market expiry)</div>
          <button
            className="w-full rounded bg-blue-500/20 px-3 py-2 border border-blue-500/40 text-xs hover:bg-blue-500/30 disabled:opacity-50"
            onClick={onStartRedeem}
            disabled={isStartingRedeem || pair.status === 'removed'}
          >
            {needsChainSwitch ? 'Switch to BSC to Start' : isStartingRedeem ? 'Starting...' : 'Start Redeem Process'}
          </button>
        </div>

        {/* Report Profit/Loss */}
        <div className="rounded-lg bg-green-500/10 border border-green-500/30 p-3">
          <div className="text-xs text-white/80 mb-2">Report profit or loss for this pair</div>
          <div className="flex gap-2 mb-2">
            <input
              className="flex-1 rounded bg-black/40 px-3 py-2 text-white/80 border border-white/10 text-xs"
              value={profitLossAmount}
              onChange={(e) => setProfitLossAmount(e.target.value)}
              placeholder="Amount (USDT)"
            />
          </div>
          <div className="flex gap-2">
            <button
              className="flex-1 rounded bg-green-500/20 px-3 py-2 border border-green-500/40 text-xs hover:bg-green-500/30 disabled:opacity-50"
              onClick={onReportProfitOrLoss}
              disabled={isReportingProfit || !profitLossAmount || profitLossAmount === '0' || pair.status === 'removed'}
            >
              {needsChainSwitch ? 'Switch to BSC' : isReportingProfit ? 'Reporting...' : 'Report Profit/Loss'}
            </button>
            <button
              className="flex-1 rounded bg-yellow-500/20 px-3 py-2 border border-yellow-500/40 text-xs hover:bg-yellow-500/30 disabled:opacity-50"
              onClick={onReportProfitOrLossAndRemove}
              disabled={isReportingAndRemoving || !profitLossAmount || pair.status === 'removed'}
            >
              {needsChainSwitch ? 'Switch to BSC' : isReportingAndRemoving ? 'Reporting & Removing...' : 'Report & Remove Pair'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

const MarketsPage: FunctionComponent<MarketsPageProps> = () => {
  const [amount, setAmount] = useState("0.00");
  const [filters, setFilters] = useState<MarketFilterState>({
    search: "",
    status: "Allowed",
    markets: ["Polymarket (Bridged)", "Opinion"],
  });
  const { data: markets = [], isLoading, error } = useSupportedMarkets();
  const { address } = useAccount();

  // Read owner from contract
  const { data: ownerAddress } = useReadContract({
    address: VAULT_ADDRESS,
    abi: EarlyExitVaultAbi,
    functionName: "owner",
  }) as { data: string | undefined };

  const isOwner = address && ownerAddress && address.toLowerCase() === ownerAddress.toLowerCase();

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
        return '🔴 Expired/Removed';
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
          availableMarkets={["Polymarket (Bridged)", "Opinion"]}
          onChange={(newFilters) => setFilters(newFilters)}
        />

        <div className="grid grid-cols-2 gap-5 items-start mt-6">
          {filteredMarkets.map((market) => {
            const marketPlatforms = [
              market.polymarketQuestion && { name: "Polymarket (Bridged)", question: market.polymarketQuestion },
              market.opinionQuestion && { name: "Opinion", question: market.opinionQuestion },
            ].filter(Boolean) as { name: string; question: string }[];

            const actionTabs = [
              {
                key: "merge",
                label: "Merge & Exit",
                content: (
                  <div className="space-y-4">
                    {market.pairs.map((pair, idx) => (
                      <PairMergeAction key={pair.key} pair={pair} idx={idx} amount={amount} onInputChange={setAmount} />
                    ))}
                  </div>
                ),
              },
              {
                key: "split",
                label: "Split & Acquire",
                content: (
                  <div className="space-y-4">
                    {market.pairs.map((pair, idx) => (
                      <PairSplitAction key={pair.key} pair={pair} idx={idx} amount={amount} onInputChange={setAmount} />
                    ))}
                  </div>
                ),
              },
            ];

            // Add owner actions tab if connected wallet is owner
            if (isOwner) {
              actionTabs.push({
                key: "owner",
                label: "Owner Actions",
                content: (
                  <div className="space-y-4">
                    {market.pairs.map((pair, idx) => (
                      <OwnerActionsForPair key={pair.key} pair={pair} idx={idx} />
                    ))}
                  </div>
                ),
              });
            }

            return (
              <MarketCard
                key={market.marketKey}
                image={market.polymarketImage || market.opinionThumbnail || "/public/imageNotFound.png"}
                question={market.question}
                status={getStatusText(market.overallStatus)}
                statusColor={getStatusColor(market.overallStatus)}
                markets={marketPlatforms}
                balances={<TokenBalances market={market} />}
                actionTabs={actionTabs}
              />
            );
          })}
        </div>
      </div>
    </>
  );
};

export default MarketsPage;
