import { MdKeyboardDoubleArrowRight } from "react-icons/md";
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

const VaultPage = () => {
  const { activities, isLoading, error } = useVaultActivities();
  const { address, isConnected } = useAccount();
  const { openConnectModal } = useConnectModal();
  const chainId = useChainId();
  const { switchChain } = useSwitchChain();
  const [depositAmount, setDepositAmount] = useState("");
  const [withdrawAmount, setWithdrawAmount] = useState("");

  const USDT_DECIMALS = 18 as const;

  // Contract addresses
  const VAULT_ADDRESS = "0x69362094D0C2D8Be0818c0006e09B82c5CA59Af9" as const;
  const USDT_ADDRESS = "0x55d398326f99059fF775485246999027B3197955" as const;

  // USDT balance
  const { data: USDTBalance } = useBalance({
    address,
    token: USDT_ADDRESS,
    chainId: bsc.id,
    query: { enabled: isConnected },
  });

  // Vault token (POK-USDT) balance
  const { data: vaultBalance , refetch: refetchVaultBalance } = useBalance({
    address,
    token: VAULT_ADDRESS,
    chainId: bsc.id,
    query: { enabled: isConnected },
  });

  // USDT allowance for vault
  const { data: allowance , refetch: refetchAllowance } = useReadContract({
    address: USDT_ADDRESS,
    abi: erc20Abi,
    functionName: "allowance",
    args: address && [address, VAULT_ADDRESS],
    chainId: bsc.id,
    query: { enabled: isConnected }
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

  const {data: previewDepositAmount} = useReadContract({
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
   if(isDepositSuccess) {
    refetchVaultBalance();
   }
   if(isWithdrawSuccess) {
    refetchVaultBalance();
   }
   if(isApproveSuccess) {
    refetchAllowance();
   }

  },[isDepositSuccess, isWithdrawSuccess, isApproveSuccess, refetchVaultBalance, refetchAllowance]);

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

  const points = [
    "Automated strategies rebalance capital across markets in real time.",
    "Funds remain non-custodial and fully transparent on-chain.",
    "Smart contracts optimize execution to minimize slippage.",
    "Yields are generated from market inefficiencies, not speculation.",
    "Withdraw liquidity at any time with no lock-up period.",
  ];

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

  return (
    <main className="px-24 mt-14">
      <div className="flex justify-around items-center gap-10">
        {/* LEFT SECTION */}
        <div>
          <h1 className="text-7xl text-white leading-tight font-League-Spartan">
            Earn Passive Income From
            <br />
            Prediction Market Arbitrage
          </h1>

          <p className="text-gray-400 mt-5 max-w-lg">
            Deploy capital into automated strategies that exploit prediction
            market inefficiencies and generate yield.
          </p>

          <div className="flex justify-between items-center w-fit border border-primary/40 rounded-xl p-4 mt-10">
            <div className="px-6 flex items-center gap-4">
              <div className="border border-primary/70 bg-[#1c0e0e] p-2 rounded-md">
                <GrMoney />
              </div>
              <div>
                <p className="text-secondry">Total Assets</p>
                <p className="text-xl">
                  {vaultTotalAssets
                    ? Number(
                        formatUnits(vaultTotalAssets, USDT_DECIMALS)
                      ).toFixed(2) + " USDT"
                    : "0.00"}
                </p>
              </div>
            </div>
            <div className="px-6 border-l border-primary/50 flex items-center gap-4">
              <div className="border border-primary/70 bg-[#1c0e0e] p-2 rounded-md">
                <FaPercent />
              </div>
              <div>
                <p className="text-secondry">APY</p>
                <p className="text-xl">{5}%</p>
              </div>
            </div>
            <div className="px-6 border-l border-primary/50 flex items-center gap-4">
              <div className="border border-primary/70 bg-[#1c0e0e] p-2 rounded-md">
                <GrMoney />
              </div>
              <div>
                <p className="text-secondry">Net Value</p>
                <p className="text-xl">0.9840%</p>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT SECTION */}
        <div className="reletive">
          <div className="absolute right-36 top-34 gradiant-border rounded-xl -z-10 blur-xs">
            <div className="box-of-gradiant-border rounded-xl w-95 h-95 backdrop-blur-xs"></div>
          </div>
          <div className="gradiant-border rounded-xl z-10">
            <div className="box-of-gradiant-border rounded-xl p-6 w-95">
              <Tabs
                tabs={[{ label: "Deposit" }, { label: "Withdraw" }]}
                xClassName="w-full"
              >
                {/* DEPOSIT */}
                <div className="space-y-4">
                  <div className="flex gap-3">
                    <span className="flex-1">
                      <label className="font-extralight text-xs text-secondry">
                        From Wallet
                      </label>
                      <div className="gradiant-border">
                        <div className="box-of-gradiant-border flex items-center justify-between">
                          <span className="text-gray-400">USDT</span>
                          <span className="text-sm">💰</span>
                        </div>
                      </div>
                    </span>
                    <span className="flex-1">
                      <label className="font-extralight text-xs text-secondry">
                        Amount
                      </label>
                      <div className="gradiant-border">
                        <div className="box-of-gradiant-border flex items-center">
                          <input
                            type="number"
                            placeholder="0"
                            value={depositAmount}
                            onChange={(e) => setDepositAmount(e.target.value)}
                            className="flex-1 focus:outline-none"
                          />
                          <button
                            onClick={handleMaxClick}
                            className="px-3 py-1 bg-primary/20 hover:bg-primary/30 rounded text-xs font-semibold transition-colors"
                            disabled={!isConnected || chainId !== bsc.id}
                          >
                            MAX
                          </button>
                        </div>
                      </div>
                      {isConnected && chainId === bsc.id && (
                        <p className="text-xs text-gray-400 mt-1">
                          Balance:{" "}
                          {formatUnits(USDTBalance?.value || 0n, USDT_DECIMALS)}{" "}
                          USDT
                        </p>
                      )}
                    </span>
                  </div>
                  <span className="flex items-center justify-center text-primary/60">
                    <FaRegArrowAltCircleDown size={25} />
                  </span>
                  <div className="flex gap-3">
                    <span className="flex-1">
                      <label className="font-extralight text-xs text-secondry">
                        To Vault
                      </label>
                      <div className="gradiant-border">
                        <div className="box-of-gradiant-border flex items-center justify-between">
                          <span className="text-gray-400">POK-USDT</span>
                          <span className="text-sm">🏦</span>
                        </div>
                      </div>
                    </span>
                    <span className="flex-1">
                      <label className="font-extralight text-xs text-secondry">
                        You will receive
                      </label>
                      <div className="gradiant-border">
                        <div className="box-of-gradiant-border text-gray-400">
                          {previewDepositAmount ? formatUnits(previewDepositAmount, USDT_DECIMALS) : "0"} POK-USDT
                        </div>
                      </div>
                    </span>
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
                    className="w-full bg-primary py-3 rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isApprovePending || (!isApproveSuccess && approveHash != undefined)
                      ? "Approving..."
                      : isDepositPending || (!isDepositSuccess && depositHash != undefined)
                      ? "Depositing..."
                      : getDepositButtonState().text}
                  </button>
                </div>

                {/* WITHDRAW */}
                <div className="space-y-4">
                  <div className="flex gap-3">
                    <span className="flex-1">
                      <label className="font-extralight text-xs text-secondry">
                        From Vault
                      </label>
                      <div className="gradiant-border">
                        <div className="box-of-gradiant-border flex items-center justify-between">
                          <span className="text-gray-400">POK-USDT</span>
                          <span className="text-sm">🏦</span>
                        </div>
                      </div>
                    </span>
                    <span className="flex-1">
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
                            className="flex-1 focus:outline-none"
                          />
                          <button
                            onClick={handleMaxWithdrawClick}
                            className="px-3 py-1 bg-primary/20 hover:bg-primary/30 rounded text-xs font-semibold transition-colors"
                            disabled={!isConnected || chainId !== bsc.id}
                          >
                            MAX
                          </button>
                        </div>
                      </div>
                      {isConnected && chainId === bsc.id && (
                        <p className="text-xs text-gray-400 mt-1">
                          Balance: {formatUnits(vaultBalance?.value || 0n, USDT_DECIMALS)}{" "}
                          POK-USDT
                        </p>
                      )}
                    </span>
                  </div>
                  <span className="flex items-center justify-center text-primary/60">
                    <FaRegArrowAltCircleDown size={25} />
                  </span>
                  <div className="flex gap-3">
                    <span className="flex-1">
                      <label className="font-extralight text-xs text-secondry">
                        To Wallet
                      </label>
                      <div className="gradiant-border">
                        <div className="box-of-gradiant-border flex items-center justify-between">
                          <span className="text-gray-400">USDT</span>
                          <span className="text-sm">💰</span>
                        </div>
                      </div>
                    </span>
                    <span className="flex-1">
                      <label className="font-extralight text-xs text-secondry">
                        You will receive
                      </label>
                      <div className="gradiant-border">
                        <div className="box-of-gradiant-border text-gray-400">
                          {previewRedeemAmount
                            ? formatUnits(previewRedeemAmount, USDT_DECIMALS)
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
                    className="w-full bg-primary py-3 rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isWithdrawPending || (!isWithdrawSuccess && withdrawHash != undefined)
                      ? "Withdrawing..."
                      : getWithdrawButtonState().text}
                  </button>
                </div>
              </Tabs>
            </div>
          </div>
        </div>
      </div>
      <div className="bg-linear-to-b from-primary to-[#863A3C] p-px rounded-xl my-18 mx-10">
        <div className="box-of-gradiant-border rounded-xl bg-[#0f0f0f] p-5">
          <Tabs tabs={[{ label: "INFO" }, { label: "ACTIVITY" }]}>
            <div>
              <ul className="space-y-3 ml-5">
                {points.map((text, index) => (
                  <li key={index} className="flex items-start gap-5">
                    <span>
                      <MdKeyboardDoubleArrowRight
                        className="text-primary mt-1"
                        size={20}
                      />
                    </span>
                    <p className="text-gray-300 leading-relaxed">{text}</p>
                  </li>
                ))}
              </ul>
            </div>
            {/* table */}
            <div className="overflow-hidden rounded-xl border border-white/10 bg-black/40 backdrop-blur-md">
              <table className="w-full text-left text-sm">
                <thead className="bg-white/5 text-gray-400">
                  <tr>
                    <th className="px-4 py-3">Type</th>
                    <th className="px-4 py-3">Market</th>
                    <th className="px-4 py-3">Amount</th>
                    <th className="px-4 py-3">User</th>
                    <th className="px-4 py-3">Tx Hash</th>
                    <th className="px-4 py-3">Timestamp</th>
                  </tr>
                </thead>

                <tbody>
                  {isLoading ? (
                    <tr>
                      <td
                        colSpan={6}
                        className="px-4 py-8 text-center text-gray-400"
                      >
                        Loading activities...
                      </td>
                    </tr>
                  ) : error ? (
                    <tr>
                      <td
                        colSpan={6}
                        className="px-4 py-8 text-center text-red-400"
                      >
                        Error loading activities: {error.message}
                      </td>
                    </tr>
                  ) : activities.length === 0 ? (
                    <tr>
                      <td
                        colSpan={6}
                        className="px-4 py-8 text-center text-gray-400"
                      >
                        No activities found
                      </td>
                    </tr>
                  ) : (
                    activities.map((activity) => (
                      <tr
                        key={activity.id}
                        className="border-t border-white/5 hover:bg-white/5 transition"
                      >
                        <td className="px-4 py-3 capitalize">
                          {activity.type.replace(/-/g, " ")}
                        </td>

                        <td className="px-4 py-3 max-w-[320px] truncate">
                          {activity.market || "N/A"}
                        </td>

                        <td className="px-4 py-3">{formatAmount(activity)}</td>

                        <td
                          className="px-4 py-3 font-mono text-primary"
                          title={activity.user}
                        >
                          {activity.user ? shorten(activity.user) : "—"}
                        </td>

                        <td
                          className="px-4 py-3 font-mono text-primary"
                          title={activity.transactionHash}
                        >
                          {shorten(activity.transactionHash)}
                        </td>

                        <td className="px-4 py-3 text-gray-400">
                          {formatTimestamp(activity.timestamp)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Tabs>
        </div>
      </div>
    </main>
  );
};

export default VaultPage;
