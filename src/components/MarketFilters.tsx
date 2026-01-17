import { useState } from "react";

/* ================= TYPES ================= */

export type MarketStatus = "All" | "Allowed" | "Paused" | "Removed";

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
    status: "Allowed",
    markets: availableMarkets.slice(0, minMarkets),
  });

  const updateFilters = (next: Partial<MarketFilterState>) => {
    const updated = { ...filters, ...next };
    setFilters(updated);
    onChange(updated);
  };

  return (
    <div className="flex flex-col sm:flex-row flex-wrap gap-3 my-4 sm:my-5">
      {/* ================= SEARCH ================= */}
      <div className="flex-1 min-w-full sm:min-w-60">
        <input
          type="text"
          placeholder="Search prediction questions..."
          value={filters.search}
          onChange={(e) => updateFilters({ search: e.target.value })}
          className="w-full rounded-xl bg-black/40 px-3 sm:px-4 py-2.5 sm:py-3 text-sm text-white placeholder-white/40 outline-none ring-1 ring-white/10 focus:ring-primary"
        />
      </div>

      {/* ================= STATUS ================= */}
      <select
        value={filters.status}
        onChange={(e) =>
          updateFilters({ status: e.target.value as MarketStatus })
        }
        className="w-full sm:w-auto rounded-xl bg-black/40 px-3 py-2.5 sm:py-2 text-sm text-white outline-none ring-1 ring-white/10 focus:ring-primary"
      >
        <option value="All">All Status</option>
        <option value="Allowed">Allowed</option>
        <option value="Paused">Paused</option>
        <option value="Removed">Expired/Removed</option>
      </select>
    </div>
  );
}
