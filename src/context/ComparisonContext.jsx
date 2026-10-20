import { createContext, useCallback, useContext, useEffect, useState } from 'react';

const ComparisonContext = createContext(null);

// The two compare slots survive a refresh (#112, decision 10 in
// docs/decisions.md). Per-browser on purpose: the owner id itself lives in
// localStorage, so the backend couldn't reach any further.
// The pending "replace which one?" pick is never saved.
const STORAGE_KEY = 'nomadscore:comparison';

// Runs once on first render. Anything unexpected (old format, hand-edited,
// storage blocked in private browsing) falls back to empty slots.
function loadComparison() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    const a = typeof saved?.cityAId === 'string' ? saved.cityAId : null;
    const b = typeof saved?.cityBId === 'string' && saved.cityBId !== a ? saved.cityBId : null;
    return { cityAId: a, cityBId: b };
  } catch {
    return { cityAId: null, cityBId: null };
  }
}

export function ComparisonProvider({ children }) {
  const [saved] = useState(loadComparison);
  const [cityAId, setCityAId] = useState(saved.cityAId);
  const [cityBId, setCityBId] = useState(saved.cityBId);
  // A 3rd city picked while both slots are full waits here until the
  // user chooses which slot to replace (issue #17).
  const [pendingCityId, setPendingCityId] = useState(null);

  function selectForCompare(cityId) {
    // Already being compared — nothing to do.
    if (cityId === cityAId || cityId === cityBId) return;

    if (cityAId === null) {
      setCityAId(cityId);
    } else if (cityBId === null) {
      setCityBId(cityId);
    } else {
      // Both slots full — ask the user which one to replace.
      setPendingCityId(cityId);
    }
  }

  function replaceSlot(slot) {
    if (pendingCityId === null) return;
    if (slot === 'A') setCityAId(pendingCityId);
    else setCityBId(pendingCityId);
    setPendingCityId(null);
  }

  function cancelReplace() {
    setPendingCityId(null);
  }

  function removeFromCompare(slot) {
    if (slot === 'A') setCityAId(null);
    else setCityBId(null);
  }

  // Empties any slot whose city is no longer valid, e.g. a saved pick for a
  // city that was removed from the dataset or from the shortlist since the
  // last visit. isValid(cityId) -> boolean.
  const dropInvalidSlots = useCallback((isValid) => {
    setCityAId((id) => (id !== null && !isValid(id) ? null : id));
    setCityBId((id) => (id !== null && !isValid(id) ? null : id));
    setPendingCityId((id) => (id !== null && !isValid(id) ? null : id));
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ cityAId, cityBId }));
    } catch {
      // Storage full or blocked: comparison still works for this visit.
    }
  }, [cityAId, cityBId]);

  return (
    <ComparisonContext.Provider
      value={{
        cityAId,
        cityBId,
        pendingCityId,
        selectForCompare,
        replaceSlot,
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
