import { createContext, useContext, useState } from 'react';

const ShortlistContext = createContext(null);

export function ShortlistProvider({ children }) {
  const [shortlistedIds, setShortlistedIds] = useState([]);

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

  return (
    <ShortlistContext.Provider
      value={{ shortlistedIds, addToShortlist, removeFromShortlist, isShortlisted }}
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