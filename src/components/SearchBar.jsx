// SearchBar.jsx — Day 2 shell (Erick).
// Renders and holds nothing beyond the controlled input; live filtering
// (sliders -> onFilterChange) is the Day 3 ticket, wired search is Day 4.

function SearchBar({ value, onChange, onFilterChange }) {
  return (
    <div className="flex items-center gap-3 bg-brand-surface border border-brand-border rounded-pill px-5 py-3">
      <label htmlFor="city-search" className="sr-only">
        Search cities
      </label>
      <input
        id="city-search"
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Search cities — e.g. Lisbon, Austin"
        className="flex-1 bg-transparent outline-none text-brand-text placeholder:text-brand-muted"
      />

      {/* TODO (Day 3, Erick): filter sliders — minInternet, maxCostOfLiving,
          minSafety — each calling onFilterChange({ ...filters }) */}
      <button
        type="button"
        onClick={() => onFilterChange?.({})}
        className="text-sm text-brand-muted border border-brand-border rounded-pill px-4 py-1.5"
      >
        Filters
      </button>
    </div>
  );
}

export default SearchBar;