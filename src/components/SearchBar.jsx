// SearchBar.jsx — Day 2 shell (Gabriel).
// Renders and holds nothing beyond the controlled input; live filtering
// (sliders -> onFilterChange) is the Day 3 ticket, wired search is Day 4.
import { Funnel, LucideProvider, Search, SlidersHorizontal} from "lucide-react";
function SearchBar({ value, onChange, onFilterChange }) {
  return (
    <div className="flex items-center gap-3 bg-zinc-50 border border-zinc-300 rounded-pill pl-4 pr-1.5 py-1.5 hover:bg-zinc-100 hover:border-zinc-900 active:border-zinc-900">

      <label htmlFor="city-search" className="sr-only">
        Search cities
      </label>

      <LucideProvider >
        <Search className="text-brand-bg w-7" />
      </LucideProvider>

      <input
        id="city-search"
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Search cities or country — e.g. Nairobi, Kenya"
        className="flex-1 bg-transparent outline-none text-zinc-800 placeholder:text-zinc-500"
      />

      {/* TODO (Day 3, Gabriel): filter sliders — minInternet, maxCostOfLiving,
          minSafety — each calling onFilterChange({ ...filters }) */}
      <button
        type="button"
        onClick={() => onFilterChange?.({})}
        className="flex flex-row items-center gap-2 text-sm font-medium text-brand-bg rounded-pill bg-brand-accent hover:bg-brand-accent/80 px-4 py-2.5 h-full"
      >
        <LucideProvider>
          <SlidersHorizontal className="h-5 text-brand-bg" />
        </LucideProvider>
        Filters
      </button>
    </div>
  );
}

export default SearchBar;