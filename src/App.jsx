import { useEffect, useRef, useState } from 'react';
import { useShortlist } from './context/ShortlistContext.jsx';
import { useComparison } from './context/ComparisonContext.jsx';
import { useAsync } from './hooks/useAsync.js';
import {
  getCities,
  fetchItineraries,
  createItinerary,
  updateItinerary,
  deleteItinerary,
} from './services/api.js';
import SearchBar from './components/SearchBar.jsx';
import CityGrid from './components/CityGrid.jsx';
import CitySkeletonGrid from './components/CitySkeletonGrid.jsx';
import ErrorBanner from './components/ErrorBanner.jsx';
import ShortlistDrawer from './components/ShortlistDrawer.jsx';
import CityDetailModal from './components/CityDetailModal.jsx';
import ComparisonDrawer from './components/ComparisonDrawer.jsx';
import ItineraryList from './components/ItineraryList.jsx';
import ItineraryForm from './components/ItineraryForm.jsx';
import ItinerarySkeleton from './components/ItinerarySkeleton.jsx';

function App() {
  const { data: cities, loading, error, refetch } = useAsync(() => getCities(), []);
  const allCities = cities ?? [];

  const [searchValue, setSearchValue] = useState('');
  const [selectedCityId, setSelectedCityId] = useState(null);
  const [isShortlistOpen, setIsShortlistOpen] = useState(false);
  const [isCompareOpen, setIsCompareOpen] = useState(false);

  // Itineraries (loaded from the Flask API).
  const {
    data: itinerariesData,
    loading: itinerariesLoading,
    error: itinerariesError,
    refetch: refetchItineraries,
  } = useAsync(() => fetchItineraries(), []);
  const itineraries = itinerariesData ?? [];

  const [isItinerariesOpen, setIsItinerariesOpen] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingItinerary, setEditingItinerary] = useState(null);
  // D4: city to pre-fill when the form is opened from "Plan a trip".
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

  // --- Itinerary handlers ---

  // Runs one save to the server, one at a time. On success it reloads the
  // list from the server and calls onSuccess. On failure it shows a banner
  // whose Retry button runs the same save again.
  async function runAction(action, failMessage, onSuccess) {
    if (savingRef.current) return;
    savingRef.current = true;
    setActionError(null);
    retryRef.current = () => runAction(action, failMes