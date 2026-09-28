import { createContext, useContext, useState } from 'react';

const ComparisonContext = createContext(null);

export function ComparisonProvider({ children }) {
  const [cityAId, setCityAId] = useState(null);
  const [cityBId, setCityBId] = useState(null);
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
