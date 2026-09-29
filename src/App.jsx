import { useState } from 'react';
import { useShortlist } from './context/ShortlistContext.jsx';
import { useComparison } from './context/ComparisonContext.jsx';
import { useAsync } from './hooks/useAsync.js';
import { getCities } from './services/api.js';
import SearchBar from './components/SearchBar.jsx';
import CityGrid from './components/CityGrid.jsx';
import CitySkeletonGrid from './components/CitySkeletonGrid.jsx';
import ErrorBanner from './components/ErrorBanner.jsx';
import ShortlistDrawer from './components/ShortlistDrawer.jsx';
import CityDetailModal from './components/CityDetailModal.jsx';
import ComparisonDrawer from './components/ComparisonDrawer.jsx';

function App() {
  const { data: cities, loading, error, refetch } = useAsync(() => getCities(), []);
  const allCities = cities ?? [];

  const [searchValue, setSearchValue] = useState('');
  const [selectedCityId, setSelectedCityId] = useState(null);
  const [isShortlistOpen, setIsShortlistOpen] = useState(false);
  const [isCompareOpen, setIsCompareOpen] = useState(false);

  const [filters, setFilters] = useState({
    minInternet: 0,
    minCostOfLiving: 0,
    minSafety: 0,
  });

  const filtersActive =
    filters.minInternet > 0 || filters.minCostOfLiving > 0 || filters.minSafety > 0;

  function getScore(city, metricName) {
    return city.scores.find((s) => s.name === metricName)?.scoreOutOf10 ?? 0;
  }

  const visibleCities = allCities.filter((city) => {
    // Cities without curated scores (e.g. future search results) can't be
    // meaningfully filtered, so hide them while any filter is active rather
    // than showing them as false matches.
    if (!city.hasScores) return !filtersActive;

    return (
      getScore(city, 'Internet Access') >= filters.minInternet &&
      getScore(city, 'Cost of Living') >= filters.minCostOfLiving &&
      getScore(city, 'Safety') >= filters.minSafety
    );
  });

  const { shortlistedIds, addToShortlist, removeFromShortlist, isShortlisted } =
    useShortlist();
  const {
    cityAId,
    cityBId,
    pendingCityId,
    selectForCompare,
    replaceSlot,
    cancelReplace,
    removeFromCompare,
  } = useComparison();

  function handleToggleShortlist(cityId) {
    isShortlisted(cityId) ? removeFromShortlist(cityId) : addToShortlist(cityId);
  }

  const selectedCity = allCities.find((c) => c.id === selectedCityId) ?? null;
  const shortlistedCities = allCities.filter((c) => shortlistedIds.includes(c.id));
  const cityA = allCities.find((c) => c.id === cityAId) ?? null;
  const cityB = allCities.find((c) => c.id === cityBId) ?? null;
  const pendingCity = allCities.find((c) => c.id === pendingCityId) ?? null;

  // Comparison needs scores, so only cities with hasScores can fill a slot.
  // Picking one also opens the drawer so the user sees the slot fill (or
  // the replace prompt when both slots are full).
  function handleSelectForCompare(cityId) {
    const city = allCities.find((c) => c.id === cityId);
    if (!city?.hasScores) return;
    selectForCompare(cityId);
    setIsCompareOpen(true);
  }

  return (
    <div className="min-h-screen flex flex-col">
      <header className="flex items-center justify-between border-b border-brand-border px-6 py-4">
        <h1 className="font-display text-2xl text-brand-text">NomadScore</h1>
        <div className="flex items-center gap-4">
          <button
            onClick={() => setIsShortlistOpen((v) => !v)}
            className="text-sm text-brand-muted"
          >
            Shortlist ({shortlistedCities.length})
          </button>
          <button
            onClick={() => setIsCompareOpen((v) => !v)}
            className="text-sm text-brand-muted"
          >
            Compare
          </button>
          <button className="px-5 py-2 rounded-pill bg-brand-accent text-brand-bg font-medium">
            Log in
          </button>
        </div>
      </header>

      <main className="flex-1 px-6 py-8 space-y-6">
        <SearchBar
          value={searchValue}
          onChange={setSearchValue}
          filters={filters}
          onFilterChange={setFilters}
        />

        {error && <ErrorBanner error={error} onRetry={refetch} />}
        {loading && !error && <CitySkeletonGrid />}
        {!loading && !error && (
          <CityGrid
            cities={visibleCities}
            shortlistedIds={shortlistedIds}
            onToggleShortlist={handleToggleShortlist}
            onOpenDetail={setSelectedCityId}
          />
        )}
      </main>

      <ShortlistDrawer
        cities={shortlistedCities}
        onRemove={removeFromShortlist}
        onSelectForCompare={handleSelectForCompare}
        isOpen={isShortlistOpen}
        onClose={() => setIsShortlistOpen(false)}
      />

      <CityDetailModal city={selectedCity} onClose={() => setSelectedCityId(null)} />

      <ComparisonDrawer
        cityA={cityA}
        cityB={cityB}
        pendingCity={pendingCity}
        onRemove={removeFromCompare}
        onReplace={replaceSlot}
        onCancelReplace={cancelReplace}
        isOpen={isCompareOpen}
        onClose={() => setIsCompareOpen(false)}
      />
    </div>
  );
}

export default App;