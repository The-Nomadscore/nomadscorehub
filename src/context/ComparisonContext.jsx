import { createContext, useContext, useState } from 'react';

const ComparisonContext = createContext(null);

export function ComparisonProvider({ children }) {
  const [cityAId, setCityAId] = useState(null);
  const [cityBId, setCityBId] = useState(null);

  function selectForCompare(cityId) {
    if (cityAId === null) {
      setCityAId(cityId);
    } else if (cityBId === null) {
      setCityBId(cityId);
    } else {
      // Both slots full — per prop-contracts.md, replace slot A
      setCityAId(cityId);
    }
  }

  function removeFromCompare(slot) {
    if (slot === 'A') setCityAId(null);
    else setCityBId(null);
  }

  return (
    <ComparisonContext.Provider
      value={{ cityAId, cityBId, selectForCompare, removeFromCompare }}
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