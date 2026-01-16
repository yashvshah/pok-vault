import { useState } from "react";
import TabsComponent from "./Tabs/TabsComponent";
import { FaChevronCircleDown, FaChevronCircleUp } from "react-icons/fa";

export type MarketStatus = "Allowed" | "Paused" | "Expired";

export interface MarketInfo {
  name: string; // "Polymarket", "Opinion", etc.
  question: string;
  accentClass?: string; // optional color override
}

export interface ActionTab {
  key: string;
  label: string;
  content: React.ReactNode;
}

export interface MarketCardProps {
  image: string; // emoji or image url
  question: string;
  markets: MarketInfo[];
  balances?: React.ReactNode;
  status: string; // Changed from MarketStatus to string for flexibility
  statusColor?: string; // Optional custom status color
  actionTabs?: ActionTab[]; // actions slot
}

const STATUS_STYLES: Record<MarketStatus, string> = {
  Allowed: "bg-green-500/15 text-green-400 border-green-500/30",
  Paused: "bg-yellow-500/15 text-yellow-400 border-yellow-500/30",
  Expired: "bg-red-500/15 text-red-400 border-red-500/30",
};

export default function MarketCard({
  image,
  question,
  status,
  statusColor,
  markets,
  balances,
  actionTabs,
}: MarketCardProps) {
  const [actionsOpen, setActionsOpen] = useState(false);
  const [balancesOpen, setBalancesOpen] = useState(false);
  
  // Use custom color if provided, otherwise fall back to STATUS_STYLES
  const statusClassName = statusColor || (STATUS_STYLES[status as MarketStatus] ?? "bg-gray-500/15 text-gray-400 border-gray-500/30");
  
  return (
    <div
      className={`
        relative gradiant-border
      `}
    >
      <div className="box-of-gradiant-border">
        {/* Header */}
        <div className="relative flex items-start gap-4 p-5">
          {/* Image */}
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/10 text-2xl">
            {image}
          </div>

          {/* Question */}
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-white leading-snug">
              {question}
            </h3>

            <div className="mt-2 space-y-1">
              {markets.map((m, i) => (
                <div key={i} className="flex gap-2 text-sm text-white/60">
                  <span
                    className={`rounded-md px-2 py-0.5 text-xs ${
                      m.accentClass ?? "bg-purple-500/15 text-purple-300"
                    }`}
                  >
                    {m.name}
                  </span>
                  <span>{m.question}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Status */}
          <span
            className={`rounded-full border px-3 py-1 text-xs font-medium ${statusClassName}`}
          >
            {status}
          </span>
        </div>

        {/* Balances Header */}
        <div className="border-t border-white/10 px-5 py-4">
          <button
            onClick={() => setBalancesOpen(!balancesOpen)}
            className="flex w-full items-center justify-between text-sm text-white/80"
          >
            Your Token Balances
            <span className="text-white/50">
              {balancesOpen ? (
                <FaChevronCircleUp size={20} />
              ) : (
                <FaChevronCircleDown size={20} />
              )}
            </span>
          </button>

          {balancesOpen && (
            <div className="mt-3 rounded-xl bg-black/30 p-4">
              {balances ?? (
                <div className="text-sm text-white/40">
                  No balances available
                </div>
              )}
            </div>
          )}
        </div>

        {/* Actions (slot) */}
        <div className="border-t border-white/10 px-5 py-4">
          <button
            onClick={() => setActionsOpen(!actionsOpen)}
            className="w-full text-center text-sm font-medium text-primary hover:text-pink-300 cursor-pointer py-3 rounded-lg bg-linear-to-tl from-white/5 to-white/15 border border-white/5 shadow-md backdrop-blur-md"
          >
            {actionsOpen ? "Hide Actions" : "View Actions"}
          </button>
        </div>

        {actionsOpen && actionTabs && (
          <div className="border-t border-white/10 px-5 py-5">
            <TabsComponent
              tabs={[{ label: "Merge & Exit" }, { label: "Split & Acquire" }]}
              initialIndex={0}
              xClassName="px-4 py-2 text-sm w-full"
            >
              {actionTabs.map((tab) => (
                <div key={tab.key} className="space-y-4">
                  {tab.content}
                </div>
              ))}
            </TabsComponent>
          </div>
        )}
      </div>
    </div>
  );
}
