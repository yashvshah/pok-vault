import { useState } from "react";

/* ================= TYPES ================= */

export type MarketStatus = "All" | "Allowed" | "Paused" | "Expired";

export interface MarketFilterState {
  search: string;
  status: MarketStatus;
  markets: string[];
}

interface MarketFiltersProps {
  availableMarkets: string[];
  onChange: (filters: MarketFilterState) => void;
  minMarkets?: number; // default = 2
}

/* ================= COMPONENT ================= */

export default function MarketFilters({
  availableMarkets,
  onChange,
  minMarkets = 2,
}: MarketFiltersProps) {
  const [filters, setFilters] = useState<MarketFilterState>({
    search: "",
    status: "All",
    markets: availableMarkets.slice(0, minMarkets),
  });

  const updateFilters = (next: Partial<MarketFilterState>) => {
    const updated = { ...filters, ...next };
    setFilters(updated);
    onChange(updated);
  };

//   const toggleMarket = (market: string) => {
//     const isActive = filters.markets.includes(market);

//     if (isActive) {
//       if (filters.markets.length <= minMarkets) return;
//       updateFilters({
//         markets: filters.markets.filter((m) => m !== market),
//       });
//     } else {
//       updateFilters({
//         markets: [...filters.markets, market],
//       });
//     }
//   };

  return (
    <div className="flex flex-wrap gap-3 my-5">
      {/* ================= SEARCH ================= */}
      <div className="flex-1 min-w-60">
        <input
          type="text"
          placeholder="Search prediction questions..."
          value={filters.search}
          onChange={(e) => updateFilters({ search: e.target.value })}
          className="w-full rounded-xl bg-black/40 px-4 py-3 text-sm text-white placeholder-white/40 outline-none ring-1 ring-white/10 focus:ring-primary"
        />
      </div>

      {/* ================= STATUS ================= */}
      <select
        value={filters.status}
        onChange={(e) =>
          updateFilters({ status: e.target.value as MarketStatus })
        }
        className="rounded-xl bg-black/40 px-3 py-2 text-sm text-white outline-none ring-1 ring-white/10 focus:ring-primary"
      >
        <option value="All">All Status</option>
        <option value="Allowed">Allowed</option>
        <option value="Paused">Paused</option>
        <option value="Expired">Expired</option>
      </select>

      {/* ================= MARKET FILTER ================= */}
      {/* <div className="flex flex-wrap items-center gap-2 rounded-xl bg-black/40 px-3 py-2 ring-1 ring-white/10">
        <span className="text-xs text-white/50">Markets</span>

        {(availableMarkets ?? []).map((market) => {
          const active = filters.markets.includes(market);
          const locked = active && filters.markets.length <= minMarkets;

          return (
            <button
              key={market}
              onClick={() => toggleMarket(market)}
              disabled={locked}
              className={`
                rounded-lg px-3 py-1 text-xs transition
                ${
                  active
                    ? "bg-primary/20 text-primary"
                    : "bg-white/5 text-white/50 hover:bg-white/10"
                }
                ${locked ? "opacity-50 cursor-not-allowed" : ""}
              `}
            >
              {market}
            </button>
          );
        })}
      </div> */}
    </div>
  );
}
