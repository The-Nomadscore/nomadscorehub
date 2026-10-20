// Live text search against
// curated + geocoded cities is a separate ticket, still TODO.

function SearchBar({ value, onChange, filters, onFilterChange }) {
  function updateFilter(key, num) {
    onFilterChange({ ...filters, [key]: num });
  }

  return (
    <div className="space-y-3">
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
        {/* TODO (next ticket): wire `value` into an actual search against
            curated + geocoded results */}
      </div>

      <div className="flex flex-wrap gap-x-8 gap-y-3 bg-brand-surface border border-brand-border rounded-card px-6 py-4">
        <FilterSlider
          id="filter-internet"
          label="Internet"
          value={filters.minInternet}
          onChange={(v) => updateFilter('minInternet', v)}
        />
        <FilterSlider
          id="filter-cost"
          label="Affordability"
          value={filters.minCostOfLiving}
          onChange={(v) => updateFilter('minCostOfLiving', v)}
        />
        <FilterSlider
          id="filter-safety"
          label="Safety"
          value={filters.minSafety}
          onChange={(v) => updateFilter('minSafety', v)}
        />
      </div>
    </div>
  );
}

function FilterSlider({ id, label, value, onChange }) {
  return (
    <div className="flex items-center gap-3">
      <label htmlFor={id} className="text-sm text-brand-muted w-28 shrink-0">
        {label} {value}+
      </label>
      <input
        id={id}
        type="range"
        min="0"
        max="10"
        step="0.5"
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-40 accent-brand-accent"
      />
    </div>
  );
}

export default SearchBar;