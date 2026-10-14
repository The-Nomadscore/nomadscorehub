import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { addShortlistItem, fetchShortlist, removeShortlistItem, saveShortlistOrder } from '../services/api.js';

const ShortlistContext = createContext(null);

export function ShortlistProvider({ children }) {
  const [shortlistedIds, setShortlistedIds] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Refs give async code the latest values (state would be stale there).
  const idsRef = useRef([]);
  const confirmedRef = useRef([]); // last list the server confirmed
  const queueRef = useRef(Promise.resolve());
  const pendingRef = useRef(0);
  const failedRef = useRef(false);

  const applyIds = useCallback((next) => {
    idsRef.current = next;
    setShortlistedIds(next);
  }, []);

  const loadFromServer = useCallback(async () => {
    const items = await fetchShortlist();
    const ids = [...items]
      .sort((a, b) => a.position - b.position)
      .map((item) => item.city_id);
    confirmedRef.current = ids;
    applyIds(ids);
  }, [applyIds]);

  useEffect(() => {
    let cancelled = false;
    loadFromServer()
      .catch((err) => {
        if (!cancelled) setError(err);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [loadFromServer]);

  async function reload() {
    setError(null);
    try {
      await loadFromServer();
    } catch (err) {
      setError(err);
    }
  }

  function clearError() {
    setError(null);
  }

  // Updates the screen first, then saves. Requests run one at a time, in
  // order. On failure, roll back to the last server-confirmed list.
  function mutate(nextIds, request) {
    if (isLoading) return;
    applyIds(nextIds);
    setError(null);
    pendingRef.current += 1;
    queueRef.current = queueRef.current.then(async () => {
      try {
        if (failedRef.current) {
          applyIds(confirmedRef.current);
          return;
        }
        await request();
        confirmedRef.current = nextIds;
      } catch (err) {
        failedRef.current = true;
        setError(err);
        applyIds(confirmedRef.current);
      } finally {
        pendingRef.current -= 1;
        if (pendingRef.current === 0) failedRef.current = false;
      }
    });
  }

  function addToShortlist(cityId) {
    if (idsRef.current.includes(cityId)) return;
    mutate([...idsRef.current, cityId], async () => {
      try {
        await addShortlistItem(cityId);
      } catch (err) {
        // Already added (e.g. from another tab) is the result we wanted.
        if (err.code !== 'already_in_shortlist') throw err;
      }
    });
  }

  function removeFromShortlist(cityId) {
    if (!idsRef.current.includes(cityId)) return;
    mutate(
      idsRef.current.filter((id) => id !== cityId),
      async () => {
        try {
          await removeShortlistItem(cityId);
        } catch (err) {
          if (err.code !== 'not_found') throw err;
        }
      }
    );
  }

  function isShortlisted(cityId) {
    return shortlistedIds.includes(cityId);
  }

  // Swaps the ids at index and index + direction (-1 for up, 1 for down).
  // No-ops silently if the move would go out of bounds.
  function reorderShortlist(index, direction) {
    const current = idsRef.current;
    const target = index + direction;
    if (target < 0 || target >= current.length) return;
    const next = [...current];
    [next[index], next[target]] = [next[target], next[index]];
    mutate(next, () => saveShortlistOrder(next));
  }

  return (
    <ShortlistContext.Provider
      value={{
        shortlistedIds,
        addToShortlist,
        removeFromShortlist,
        isShortlisted,
        reorderShortlist,
        isLoading,
        error,
        clearError,
        reload,
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