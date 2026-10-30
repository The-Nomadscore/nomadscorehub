import { useEffect, useRef, useState } from 'react';
import { useShortlist } from './context/ShortlistContext.jsx';
import { useComparison } from './context/ComparisonContext.jsx';
import { useAsync } from './hooks/useAsync.js';
import { Link } from 'react-router-dom';
import {
  getCities,
  fetchItineraries,
  createItinerary,
  updateItinerary,
  deleteItinerary,
} from './services/api.js';
import SearchBar from './components/SearchBar.jsx';
import CityGrid from './components/CityGrid.jsx';
import Pagination from './components/Pagination.jsx';
import { paginate } from './utils/paginate.js';
import CitySkeletonGrid from './components/CitySkeletonGrid.jsx';
import ErrorBanner from './components/ErrorBanner.jsx';
import ShortlistDrawer from './components/ShortlistDrawer.jsx';
import CityDetailModal from './components/CityDetailModal.jsx';
import ComparisonDrawer from './components/ComparisonDrawer.jsx';
import ItineraryList from './components/ItineraryList.jsx';
import ItineraryForm from './components/ItineraryForm.jsx';
import ItinerarySkeleton from './components/ItinerarySkeleton.jsx';
import { useAuth } from './context/AuthContext.jsx';
import AccountControls from './components/AccountControls.jsx';
import SessionExpiredBanner from './components/SessionExpiredBanner.jsx';

// 6 = two full rows of the 3-column grid on desktop (C2, #145).
const CITIES_PER_PAGE = 6;

