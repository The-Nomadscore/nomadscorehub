import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { addShortlistItem, fetchShortlist, removeShortlistItem, saveShortlistOrder } from '../services/api.js';

const ShortlistContext = createContext(null);

function toShortlistError(err, message) {
  return { status: err.status ?? null, message };
}
const LEGACY_STORAGE_KEY = 'nomadscore:shortlist';

function toIds(items) {
  return [...items].sort((a, b) => a.position - b.position).map((item) => item.city_id);
}

function readLegacyIds() {
  try {
    const parsed = JSON.parse(localStorage.getItem(LEGACY_STORAGE_KEY));
    if (!Array.isArray(parsed)) return [];
    return [...new Set(parsed.filter((id) => typeof id === 'string'))];
  } catch {
    return [];
  }
}

function clearLegacyIds() {
  try {
    localStorage.removeItem(LEGACY_STORAGE_KEY);
  } catch {
    // Storage blocked: nothing to clear.
  }
}

async function migrateLegacyShortlist(serverIds) {
  const legacy = readLegacyIds().filter((id) => !serverIds.includes(id));
  let added = false;
  for (const cityId of legacy) {
    try {
      await addShortlistItem(cityId);
      added = true;
    } catch (err) {
      if (err.code !== 'city_not_found' && err.code !== 'already_in_shortlist') return added;
    }
  }
  clearLegacyIds();
  return added;
}
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
  const loadedRef = useRef(false); 

  const applyIds = useCallback((next) => {
    idsRef.current = next;
    setShortlistedIds(next);
  }, []);

  const loadFromServer = useCallback(async () => {
    let ids = toIds(await fetchShortlist());
    if (await migrateLegacyShortlist(ids)) ids = toIds(await fetchShortlist());
    confirmedRef.current = ids;
    applyIds(ids);
    loadedRef.current = true;
  }, [applyIds]);

  useEffect(() => {
    let cancelled = false;
    loadFromServer()
      .catch((err) => {
        if (!cancelled) setError(toShortlistError(err, "Couldn't load your shortlist. Try again."));
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [loadFromServer]);

  async function reload() {
    if (pendingRef.current > 0) return;
    setError(null);
    try {
      await loadFromServer();
    } catch (err) {
      setError(toShortlistError(err, "Couldn't reload your shortlist. Try again."));
    }
  }

  function clearError() {
    setError(null);
  }

  // Updates the screen first, then saves. Requests run one at a time, in order. On failure, roll back to the last server-confirmed list.
  function mutate(nextIds, request) {
    if (isLoading || !loadedRef.current) return;
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
        setError(toShortlistError(err, "Couldn't save. Your change was undone."));
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