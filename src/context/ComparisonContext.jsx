import { createContext, useCallback, useContext, useEffect, useState } from 'react';

const ComparisonContext = createContext(null);

// Up to MAX_COMPARE cities can be compared at once (C1, #144).
export const MAX_COMPARE = 4;

// The compared cities survive a refresh (#112, decision 10 in
// docs/decisions.md). Per-browser on purpose: the owner id itself lives in
// localStorage, so the backend couldn't reach any further.
// The pending "limit reached" pick is never saved.
const STORAGE_KEY = 'nomadscore:comparison';

// Runs once on first render. Reads the current { cityIds } format and the
// older { cityAId, cityBId } format from before C1. Anything unexpected
// (hand-edited, storage blocked in private browsing) falls back to empty.
function loadComparison() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    const raw = Array.isArray(saved?.cityIds) ? saved.cityIds : [saved?.cityAId, saved?.cityBId];
    const ids = raw.filter((id, i, all) => typeof id === 'string' && all.indexOf(id) === i);
    return ids.slice(0, MAX_COMPARE);
  } catch {
    return [];
  }
}

export function ComparisonProvider({ children }) {
  const [cityIds, setCityIds] = useState(loadComparison);
  // A city picked while the list is full waits here until the user
  // chooses which one to replace, or cancels (issue #17, C1).
  const [pendingCityId, setPendingCityId] = useState(null);

  const isFull = cityIds.length >= MAX_COMPARE;

  function selectForCompare(cityId) {
    // Already being compared — nothing to do.
    if (cityIds.includes(cityId)) return;
    if (isFull) {
      setPendingCityId(cityId);
      return;
    }
    setCityIds((ids) => [...ids, cityId]);
  }

  // Swap the pending city into the place of oldCityId, keeping column order.
  function replaceCity(oldCityId) {
    if (pendingCityId === null) return;
    setCityIds((ids) => ids.map((id) => (id === oldCityId ? pendingCityId : id)));
    setPendingCityId(null);
  }

  function cancelReplace() {
    setPendingCityId(null);
  }

  function removeFromCompare(cityId) {
    setCityIds((ids) => ids.filter((id) => id !== cityId));
    // A free spot opened up, so the "limit reached" prompt no longer applies.
    setPendingCityId(null);
  }

  // Removes any compared city that is no longer valid, e.g. a saved pick for
  // a city that was removed from the dataset or from the shortlist since the
  // last visit. isValid(cityId) -> boolean.
  const dropInvalidSlots = useCallback((isValid) => {
    setCityIds((ids) => {
      const kept = ids.filter((id) => isValid(id));
      return kept.length === ids.length ? ids : kept;
    });
    setPendingCityId((id) => (id !== null && !isValid(id) ? null : id));
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ cityIds }));
    } catch {
      // Storage full or blocked: comparison still works for this visit.
    }
  }, [cityIds]);

  return (
    <ComparisonContext.Provider
      value={{
        cityIds,
        pendingCityId,
        isFull,
        maxCompare: MAX_COMPARE,
        selectForCompare,
        replaceCity,
        cancelReplace,
        removeFromCompare,
        dropInvalidSlots,
      }}
    >
      {children}
    </ComparisonContext.Provider>
  );
}

export function useComparison() {
  const ctx = useContext(ComparisonContext);
  if (!ctx) {
    throw new Error('useComparison must be used within a ComparisonProvider');
  }
  return ctx;
}
