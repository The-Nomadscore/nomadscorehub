# Prop Contracts 

Rule: components talk to each other and to data **only** through props and
the two Context providers below. No component reaches into another
component's file. No component calls `fetch()` — only `services/api.js` does.

If you need a field that isn't here, add it to this doc in your PR *before*
using it, so everyone sees the change.

## The `City` object

\`\`\`ts
{
  id: string,
  name: string,
  fullName: string,
  heroImage: string | null,
  imageAttribution: string | null,
  summary: string,
  teleportCityScore: number | null,  // 0–100
  scores: Array<{
    id: string,
    name: string,
    scoreOutOf10: number,            // 0–10
  }>,                                // always 17 entries when data is complete
  latitude: number | null,
  longitude: number | null,
  sourceUrl: string | null,     // Wikipedia link — show near summary/image
  hasScores: boolean,           // false = show a "limited data" state
  isSampleData: boolean,        // true = show a "sample data" label
  // Also: scores may now be [] and teleportCityScore may be null
}
\`\`\`

## Components and their props (Day 2 owners in parentheses)

### `<CityCard>` (Gabriel)
\`\`\`ts
{
  city: City,
  isShortlisted: boolean,
  onToggleShortlist: (cityId: string) => void,
  onOpenDetail: (cityId: string) => void,
}
\`\`\`

### `<CityGrid>` (Gabriel)
\`\`\`ts
{
  cities: City[],
  shortlistedIds: string[],
  onToggleShortlist: (cityId: string) => void,
  onOpenDetail: (cityId: string) => void,
}
\`\`\`

### `<SearchBar>` (Gabriel)
\`\`\`ts
{
  value: string,
  onChange: (value: string) => void,
  onFilterChange: (filters: FilterState) => void,
}
/// FilterState — confirmed:
// { minInternet: number, minCostOfLiving: number, minSafety: number }
// All are floors (0-10). Higher Cost of Living score = more affordable,
// matching every other metric where higher is better — so this is a
// minimum, not a maximum, despite the name.
### `<SearchBar>`
...
// Note: searches curated cities only (client-side, by name/country).
// Worldwide search via geocoding is out of scope for Phase 1 — see
// data-sources.md for why.
\`\`\`

### `<ShortlistDrawer>` (Erick)
\`\`\`ts
{
  cities: City[],
  onRemove: (cityId: string) => void,
  onReorder: (index: number, direction: -1 | 1) => void,
  onSelectForCompare: (cityId: string) => void,
  isOpen: boolean,
  onClose: () => void,
}
\`\`\`

### `<CityDetailModal>` (Deb)
\`\`\`ts
{
  city: City | null,
  onClose: () => void,
}
\`\`\`

### `<ScoreBar>` (Deborah — used inside modal, 17x)
\`\`\`ts
{
  label: string,
  scoreOutOf10: number,
}
\`\`\`

### `<ComparisonDrawer>` (Johnson)
\`\`\`ts
{
  cityA: City | null,                  // only cities with hasScores: true
  cityB: City | null,                  // (App guards this before selectForCompare)
  pendingCity: City | null,            // 3rd city waiting for a slot (#17)
  onRemove: (slot: 'A' | 'B') => void,
  onReplace: (slot: 'A' | 'B') => void, // put pendingCity into that slot
  onCancelReplace: () => void,
  isOpen: boolean,
  onClose: () => void,
}
\`\`\`

## Context (Cindy — Day 2)

### `ShortlistContext`
\`\`\`ts
{
  shortlistedIds: string[],
  addToShortlist: (cityId: string) => void,
  removeFromShortlist: (cityId: string) => void,
  isShortlisted: (cityId: string) => boolean,
  reorderShortlist: (index: number, direction: -1 | 1) => void,
}
\`\`\`

### `ComparisonContext`
\`\`\`ts
{
  cityAId: string | null,
  cityBId: string | null,
  pendingCityId: string | null,         // set when both slots are full
  selectForCompare: (cityId: string) => void, // ignores cities already compared
  replaceSlot: (slot: 'A' | 'B') => void,
  cancelReplace: () => void,
  removeFromCompare: (slot: 'A' | 'B') => void,
}
\`\`\`

## Change process

Changing a shape here after Day 1 is fine — flag it in standup and the PR
description, since someone else's component likely depends on it.