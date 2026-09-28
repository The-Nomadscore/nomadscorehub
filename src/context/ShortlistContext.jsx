import { createContext, useContext } from 'react';
import usePersistedShortlist from '../hooks/usePersistedShortlist.js';

const ShortlistContext = createContext(null);

export function ShortlistProvider({ children }) {
  const { ids: shortlistedIds, add, remove } = usePersistedShortlist();

  function isShortlisted(cityId) {
    return shortlistedIds.includes(cityId);
  }

  return (
    <ShortlistContext.Provider
      value={{
        shortlistedIds,
        addToShortlist: add,
        removeFromShortlist: remove,
        isShortlisted,
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