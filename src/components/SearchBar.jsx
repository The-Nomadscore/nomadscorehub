// SearchBar.jsx — Day 2 shell (Gabriel).
// Renders and holds nothing beyond the controlled input; live filtering
// (sliders -> onFilterChange) is the Day 3 ticket, wired search is Day 4.

function SearchBar({ value, onChange, onFilterChange }) {
  return (
    <div className="flex items-center gap-3 bg-brand-surface border border-brand-border rounded-pill pl-4 pr-1.5 py-1.5 hover:border-brand-muted active:border-brand-muted focus:border-brand-muted">

      <label htmlFor="city-search" className="sr-only">
        Search cities
      </label>

      <input
        id="city-search"
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Search cities or country — e.g. Nairobi, Kenya"
        className="flex-1 bg-transparent outline-none text-brand-text placeholder:text-brand-muted"
      />

      {/* TODO (Day 3, Gabriel): filter sliders — minInternet, maxCostOfLiving,
          minSafety — each calling onFilterChange({ ...filters }) */}
      <button
        type="button"
        onClick={() => onFilterChange?.({})}
        className="text-sm font-medium  text-brand-text bg-brand-accentSoft hover:bg-brand-accent/80 rounded-pill px-6 py-2.5 h-full"
      >
        Filters
      </button>
    </div>
  );
}

export default SearchBar;