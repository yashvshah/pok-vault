import { useState } from "react";
import MarketAutocomplete from "./MarketAutocomplete";
import MarketCategories from "./MarketCategories";

/* ================= TYPES ================= */

export type MarketStatus = "All" | "Allowed" | "Paused" | "Removed";

export interface MarketFilterState {
  search: string;
  status: MarketStatus;
  markets: string[];
}

interface MarketFiltersProps {
  availableMarkets: string[];
  allQuestions: string[];
  onChange: (filters: MarketFilterState) => void;
  minMarkets?: number; // default = 2
  categories?: string[];
}

/* ================= COMPONENT ================= */

export default function MarketFilters({
  availableMarkets,
  allQuestions,
  onChange,
  minMarkets = 2,
  categories = [],
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
    <div className="my-4 sm:my-5">
      <div className="flex flex-col sm:flex-row flex-wrap gap-3 mb-4">
        {/* ================= SEARCH ================= */}
        <MarketAutocomplete
          questions={allQuestions}
          value={filters.search}
          onChange={(value) => updateFilters({ search: value })}
        />

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

      {/* ================= CATEGORIES ================= */}
      <MarketCategories
        categories={categories}
        onCategoryClick={(category) => updateFilters({ search: category })}
      />
    </div>
  );
}
