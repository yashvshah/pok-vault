import Tabs from "../components/Tabs/TabsComponent";
import { FaPercent, FaRegArrowAltCircleDown } from "react-icons/fa";
import { GrMoney } from "react-icons/gr";
import { useVaultActivities } from "../hooks/useVaultActivities";
import { useEffect, useState } from "react";
import {
  useAccount,
  useBalance,
  useReadContract,
  useWriteContract,
  useWaitForTransactionReceipt,
  useChainId,
  useSwitchChain,
} from "wagmi";
import { erc20Abi, erc4626Abi, formatUnits, parseUnits } from "viem";
import { useConnectModal } from "@rainbow-me/rainbowkit";
import { bsc, polygon } from "viem/chains";
import { useAPY } from "../hooks/useAPY";
import earlyExitValutABI from "../abi/EarlyExitVault.json";
import { MarketDisplay } from "../components/MarketDisplay";
import { VAULT_OWNER_ADDRESS } from "../config/addresses";
import type { VaultActivity } from "../types/vault";

const VaultPage = () => {
  const { activities, isLoading, error } = useVaultActivities();
  const { address, isConnected } = useAccount();
  const { openConnectModal } = useConnectModal();
  const chainId = useChainId();
  const { switchChain } = useSwitchChain();
  const [depositAmount, setDepositAmount] = useState("");
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 5;

  const USDT_DECIMALS = 18 as const;

  // Contract addresses
  const VAULT_ADDRESS = "0x5a791CCAB49931861056365eBC072653F3FA0ba0" as const;
  const USDT_ADDRESS = "0x55d398326f99059fF775485246999027B3197955" as const;

  // USDT balance
  const { data: USDTBalance } = useBalance({
    address,
    token: USDT_ADDRESS,
    chainId: bsc.id,
    query: { enabled: isConnected },
  });

  // Vault token (POK-USDT) balance
  const { data: vaultBalance, refetch: refetchVaultBalance } = useBalance({
    address,
    token: VAULT_ADDRESS,
    chainId: bsc.id,
    query: { enabled: isConnected },
  });

  // USDT allowance for vault
  const { data: allowance, refetch: refetchAllowance } = useReadContract({
    address: USDT_ADDRESS,
    abi: erc20Abi,
    functionName: "allowance",
    args: address && [address, VAULT_ADDRESS],
    chainId: bsc.id,
    query: { enabled: isConnected },
  });

  // Get max withdrawable amount
  const { data: previewRedeemAmount } = useReadContract({
    address: VAULT_ADDRESS,
    abi: erc4626Abi,
    functionName: "previewRedeem",
    args: [withdrawAmount ? parseUnits(withdrawAmount, USDT_DECIMALS) : 0n],
    chainId: bsc.id,
    query: { enabled: isConnected && Number(withdrawAmount) > 0 },
  }) as { data: bigint | undefined };

  const { data: previewDepositAmount } = useReadContract({
    address: VAULT_ADDRESS,
    abi: erc4626Abi,
    functionName: "previewDeposit",
    args: [depositAmount ? parseUnits(depositAmount, USDT_DECIMALS) : 0n],
    chainId: bsc.id,
    query: { enabled: isConnected && Number(depositAmount) > 0 },
  }) as { data: bigint | undefined };

  const { data: vaultTotalAssets } = useReadContract({
    address: VAULT_ADDRESS,
    abi: erc4626Abi,
    functionName: "totalAssets",
    chainId: bsc.id,
  }) as { data: bigint | undefined };

  // let's get netAssetValue
  // we call the totalEarlyExitedAmount function from the vault contract

  const { data: totalEarlyExitedAmount } = useReadContract({
    address: VAULT_ADDRESS,
    abi: earlyExitValutABI,
    functionName: "totalEarlyExitedAmount",
    chainId: bsc.id,
  }) as { data: bigint | undefined };

  const utilisation =
    vaultTotalAssets && totalEarlyExitedAmount
      ? (Number(totalEarlyExitedAmount) / Number(vaultTotalAssets)) * 100
      : 0;

  // Contract write hooks for deposit
  const {
    writeContract: writeApprove,
    isPending: isApprovePending,
    data: approveHash,
  } = useWriteContract();
  const {
    writeContract: writeDeposit,
    isPending: isDepositPending,
    data: depositHash,
  } = useWriteContract();

  // Contract write hooks for withdraw
  const {
    writeContract: writeWithdraw,
    isPending: isWithdrawPending,
    data: withdrawHash,
  } = useWriteContract();

  // Transaction receipts
  const { isSuccess: isApproveSuccess } = useWaitForTransactionReceipt({
    hash: approveHash,
  });
  const { isSuccess: isDepositSuccess } = useWaitForTransactionReceipt({
    hash: depositHash,
  });
  const { isSuccess: isWithdrawSuccess } = useWaitForTransactionReceipt({
    hash: withdrawHash,
  });

  const apy = useAPY();

  useEffect(() => {
    if (isDepositSuccess) {
      refetchVaultBalance();
    }
    if (isWithdrawSuccess) {
      refetchVaultBalance();
    }
    if (isApproveSuccess) {
      refetchAllowance();
    }
  }, [
    isDepositSuccess,
    isWithdrawSuccess,
    isApproveSuccess,
    refetchVaultBalance,
    refetchAllowance,
  ]);

  const handleMaxClick = () => {
    if (USDTBalance?.value) {
      const maxAmount = Number(formatUnits(USDTBalance.value, USDT_DECIMALS));
      setDepositAmount(maxAmount.toString());
    }
  };

  const handleMaxWithdrawClick = () => {
    if (vaultBalance?.value) {
      const maxAmount = Number(formatUnits(vaultBalance.value, USDT_DECIMALS));
      setWithdrawAmount(maxAmount.toString());
    }
  };

  // Helper functions for deposit
  const getDepositButtonState = () => {
    if (!isConnected)
      return { text: "Connect Wallet", disabled: false, action: null };
    if (chainId !== bsc.id)
      return {
        text: "Switch Wallet to BSC chain",
        disabled: false,
        action: "switch-chain",
      };
    if (!depositAmount || parseFloat(depositAmount) === 0)
      return { text: "Enter Amount", disabled: true, action: null };

    const amount = parseUnits(depositAmount, USDT_DECIMALS);
    const balance = USDTBalance?.value || 0n;

    if (amount > balance)
      return { text: "Insufficient Balance", disabled: true, action: null };

    const currentAllowance = allowance || 0n;
    if (amount > currentAllowance)
      return { text: "Approve", disabled: false, action: "approve" };

    return { text: "Deposit", disabled: false, action: "deposit" };
  };

  // Helper functions for withdraw
  const getWithdrawButtonState = () => {
    if (!isConnected)
      return { text: "Connect Wallet", disabled: false, action: null };
    if (chainId !== bsc.id)
      return {
        text: "Switch Wallet to BSC chain",
        disabled: false,
        action: "switch-chain",
      };
    if (!withdrawAmount || parseFloat(withdrawAmount) === 0)
      return { text: "Enter Amount", disabled: true, action: null };

    const amount = parseUnits(withdrawAmount, USDT_DECIMALS);
    const balance = vaultBalance?.value || 0n;

    if (amount > balance)
      return { text: "Insufficient Balance", disabled: true, action: null };

    return { text: "Withdraw", disabled: false, action: "withdraw" };
  };

  const handleApprove = () => {
    if (!depositAmount) return;
    const amount = parseUnits(depositAmount, USDT_DECIMALS);
    writeApprove({
      address: USDT_ADDRESS,
      abi: erc20Abi,
      functionName: "approve",
      chain: polygon,
      args: [VAULT_ADDRESS, amount],
    });
  };

  const handleDeposit = () => {
    if (!depositAmount) return;
    const amount = parseUnits(depositAmount, USDT_DECIMALS);
    writeDeposit({
      address: VAULT_ADDRESS,
      abi: erc4626Abi,
      functionName: "deposit",
      chain: polygon,
      args: [amount, address!],
    });
  };

  const handleWithdraw = () => {
    if (!withdrawAmount) return;
    const amount = parseUnits(withdrawAmount, USDT_DECIMALS);
    writeWithdraw({
      address: VAULT_ADDRESS,
      abi: erc4626Abi,
      functionName: "redeem",
      chain: polygon,
      args: [amount, address!, address!],
    });
  };

  const handleDepositButtonClick = () => {
    const state = getDepositButtonState();
    if (state.text === "Connect Wallet") {
      openConnectModal?.();
      return;
    }
    if (state.action === "switch-chain") {
      switchChain({ chainId: bsc.id });
      return;
    }
    if (state.action === "approve") handleApprove();
    else if (state.action === "deposit") handleDeposit();
  };

  const handleWithdrawButtonClick = () => {
    const state = getWithdrawButtonState();
    if (state.text === "Connect Wallet") {
      openConnectModal?.();
      return;
    }
    if (state.action === "switch-chain") {
      switchChain({ chainId: bsc.id });
      return;
    }
    if (state.action === "withdraw") handleWithdraw();
  };

  const shorten = (val: string, start = 6, end = 4) =>
    `${val.slice(0, start)}...${val.slice(-end)}`;

  const formatTimestamp = (timestamp: number) => {
    const date = new Date(timestamp * 1000);
    return date.toLocaleString("en-US", {
      month: "2-digit",
      day: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    });
  };

  const formatAmount = (activity: {
    USDTAmount: string;
    outcomeTokensAmount: string;
  }) => {
    if (activity.USDTAmount) {
      return `${activity.USDTAmount} USDT`;
    }
    if (activity.outcomeTokensAmount) {
      return activity.outcomeTokensAmount;
    }
    return "—";
  };

  const formatTitle = (type: VaultActivity["type"]) => {
    if (type === "new-outcome-pair") return "New Outcome Pair Added";
    if (type === "removed-outcome-pair") return "Outcome Pair Removed";
    if (type === "paused-outcome-pair") return "Outcome Pair Paused";
    if (type === "profit-loss-reported") return "Profit/Loss Reported";
    if (type === "early-exit") return "Merge";
    if (type === "split-outcome-tokens") return "Split";
    if (type === "deposit") return "Vault Deposit";
    if (type === "withdrawal") return "Vault Withdrawal";
  };

  return (
    <main className="px-4 sm:px-6 md:px-12 lg:px-24 mt-8 md:mt-14">
      <div className="flex flex-col lg:flex-row justify-around items-start lg:items-center gap-8 lg:gap-10">
        {/* LEFT SECTION */}
        <div>
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl text-white leading-tight font-League-Spartan">
            Earn Passive Income From
            <br className="hidden sm:block" />
            Prediction Market Arbitrage
          </h1>

          <p className="text-gray-400 mt-4 sm:mt-5 max-w-lg text-sm sm:text-base">
            Provide capital to cross market arbitragers who profit from market
            inefficiencies and generate yield without actually running the bots.
          </p>

          <div className="flex flex-col sm:flex-row sm:flex-wrap lg:flex-nowrap justify-between items-stretch sm:items-center w-full border border-primary/40 rounded-xl p-3 sm:p-4 mt-6 sm:mt-8 lg:mt-10 gap-4 sm:gap-0">
            <div className="px-3 sm:px-4 lg:px-6 flex items-center gap-3 sm:gap-4 min-w-0">
              <div className="border border-primary/70 bg-[#1c0e0e] p-2 rounded-md">
                <GrMoney className="text-sm sm:text-base" />
              </div>
              <div className="min-w-0">
                <p className="text-secondry text-xs sm:text-sm">Total Assets</p>
                <p className="text-base sm:text-lg lg:text-xl truncate">
                  {vaultTotalAssets
                    ? Number(
                        formatUnits(vaultTotalAssets, USDT_DECIMALS)
                      ).toFixed(2) + " USDT"
                    : "0.00"}
                </p>
              </div>
            </div>
            <div className="px-3 sm:px-4 lg:px-6 sm:border-l border-primary/50 flex items-center gap-3 sm:gap-4 min-w-0">
              <div className="border border-primary/70 bg-[#1c0e0e] p-2 rounded-md">
                <FaPercent className="text-sm sm:text-base" />
              </div>
              <div className="min-w-0">
                <p className="text-secondry text-xs sm:text-sm">APY</p>
                <p className="text-base sm:text-lg lg:text-xl">
                  {apy.toFixed(2)}%
                </p>
              </div>
            </div>
            <div className="px-3 sm:px-4 lg:px-6 sm:border-l border-primary/50 flex items-center gap-3 sm:gap-4 min-w-0">
              <div className="border border-primary/70 bg-[#1c0e0e] p-2 rounded-md">
                <GrMoney className="text-sm sm:text-base" />
              </div>
              <div className="min-w-0">
                <p className="text-secondry text-xs sm:text-sm">
                  Vault Utilization
                </p>
                <p className="text-base sm:text-lg lg:text-xl">
                  {utilisation.toFixed(2)}%
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT SECTION */}
        <div className="reletive w-full lg:w-auto lg:shrink-0">
          <div className="absolute right-4 sm:right-10 lg:right-36 top-34 gradiant-border rounded-xl -z-10 blur-xs hidden md:block">
            <div className="box-of-gradiant-border rounded-xl w-95 h-95 backdrop-blur-xs"></div>
          </div>
          <div className="gradiant-border rounded-xl z-10">
            <div className="box-of-gradiant-border rounded-xl p-4 sm:p-5 md:p-6 w-full lg:w-95">
              <Tabs
                tabs={[{ label: "Deposit" }, { label: "Withdraw" }]}
                xClassName="w-full text-sm sm:text-base"
              >
                {/* DEPOSIT */}
                <div className="space-y-3 sm:space-y-4">
                  <div className="flex flex-col sm:flex-row gap-3">
                    <div className="">
                      <label className="font-extralight text-xs text-secondry">
                        From Wallet
                      </label>
                      <div className="gradiant-border">
                        <div className="box-of-gradiant-border flex items-center gap-1 text-sm sm:text-base">
                          <img src="/usdt.svg" className="h-5 w-5"></img>
                          <span className="text-gray-400">USDT</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <label className="font-extralight text-xs text-secondry">
                        Amount
                      </label>
                      <div className="gradiant-border">
                        <div className="box-of-gradiant-border flex">
                          <input
                            type="number"
                            placeholder="0"
                            value={depositAmount}
                            onChange={(e) => setDepositAmount(e.target.value)}
                            className="focus:outline-none text-sm sm:text-base"
                          />
                          <button
                            onClick={handleMaxClick}
                            className="px-2 sm:px-3 py-1 bg-primary/20 hover:bg-primary/30 rounded text-xs font-semibold"
                            disabled={!isConnected || chainId !== bsc.id}
                          >
                            MAX
                          </button>
                        </div>
                      </div>
                      {isConnected && chainId === bsc.id && (
                        <p className="text-xs text-gray-400 mt-1 truncate">
                          Balance:{" "}
                          {Number(
                            formatUnits(USDTBalance?.value || 0n, USDT_DECIMALS)
                          ).toFixed(2)}{" "}
                          USDT
                        </p>
                      )}
                    </div>
                  </div>
                  <span className="flex items-center justify-center text-primary/60">
                    <FaRegArrowAltCircleDown
                      size={20}
                      className="sm:w-6 sm:h-6"
                    />
                  </span>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <div className="flex-1 min-w-0">
                      <label className="font-extralight text-xs text-secondry">
                        To Vault
                      </label>
                      <div className="gradiant-border">
                        <div className="box-of-gradiant-border flex items-center gap-2 text-sm sm:text-base">
                          <img src="/pok-usdt.svg" className="h-5 w-5" />
                          <span className="text-gray-400">POK-USDT</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <label className="font-extralight text-xs text-secondry">
                        You will receive
                      </label>
                      <div className="gradiant-border">
                        <div className="box-of-gradiant-border text-gray-400 text-sm sm:text-base truncate">
                          {previewDepositAmount
                            ? Number(
                                formatUnits(previewDepositAmount, USDT_DECIMALS)
                              ).toFixed(2)
                            : "0"}{" "}
                          POK-USDT
                        </div>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={handleDepositButtonClick}
                    disabled={
                      getDepositButtonState().disabled ||
                      isApprovePending ||
                      (!isApproveSuccess && approveHash != undefined) ||
                      isDepositPending ||
                      (!isDepositSuccess && depositHash != undefined)
                    }
                    className="w-full bg-primary py-2.5 sm:py-3 rounded-lg font-semibold text-sm sm:text-base disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isApprovePending ||
                    (!isApproveSuccess && approveHash != undefined)
                      ? "Approving..."
                      : isDepositPending ||
                        (!isDepositSuccess && depositHash != undefined)
                      ? "Depositing..."
                      : getDepositButtonState().text}
                  </button>
                </div>

                {/* WITHDRAW */}
                <div className="space-y-3 sm:space-y-4">
                  <div className="flex flex-col sm:flex-row gap-3">
                    <div className="">
                      <label className="font-extralight text-xs text-secondry">
                        From Vault
                      </label>
                      <div className="gradiant-border">
                        <div className="box-of-gradiant-border flex items-center gap-1 text-sm sm:text-base">
                          <img src="/pok-usdt.svg" className="h-5 w-5" />
                          <span className="text-gray-400">POK-USDT</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <label className="font-extralight text-xs text-secondry">
                        Amount
                      </label>
                      <div className="gradiant-border">
                        <div className="box-of-gradiant-border flex items-center">
                          <input
                            type="number"
                            placeholder="0"
                            value={withdrawAmount}
                            onChange={(e) => setWithdrawAmount(e.target.value)}
                            className="w-32 focus:outline-none text-sm sm:text-base"
                          />
                          <button
                            onClick={handleMaxWithdrawClick}
                            className="px-2 sm:px-3 py-1 bg-primary/20 hover:bg-primary/30 rounded text-xs font-semibold transition-colors"
                            disabled={!isConnected || chainId !== bsc.id}
                          >
                            MAX
                          </button>
                        </div>
                      </div>
                      {isConnected && chainId === bsc.id && (
                        <p className="text-xs text-gray-400 mt-1 truncate">
                          Balance:{" "}
                          {Number(
                            formatUnits(
                              vaultBalance?.value || 0n,
                              USDT_DECIMALS
                            )
                          ).toFixed(2)}{" "}
                          POK-USDT
                        </p>
                      )}
                    </div>
                  </div>
                  <span className="flex items-center justify-center text-primary/60">
                    <FaRegArrowAltCircleDown
                      size={20}
                      className="sm:w-6 sm:h-6"
                    />
                  </span>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <span className="flex-1">
                      <label className="font-extralight text-xs text-secondry">
                        To Wallet
                      </label>
                      <div className="gradiant-border">
                        <div className="box-of-gradiant-border flex items-center gap-2 text-sm sm:text-base">
                          <img src="/usdt.svg" className="h-5 w-5" />
                          <span className="text-gray-400">USDT</span>
                        </div>
                      </div>
                    </span>
                    <span className="flex-1">
                      <label className="font-extralight text-xs text-secondry">
                        You will receive
                      </label>
                      <div className="gradiant-border">
                        <div className="box-of-gradiant-border text-gray-400 text-sm sm:text-base truncate">
                          {previewRedeemAmount
                            ? Number(
                                formatUnits(previewRedeemAmount, USDT_DECIMALS)
                              ).toFixed(2)
                            : "0"}{" "}
                          USDT
                        </div>
                      </div>
                    </span>
                  </div>
                  <button
                    onClick={handleWithdrawButtonClick}
                    disabled={
                      getWithdrawButtonState().disabled ||
                      isWithdrawPending ||
                      (!isWithdrawSuccess && withdrawHash != undefined)
                    }
                    className="w-full bg-primary py-2.5 sm:py-3 rounded-lg font-semibold text-sm sm:text-base disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isWithdrawPending ||
                    (!isWithdrawSuccess && withdrawHash != undefined)
                      ? "Withdrawing..."
                      : getWithdrawButtonState().text}
                  </button>
                </div>
              </Tabs>
            </div>
          </div>
        </div>
      </div>
      <div className="bg-linear-to-b from-primary to-[#863A3C] p-px rounded-xl my-10 sm:my-14 md:my-18 mx-2 sm:mx-6 md:mx-10">
        <div className="box-of-gradiant-border rounded-xl bg-[#0f0f0f] p-3 sm:p-4 md:p-5">
          <Tabs tabs={[{ label: "ACTIVITY" }, { label: "INFO" }]}>
            {/* table */}
            <div className="overflow-x-auto rounded-xl border border-white/10 bg-black/40 backdrop-blur-md">
              <table className="w-full text-left text-xs sm:text-sm min-w-200">
                <thead className="bg-white/5 text-gray-400">
                  <tr>
                    <th className="px-2 sm:px-4 py-2 sm:py-3 w-30">Type</th>
                    <th className="px-2 sm:px-4 py-2 sm:py-3 w-[320px] sm:w-100">
                      Market
                    </th>
                    <th className="px-2 sm:px-4 py-2 sm:py-3 w-30">Amount</th>
                    <th className="px-2 sm:px-4 py-2 sm:py-3 w-25">User</th>
                    <th className="px-2 sm:px-4 py-2 sm:py-3 w-25">Tx Hash</th>
                    <th className="px-2 sm:px-4 py-2 sm:py-3 w-30">
                      Timestamp
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {isLoading ? (
                    <tr>
                      <td
                        colSpan={6}
                        className="px-2 sm:px-4 py-6 sm:py-8 text-center text-gray-400"
                      >
                        Loading activities...
                      </td>
                    </tr>
                  ) : error ? (
                    <tr>
                      <td
                        colSpan={6}
                        className="px-2 sm:px-4 py-6 sm:py-8 text-center text-red-400"
                      >
                        Error loading activities: {error.message}
                      </td>
                    </tr>
                  ) : activities.length === 0 ? (
                    <tr>
                      <td
                        colSpan={6}
                        className="px-2 sm:px-4 py-6 sm:py-8 text-center text-gray-400"
                      >
                        No activities found
                      </td>
                    </tr>
                  ) : (
                    (() => {
                      const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
                      const paginatedActivities = activities.slice(
                        startIndex,
                        startIndex + ITEMS_PER_PAGE
                      );

                      return paginatedActivities.map((activity) => (
                        <tr
                          key={activity.id}
                          className="border-t border-white/5 hover:bg-white/5 transition"
                        >
                          <td className="px-2 sm:px-4 py-2 sm:py-3 capitalize">
                            {formatTitle(activity.type)}
                          </td>

                          <td className="px-2 sm:px-4 py-3 sm:py-4 align-top">
                            <MarketDisplay
                              marketInfoA={activity.marketInfoA}
                              marketInfoB={activity.marketInfoB}
                              fallbackText={activity.market || "N/A"}
                            />
                          </td>

                          <td className="px-2 sm:px-4 py-2 sm:py-3">
                            {formatAmount(activity)}
                          </td>

                          <td
                            className="px-2 sm:px-4 py-2 sm:py-3 font-mono"
                            title={activity.user}
                          >
                            {activity.user ? (
                              <a
                                href={`https://bscscan.com/address/${activity.user}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-primary hover:text-pink-300 transition-colors"
                              >
                                {activity.userLabel || shorten(activity.user)}
                              </a>
                            ) : (
                              "—"
                            )}
                          </td>

                          <td
                            className="px-2 sm:px-4 py-2 sm:py-3 font-mono"
                            title={activity.transactionHash}
                          >
                            <a
                              href={`https://bscscan.com/tx/${activity.transactionHash}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-primary hover:text-pink-300 transition-colors"
                            >
                              {shorten(activity.transactionHash)}
                            </a>
                          </td>

                          <td className="px-2 sm:px-4 py-2 sm:py-3 text-gray-400 whitespace-nowrap">
                            {formatTimestamp(activity.timestamp)}
                          </td>
                        </tr>
                      ));
                    })()
                  )}
                </tbody>
              </table>

              {/* Pagination Controls */}
              {activities.length > ITEMS_PER_PAGE && (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 border-t border-white/10">
                  <span className="text-xs sm:text-sm text-gray-400">
                    Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1} -{" "}
                    {Math.min(currentPage * ITEMS_PER_PAGE, activities.length)}{" "}
                    of {activities.length} activities
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setCurrentPage(1)}
                      disabled={currentPage === 1}
                      className="px-2 sm:px-3 py-1 text-xs sm:text-sm rounded bg-white/10 hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed transition"
                    >
                      First
                    </button>
                    <button
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="px-2 sm:px-3 py-1 text-xs sm:text-sm rounded bg-white/10 hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed transition"
                    >
                      Prev
                    </button>
                    <span className="px-3 py-1 text-xs sm:text-sm text-gray-300">
                      Page {currentPage} of{" "}
                      {Math.ceil(activities.length / ITEMS_PER_PAGE)}
                    </span>
                    <button
                      onClick={() =>
                        setCurrentPage((p) =>
                          Math.min(
                            Math.ceil(activities.length / ITEMS_PER_PAGE),
                            p + 1
                          )
                        )
                      }
                      disabled={
                        currentPage ===
                        Math.ceil(activities.length / ITEMS_PER_PAGE)
                      }
                      className="px-2 sm:px-3 py-1 text-xs sm:text-sm rounded bg-white/10 hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed transition"
                    >
                      Next
                    </button>
                    <button
                      onClick={() =>
                        setCurrentPage(
                          Math.ceil(activities.length / ITEMS_PER_PAGE)
                        )
                      }
                      disabled={
                        currentPage ===
                        Math.ceil(activities.length / ITEMS_PER_PAGE)
                      }
                      className="px-2 sm:px-3 py-1 text-xs sm:text-sm rounded bg-white/10 hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed transition"
                    >
                      Last
                    </button>
                  </div>
                </div>
              )}
            </div>
            <div>
              <div className="space-y-3 sm:space-y-4 ml-2 sm:ml-4 md:ml-5 text-sm sm:text-base">
                <div>
                  <p className="text-gray-300 leading-relaxed break-all">
                    <a
                      href={`https://bscscan.com/address/${VAULT_ADDRESS}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:text-pink-300 transition-colors"
                    >
                      <strong className="text-secondry">Vault Address:</strong>{" "}
                      {VAULT_ADDRESS}
                    </a>
                  </p>
                </div>
                <div>
                  <p className="text-gray-300 leading-relaxed break-all">
                    <a
                      href={`https://bscscan.com/address/${USDT_ADDRESS}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:text-pink-300 transition-colors"
                    >
                      <strong className="text-secondry">
                        Underlying asset address:
                      </strong>{" "}
                      {USDT_ADDRESS} (USDT)
                    </a>
                  </p>
                </div>
                <div>
                  <p className="text-gray-300 leading-relaxed break-all">
                    <strong className="text-secondry">
                      Vault Owner Address:
                    </strong>
                    <a
                      href={`https://bscscan.com/address/${VAULT_OWNER_ADDRESS}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:text-pink-300 transition-colors"
                    >
                      {" "}
                      {VAULT_OWNER_ADDRESS}
                    </a>
                  </p>
                </div>
                <div>
                  <p className="text-gray-300 leading-relaxed">
                    <strong className="text-secondry">Performance fees:</strong>{" "}
                    10%
                  </p>
                </div>
                <div>
                  <p className="text-gray-300 leading-relaxed">
                    <strong className="text-secondry">Management fees:</strong>{" "}
                    0%
                  </p>
                </div>
              </div>
            </div>
          </Tabs>
        </div>
      </div>
    </main>
  );
};

export default VaultPage;
