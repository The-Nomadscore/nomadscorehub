// cityScores.js — Day 3 (Erick). Issue #15.
// hasScores(city): Phase 1 rule that only cities with score data can be
// shortlisted. Cities without scores are view-only.
export function hasScores(city) {
  return (
    city != null &&
    city.teleportCityScore != null &&
    Array.isArray(city.scores) &&
    city.scores.length > 0
  );
}