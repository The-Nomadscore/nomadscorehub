import { createContext, useContext, useEffect, useState } from 'react';

const ShortlistContext = createContext(null);
const STORAGE_KEY = 'nomadscore:shortlist';

// Runs once on first render. Falls back to an empty list if storage is
// unavailable (private browsing) or holds something unexpected.
function loadShortlist() {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY));
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function ShortlistProvider({ children }) {
  const [shortlistedIds, setShortlistedIds] = useState(loadShortlist);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(shortlistedIds));
    } catch {
      // Storage full or blocked: keep working in memory only.
    }
  }, [shortlistedIds]);

  function addToShortlist(cityId) {
    setShortlistedIds((prev) =>
      prev.includes(cityId) ? prev : [...prev, cityId]
    );
  }

  function removeFromShortlist(cityId) {
    setShortlistedIds((prev) => prev.filter((id) => id !== cityId));
  }

  function isShortlisted(cityId) {
    return shortlistedIds.includes(cityId);
  }

  // Swaps the ids at index and index + direction (-1 for up, 1 for down).
  // No-ops silently if the move would go out of bounds.
  function reorderShortlist(index, direction) {
    setShortlistedIds((prev) => {
      const target = index + direction;
      if (target < 0 || target >= prev.length) return prev;
      const next = [...prev];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  }

  return (
    <ShortlistContext.Provider
      value={{
        shortlistedIds,
        addToShortlist,
        removeFromShortlist,
        isShortlisted,
        reorderShortlist,
      }}
    >
      {children}
    </ShortlistContext.Provider>
  );
}

export function useShortlist() {
  const ctx = useContext(ShortlistContext);
  if (!ctx) {
    throw new Error('useShortlist must be used within a ShortlistProvider');
  }
  return ctx;
}