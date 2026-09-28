// App.jsx — Day 2, fully wired against mock data.
// This is the reference integration every engineer's real component
// (Day 3-4) should slot into without changing this file's shape.

import { useEffect, useState } from 'react';
import { useShortlist } from './context/ShortlistContext.jsx';
import { useComparison } from './context/ComparisonContext.jsx';
import { getCities } from './services/api.js';
import SearchBar from './components/SearchBar.jsx';
import CityGrid from './components/CityGrid.jsx';
import ShortlistDrawer from './components/ShortlistDrawer.jsx';
import CityDetailModal from './components/CityDetailModal.jsx';
import ComparisonDrawer from './components/ComparisonDrawer.jsx';

function App() {
  const [cities, setCities] = useState([]);
  const [searchValue, setSearchValue] = useState('');
  const [selectedCityId, setSelectedCityId] = useState(null);
  const [isShortlistOpen, setIsShortlistOpen] = useState(false);
  const [isCompareOpen, setIsCompareOpen] = useState(false);

  const { shortlistedIds, addToShortlist, removeFromShortlist, isShortlisted } =
    useShortlist();
  const { cityAId, cityBId, selectForCompare, removeFromCompare } =
    useComparison();

  useEffect(() => {
    getCities().then(setCities);
    // TODO (Day 3, Cindy): loading/error states via a shared useAsync hook
  }, []);

  function handleToggleShortlist(cityId) {
    isShortlisted(cityId) ? removeFromShortlist(cityId) : addToShortlist(cityId);
  }

  const selectedCity = cities.find((c) => c.id === selectedCityId) ?? null;
  const shortlistedCities = cities.filter((c) => shortlistedIds.includes(c.id));
  const cityA = cities.find((c) => c.id === cityAId) ?? null;
  const cityB = cities.find((c) => c.id === cityBId) ?? null;

  return (
    <div className="min-h-screen flex flex-col">
      <header className="flex items-center justify-between border-b border-brand-border px-6 py-4">
        <h1 className="font-display text-2xl text-brand-text">NomadScore</h1>
        <div className="flex items-center gap-4">
          <button
            onClick={() => setIsShortlistOpen((v) => !v)}
            className="text-sm text-brand-muted"
          >
            Shortlist ({shortlistedIds.length})
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
        <CityGrid
          cities={cities}
          shortlistedIds={shortlistedIds}
          onToggleShortlist={handleToggleShortlist}
          onOpenDetail={setSelectedCityId}
        />
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