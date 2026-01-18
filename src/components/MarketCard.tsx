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
  polyMarketQuestionLink?: string; // optional link for the question title
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
  polyMarketQuestionLink,
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
        <div className="relative flex flex-col sm:flex-row items-start gap-3 sm:gap-4 p-4 sm:p-5">
          {/* Image */}
          <div className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-xl bg-white/10 text-xl sm:text-2xl flex-shrink-0">
            <img 
            src={image}
            alt="market image"
            className="w-full h-full object-contain"
            />
          </div>

          {/* Question */}
          <div className="flex-1 min-w-0">
            <h3 className="text-base sm:text-lg font-semibold text-white leading-snug">
              {question}
            </h3>

            <div className="mt-2 space-y-1">
              {markets.map((m, i) => (
                <div key={i} className="flex flex-wrap gap-2 text-xs sm:text-sm text-white/60">
                  <span
                    className={`rounded-md px-2 py-0.5 text-xs ${
                      m.accentClass ?? "bg-purple-500/15 text-purple-300"
                    }`}
                  >
                    {m.name}
                  </span>
              
                  <span className="break-words">{m.name == "Polymarket" &&  polyMarketQuestionLink ? (
                <a 
                  href={polyMarketQuestionLink} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="hover:text-primary transition-colors"
                >
                  {m.question}
                </a>
              ) : (
                m.question
              )}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Status */}
          <span
            className={`rounded-full border px-2 sm:px-3 py-1 text-xs font-medium whitespace-nowrap flex-shrink-0 ${statusClassName}`}
          >
            {status}
          </span>
        </div>

        {/* Balances Header */}
        <div className="border-t border-white/10 px-4 sm:px-5 py-3 sm:py-4">
          <button
            onClick={() => setBalancesOpen(!balancesOpen)}
            className="flex w-full items-center justify-between text-xs sm:text-sm text-white/80 touch-manipulation"
          >
            Your Token Balances
            <span className="text-white/50">
              {balancesOpen ? (
                <FaChevronCircleUp size={18} className="sm:w-5 sm:h-5" />
              ) : (
                <FaChevronCircleDown size={18} className="sm:w-5 sm:h-5" />
              )}
            </span>
          </button>

          {balancesOpen && (
            <div className="mt-3 rounded-xl bg-black/30 p-3 sm:p-4">
              {balances ?? (
                <div className="text-xs sm:text-sm text-white/40">
                  No balances available
                </div>
              )}
            </div>
          )}
        </div>

        {/* Actions (slot) */}
        <div className="border-t border-white/10 px-4 sm:px-5 py-3 sm:py-4">
          <button
            onClick={() => setActionsOpen(!actionsOpen)}
            className="w-full text-center text-xs sm:text-sm font-medium text-primary hover:text-pink-300 cursor-pointer py-2.5 sm:py-3 rounded-lg bg-linear-to-tl from-white/5 to-white/15 border border-white/5 shadow-md backdrop-blur-md touch-manipulation"
          >
            {actionsOpen ? "Hide Actions" : "View Actions"}
          </button>
        </div>

        {actionsOpen && actionTabs && (
          <div className="border-t border-white/10 px-4 sm:px-5 py-4 sm:py-5">
            <TabsComponent
              tabs={actionTabs.map(tab => ({ label: tab.label }))}
              initialIndex={0}
              xClassName="px-3 sm:px-4 py-2 text-xs sm:text-sm w-full"
            >
              {actionTabs.map((tab) => (
                <div key={tab.key} className="space-y-3 sm:space-y-4">
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