function App() {
  const {
    isLoading: authLoading,
    isAuthenticated,
    user,
    logout,
    sessionExpired,
    dismissSessionExpired,
  } = useAuth();
  const { data: cities, loading, error, refetch } = useAsync(() => getCities(), []);
  const allCities = cities ?? [];

  const [searchValue, setSearchValue] = useState('');
  // C2 (#145): the cities list is paged in the browser.
  const [page, setPage] = useState(1);
  const gridTopRef = useRef(null);
  const [selectedCityId, setSelectedCityId] = useState(null);
  const [isShortlistOpen, setIsShortlistOpen] = useState(false);
  const [isCompareOpen, setIsCompareOpen] = useState(false);

  // Itineraries (loaded from the Flask API). They need a login, so guests get
  // an empty list without calling the API. The request runs again whenever
  // the sign-in state changes (login, logout, saved token confirmed).
  const {
    data: itinerariesData,
    loading: itinerariesLoading,
    error: itinerariesError,
    refetch: refetchItineraries,
  } = useAsync(
    () => (isAuthenticated ? fetchItineraries() : Promise.resolve([])),
    [isAuthenticated]
  );
  const itineraries = itinerariesData ?? [];

  const [isItinerariesOpen, setIsItinerariesOpen] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingItinerary, setEditingItinerary] = useState(null);

  const [preselectedCityId, setPreselectedCityId] = useState(null);

  // Errors from saving (create / edit / delete), plus a way to retry them.
  const [actionError, setActionError] = useState(null);
  const retryRef = useRef(null);
  const savingRef = useRef(false);

  const [filters, setFilters] = useState({
    minInternet: 0,
    minCostOfLiving: 0,
    minSafety: 0,
  });

  // A new search or filter changes which cities match, so start again at page 1.
  function handleSearchChange(value) {
    setSearchValue(value);
    setPage(1);
  }

  function handleFilterChange(next) {
    setFilters(next);
    setPage(1);
  }

  function handlePageChange(nextPage) {
    setPage(nextPage);
    gridTopRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

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

  // paginate() clamps the page, so a page that no longer exists shows the last one.
  const cityPage = paginate(visibleCities, page, CITIES_PER_PAGE);

  const {
    shortlistedIds,
    addToShortlist,
    removeFromShortlist,
    isShortlisted,
    reorderShortlist,
    isLoading: shortlistLoading,
    error: shortlistError,
    reload: reloadShortlist,
  } = useShortlist();
  const {
    cityIds: compareIds,
    pendingCityId,
    maxCompare,
    selectForCompare,
    replaceCity,
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

  // Removing a shortlisted city also clears it out of an active compare slot, if it's sitting in one.
  function handleRemoveFromShortlist(cityId) {
    removeFromShortlist(cityId);
    if (compareIds.includes(cityId)) removeFromCompare(cityId);
  }

  function handleToggleShortlist(cityId) {
    if (isShortlisted(cityId)) {
      handleRemoveFromShortlist(cityId);
    } else {
      addToShortlist(cityId);
    }
  }

  const selectedCity = allCities.find((c) => c.id === selectedCityId) ?? null;
  const shortlistedCities = shortlistedIds
    .map((id) => allCities.find((c) => c.id === id))
    .filter(Boolean);
  const compareCities = compareIds.map((id) => allCities.find((c) => c.id === id)).filter(Boolean);
  const pendingCity = allCities.find((c) => c.id === pendingCityId) ?? null;

  // Comparison needs scores, so only cities with hasScores can be compared.
  // Picking one also opens the drawer so the user sees the column appear (or
  // the "limit reached" message when 4 cities are already compared).
  function handleSelectForCompare(cityId) {
    const city = allCities.find((c) => c.id === cityId);
    if (!city?.hasScores) return;
    selectForCompare(cityId);
    setIsCompareOpen(true);
  }

  // --- Itinerary handlers ---

  // Runs one save to the server, one at a time. On success it reloads the
  // list from the server and calls onSuccess. On failure it shows a banner
  // whose Retry button runs the same save again.
  async function runAction(action, failMessage, onSuccess) {
    if (savingRef.current) return;
    savingRef.current = true;
    setActionError(null);
    retryRef.current = () => runAction(action, failMessage, onSuccess);
    try {
      await action();
      refetchItineraries();
      if (onSuccess) onSuccess();
    } catch (err) {
      setActionError({ status: err.status ?? null, message: failMessage });
    } finally {
      savingRef.current = false;
    }
  }

  function handleToggleItineraries() {
    setIsItinerariesOpen((v) => !v);
    setIsFormOpen(false);
    setEditingItinerary(null);
    setPreselectedCityId(null);
    setActionError(null);
  }

  function handleCreateItinerary() {
    setActionError(null);
    setEditingItinerary(null);
    setPreselectedCityId(null);
    setIsFormOpen(true);
  }

  // D4: "Plan a trip" from the city detail modal or the shortlist drawer.
  // Closes the overlays, switches to the Itineraries view and opens the
  // create form with the city pre-selected.
  function handlePlanTrip(cityId) {
    setSelectedCityId(null);
    setIsShortlistOpen(false);
    setIsCompareOpen(false);
    setActionError(null);
    setEditingItinerary(null);
    setPreselectedCityId(cityId);
    setIsItinerariesOpen(true);
    setIsFormOpen(true);
  }

  function handleEditItinerary(itineraryId) {
    setActionError(null);
    setEditingItinerary(itineraries.find((it) => it.id === itineraryId) ?? null);
    setIsFormOpen(true);
  }

  function handleDeleteItinerary(itineraryId) {
    if (!window.confirm('Delete this itinerary?')) return;
    runAction(
      () => deleteItinerary(itineraryId),
      "Couldn't delete the itinerary. Try again."
    );
  }

  function handleCancelItineraryForm() {
    setIsFormOpen(false);
    setEditingItinerary(null);
    setPreselectedCityId(null);
    setActionError(null);
  }

  function closeItineraryForm() {
    setIsFormOpen(false);
    setEditingItinerary(null);
    setPreselectedCityId(null);
  }

  function handleSubmitItinerary(values) {
    if (editingItinerary) {
      runAction(
        () => updateItinerary(editingItinerary.id, values),
        "Couldn't save your changes. Try again.",
        closeItineraryForm
      );
    } else {
      runAction(
        () => createItinerary(values),
        "Couldn't create the itinerary. Try again.",
        closeItineraryForm
      );
    }
  }

  // Guests (and the moment before a saved login is confirmed) see a prompt
  // instead of the itinerary list.
  const itinerariesNeedLogin = !authLoading && !isAuthenticated;

  return (
    <div className="min-h-screen flex flex-col">
      <header className="flex items-center justify-between border-b border-brand-border px-6 py-4">
        <h1 className="font-display text-2xl text-brand-text">
          <Link
            to="/"
            className="focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-accent"
          >
            NomadScore
          </Link>
        </h1>
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
          <AccountControls
            isLoading={authLoading}
            isAuthenticated={isAuthenticated}
            email={user?.email ?? ''}
            onSignOut={logout}
          />
        </div>
      </header>

      <main className="flex-1 px-6 py-8 space-y-6">
        {sessionExpired && <SessionExpiredBanner onDismiss={dismissSessionExpired} />}
        {shortlistError && (
          <ErrorBanner error={shortlistError} onRetry={reloadShortlist} />
        )}
        {isItinerariesOpen ? (
          <>
            {actionError && (
              <ErrorBanner
                error={actionError}
                onRetry={() => retryRef.current?.()}
              />
            )}
            {itinerariesNeedLogin ? (
              <div className="rounded-lg border border-brand-border p-8 text-center space-y-3">
                <p className="text-brand-text">Sign in to plan and save your trips.</p>
                <p className="text-sm text-brand-muted">
                  Your shortlist works without an account, but itineraries are saved to your
                  account.
                </p>
                <Link
                  to="/login"
                  className="inline-block text-sm text-brand-accent hover:underline"
                >
                  Sign in
                </Link>
              </div>
            ) : isFormOpen ? (
              <ItineraryForm
                key={`${editingItinerary?.id ?? 'new'}-${preselectedCityId ?? ''}`}
                initialValues={editingItinerary}
                preselectedCityId={preselectedCityId}
                cities={allCities}
                onSubmit={handleSubmitItinerary}
                onCancel={handleCancelItineraryForm}
              />
            ) : itinerariesError ? (
              <ErrorBanner error={itinerariesError} onRetry={refetchItineraries} />
            ) : authLoading || itinerariesLoading || loading ? (
              <ItinerarySkeleton />
            ) : (
              <ItineraryList
                itineraries={itineraries}
                cities={allCities}
                onCreate={handleCreateItinerary}
                onEdit={handleEditItinerary}
                onDelete={handleDeleteItinerary}
              />
            )}
          </>
        ) : (
          <>
            <SearchBar
              value={searchValue}
              onChange={handleSearchChange}
              filters={filters}
              onFilterChange={handleFilterChange}
            />

            {/* Scroll target when the page changes. */}
            <div ref={gridTopRef} className="scroll-mt-24" />

            {error && <ErrorBanner error={error} onRetry={refetch} />}
            {loading && !error && <CitySkeletonGrid />}
            {!loading && !error && (
              <>
                <CityGrid
                  cities={cityPage.items}
                  shortlistedIds={shortlistedIds}
                  onToggleShortlist={handleToggleShortlist}
                  onOpenDetail={setSelectedCityId}
                />
                <Pagination
                  page={cityPage.page}
                  pageCount={cityPage.pageCount}
                  total={cityPage.total}
                  start={cityPage.start}
                  end={cityPage.end}
                  onPageChange={handlePageChange}
                />
              </>
            )}
          </>
        )}
      </main>

      <ShortlistDrawer
        cities={shortlistedCities}
        onRemove={handleRemoveFromShortlist}
        onReorder={reorderShortlist}
        onSelectForCompare={handleSelectForCompare}
        onPlanTrip={handlePlanTrip}
        isOpen={isShortlistOpen}
        onClose={() => setIsShortlistOpen(false)}
      />

      <CityDetailModal
        city={selectedCity}
        onClose={() => setSelectedCityId(null)}
        onPlanTrip={handlePlanTrip}
      />

      <ComparisonDrawer
        cities={compareCities}
        maxCompare={maxCompare}
        pendingCity={pendingCity}
        onRemove={removeFromCompare}
        onReplace={replaceCity}
        onCancelReplace={cancelReplace}
        isOpen={isCompareOpen}
        onClose={() => setIsCompareOpen(false)}
      />
    </div>
  );
}

export default App;