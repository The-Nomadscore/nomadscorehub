import { useEffect, useState } from 'react';
import { useShortlist } from './context/ShortlistContext.jsx';
import { useComparison } from './context/ComparisonContext.jsx';
import { useAsync } from './hooks/useAsync.js';
import { getCities } from './services/api.js';
import { MOCK_ITINERARIES } from './services/mockItineraries.js';
import SearchBar from './components/SearchBar.jsx';
import CityGrid from './components/CityGrid.jsx';
import CitySkeletonGrid from './components/CitySkeletonGrid.jsx';
import ErrorBanner from './components/ErrorBanner.jsx';
import ShortlistDrawer from './components/ShortlistDrawer.jsx';
import CityDetailModal from './components/CityDetailModal.jsx';
import ComparisonDrawer from './components/ComparisonDrawer.jsx';
import ItineraryList from './components/ItineraryList.jsx';
import ItineraryForm from './components/ItineraryForm.jsx';

function App() {
  const { data: cities, loading, error, refetch } = useAsync(() => getCities(), []);
  const allCities = cities ?? [];

  const [searchValue, setSearchValue] = useState('');
  const [selectedCityId, setSelectedCityId] = useState(null);
  const [isShortlistOpen, setIsShortlistOpen] = useState(false);
  const [isCompareOpen, setIsCompareOpen] = useState(false);

  // Itineraries (mock data for now; wired to the API later).
  const [isItinerariesOpen, setIsItinerariesOpen] = useState(false);
  const [itineraries, setItineraries] = useState(MOCK_ITINERARIES);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingItinerary, setEditingItinerary] = useState(null);

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

const query = searchValue.trim().toLowerCase();

const visibleCities = allCities.filter((city) => {
  const matchesQuery =
    !query ||
    city.name.toLowerCase().includes(query) ||
    city.fullName.toLowerCase().includes(query);

  if (!matchesQuery) return false;

  // Cities without curated scores can't be meaningfully filtered by metric,
  // so hide them while any slider filter is active rather than showing
  // false matches.
  if (!city.hasScores) return !filtersActive;

  return (
    getScore(city, 'Internet Access') >= filters.minInternet &&
    getScore(city, 'Cost of Living') >= filters.minCostOfLiving &&
    getScore(city, 'Safety') >= filters.minSafety
  );
});

  const { shortlistedIds, addToShortlist, removeFromShortlist, isShortlisted, reorderShortlist, isLoading: shortlistLoading, error: shortlistError, reload: reloadShortlist } =
    useShortlist();
  const {
    cityAId,
    cityBId,
    pendingCityId,
    selectForCompare,
    replaceSlot,
    cancelReplace,
    removeFromCompare,
    dropInvalidSlots,
  } = useComparison();

  // Compare picks are saved across refreshes (#112). Keep a saved pick only if
  // the city still exists, has scores, and is still shortlisted. Waits until
  // cities AND shortlist have loaded without errors, so a slow or failed
  // request never wipes a valid pick.
  useEffect(() => {
    if (loading || error || shortlistLoading || shortlistError) return;
    dropInvalidSlots((cityId) => {
      const city = cities?.find((c) => c.id === cityId);
      return Boolean(city?.hasScores) && shortlistedIds.includes(cityId);
    });
  }, [loading, error, shortlistLoading, shortlistError, cities, shortlistedIds, dropInvalidSlots]);
  //Removing a shortlisted city also clears it out of an active compare slot, if it's sitting in one.
  function handleRemoveFromShortlist(cityId) {
  removeFromShortlist(cityId);
  if (cityId === cityAId) removeFromCompare('A');
  else if (cityId === cityBId) removeFromCompare('B');
  }
  function handleToggleShortlist(cityId) {
    if (isShortlisted(cityId)) {
    handleRemoveFromShortlist(cityId);
    } else {
    addToShortlist(cityId);
  }
  }

  const selectedCity = allCities.find((c) => c.id === selectedCityId) ?? null;
  const shortlistedCities = shortlistedIds.map((id) => allCities.find((c) => c.id === id)).filter(Boolean);
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

  // --- Itinerary handlers (local state only until the API is wired up) ---
  function handleToggleItineraries() {
    setIsItinerariesOpen((v) => !v);
    setIsFormOpen(false);
    setEditingItinerary(null);
  }

  function handleCreateItinerary() {
    setEditingItinerary(null);
    setIsFormOpen(true);
  }

  function handleEditItinerary(itineraryId) {
    setEditingItinerary(itineraries.find((it) => it.id === itineraryId) ?? null);
    setIsFormOpen(true);
  }

  function handleDeleteItinerary(itineraryId) {
    if (!window.confirm('Delete this itinerary?')) return;
    setItineraries((list) => list.filter((it) => it.id !== itineraryId));
  }

  function handleCancelItineraryForm() {
    setIsFormOpen(false);
    setEditingItinerary(null);
  }

  function handleSubmitItinerary(values) {
    if (editingItinerary) {
      setItineraries((list) =>
        list.map((it) => (it.id === editingItinerary.id ? { ...it, ...values } : it))
      );
    } else {
      setItineraries((list) => {
        const nextId = list.reduce((max, it) => Math.max(max, it.id), 0) + 1;
        return [...list, { id: nextId, ...values }];
      });
    }
    handleCancelItineraryForm();
  }

  return (
    <div className="min-h-screen flex flex-col">
      <header className="flex items-center justify-between border-b border-brand-border px-6 py-4">
        <h1 className="font-display text-2xl text-brand-text">NomadScore</h1>
        <div className="flex items-center gap-4">
          <button
            onClick={handleToggleItineraries}
            className="text-sm text-brand-muted hover:text-brand-text transition-colors"
          >
            {isItinerariesOpen ? 'Cities' : 'Itineraries'}
          </button>
          <button
            onClick={() => setIsShortlistOpen((v) => !v)}
            className="text-sm text-brand-muted hover:text-brand-text transition-colors"
          >
            Shortlist ({shortlistedCities.length})
          </button>
          <button
            onClick={() => setIsCompareOpen((v) => !v)}
            className="text-sm text-brand-muted hover:text-brand-text transition-colors"
          >
            Compare
          </button>
          <button className="px-5 py-2 rounded-pill bg-brand-accent text-brand-bg font-medium hover:opacity-90 transition-opacity">
            Log in
          </button>
        </div>
      </header>

      <main className="flex-1 px-6 py-8 space-y-6">
        {shortlistError && (
          <ErrorBanner error={shortlistError} onRetry={reloadShortlist} />
        )}
        {isItinerariesOpen ? (
          isFormOpen ? (
            <ItineraryForm
              key={editingItinerary?.id ?? 'new'}
              initialValues={editingItinerary}
              cities={allCities}
              onSubmit={handleSubmitItinerary}
              onCancel={handleCancelItineraryForm}
            />
          ) : (
            <ItineraryList
              itineraries={itineraries}
              cities={allCities}
              onCreate={handleCreateItinerary}
              onEdit={handleEditItinerary}
              onDelete={handleDeleteItinerary}
            />
          )
        ) : (
          <>
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
          </>
        )}
      </main>

      <ShortlistDrawer
        cities={shortlistedCities}
        onRemove={handleRemoveFromShortlist}
        onReorder={reorderShortlist}
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