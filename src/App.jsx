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

  const { shortlistedIds, addToShortlist, removeFromShortlist, isShortlisted } =
    useShortlist();
  const { cityAId, cityBId, selectForCompare, removeFromCompare } =
    useComparison();

  function handleToggleShortlist(cityId) {
    isShortlisted(cityId) ? removeFromShortlist(cityId) : addToShortlist(cityId);
  }

  const selectedCity = allCities.find((c) => c.id === selectedCityId) ?? null;
  const shortlistedCities = allCities.filter((c) => shortlistedIds.includes(c.id));
  const cityA = allCities.find((c) => c.id === cityAId) ?? null;
  const cityB = allCities.find((c) => c.id === cityBId) ?? null;

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
          onFilterChange={() => {}}
        />

        {error && <ErrorBanner error={error} onRetry={refetch} />}
        {loading && !error && <CitySkeletonGrid />}
        {!loading && !error && (
          <CityGrid
            cities={allCities}
            shortlistedIds={shortlistedIds}
            onToggleShortlist={handleToggleShortlist}
            onOpenDetail={setSelectedCityId}
          />
        )}
      </main>

      <ShortlistDrawer
        cities={shortlistedCities}
        onRemove={removeFromShortlist}
        onSelectForCompare={selectForCompare}
        isOpen={isShortlistOpen}
        onClose={() => setIsShortlistOpen(false)}
      />

      <CityDetailModal city={selectedCity} onClose={() => setSelectedCityId(null)} />

      <ComparisonDrawer
        cityA={cityA}
        cityB={cityB}
        onRemove={removeFromCompare}
        isOpen={isCompareOpen}
        onClose={() => setIsCompareOpen(false)}
      />
    </div>
  );
}

export default App;