// App.jsx — Day 2, fully wired against mock data.
// This is the reference integration every engineer's real component
// (Day 3-4) should slot into without changing this file's shape.

import { useEffect, useState } from 'react';
import { useShortlist } from './context/ShortlistContext.jsx';
import { useComparison } from './context/ComparisonContext.jsx';
import { searchCities } from './services/api.js';
import SearchBar from './components/SearchBar.jsx';
import CityGrid from './components/CityGrid.jsx';
import ShortlistDrawer from './components/ShortlistDrawer.jsx';
import CityDetailModal from './components/CityDetailModal.jsx';
import ComparisonDrawer from './components/ComparisonDrawer.jsx';
import { MOCK_CITIES } from './services/mockData.js';

function App() {
  const [cities, setCities] = useState([]);
  const [searchValue, setSearchValue] = useState('');
  // TODO: I will remove this later, because api.js has bugs (It's bypassing USE_MOCK = true)
  const [searchResults, setSearchResults] = useState([]);
  const [selectedCityId, setSelectedCityId] = useState(null);
  const [isShortlistOpen, setIsShortlistOpen] = useState(false);
  const [isCompareOpen, setIsCompareOpen] = useState(false);

  const { shortlistedIds, addToShortlist, removeFromShortlist, isShortlisted } =
    useShortlist();
  const { cityAId, cityBId, selectForCompare, removeFromCompare } =
    useComparison();

  useEffect(() => {
    // TODO: getCities() has bugs, have set Mock_CITIES for now, will fix once apiJS is set.
    // getCities().then(setCities);
    setCities(MOCK_CITIES)

    // TODO (Day 3, Cindy): loading/error states via a shared useAsync hook
  }, []);

  function handleToggleShortlist(cityId) {
    isShortlisted(cityId) ? removeFromShortlist(cityId) : addToShortlist(cityId);
  }

  // search cities
  useEffect(() => {
    // TODO: temporary solution, apiJS has bugs will write the right code once fixed
    // Have also added a new state for search results (temporary), because compare & shortlist features are breaking
    const results = cities.filter((c) => c.fullName.toLowerCase().includes(searchValue.trim().toLowerCase()))

    setSearchResults(results)
  }, [searchValue])

  const selectedCity = cities.find((c) => c.id === selectedCityId) ?? null;
  const shortlistedCities = cities.filter((c) => shortlistedIds.includes(c.id));
  const cityA = cities.find((c) => c.id === cityAId) ?? null;
  const cityB = cities.find((c) => c.id === cityBId) ?? null;

  return (
    <div className="min-h-screen flex flex-col">
      <header className="flex items-center justify-between border-b border-brand-border px-6 py-4">

        <h1 className="font-logo font-medium text-2xl text-brand-bg">NomadScore</h1>

        <div className="flex items-center gap-4">
          <button
            onClick={() => setIsShortlistOpen((v) => !v)}
            className="text-md font-medium text-brand-bg"
          >
            Shortlist ({shortlistedIds.length})
          </button>
          <button
            onClick={() => setIsCompareOpen((v) => !v)}
            className="text-md font-medium text-brand-bg"
          >
            Compare
          </button>
          <button className="px-5 py-2.5 rounded-pill bg-brand-bg text-white font-medium">
            Sign in
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
          cities={searchValue.length === 0 ? cities : searchResults}
          shortlistedIds={shortlistedIds}
          onToggleShortlist={handleToggleShortlist}
          onOpenDetail={setSelectedCityId}
          searchTerm={searchValue}
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