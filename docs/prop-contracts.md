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
  }>,                                 // always 17 entries when data is complete
}
\`\`\`

## Components and their props (Day 2 owners in parentheses)

### `<CityCard>` (Erick)
\`\`\`ts
{
  city: City,
  isShortlisted: boolean,
  onToggleShortlist: (cityId: string) => void,
  onOpenDetail: (cityId: string) => void,
}
\`\`\`

### `<CityGrid>` (Erick)
\`\`\`ts
{
  cities: City[],
  shortlistedIds: string[],
  onToggleShortlist: (cityId: string) => void,
  onOpenDetail: (cityId: string) => void,
}
\`\`\`

### `<SearchBar>` (Erick)
\`\`\`ts
{
  value: string,
  onChange: (value: string) => void,
  onFilterChange: (filters: FilterState) => void,
}
// FilterState — draft, confirm Day 1 sync:
// { minInternet: number, maxCostOfLiving: number, minSafety: number }
\`\`\`

### `<ShortlistDrawer>` (Gabriel)
\`\`\`ts
{
  cities: City[],
  onRemove: (cityId: string) => void,
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
  cityA: City | null,
  cityB: City | null,
  onRemove: (slot: 'A' | 'B') => void,
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
}
\`\`\`

### `ComparisonContext`
\`\`\`ts
{
  cityAId: string | null,
  cityBId: string | null,
  selectForCompare: (cityId: string) => void,
  removeFromCompare: (slot: 'A' | 'B') => void,
}
\`\`\`

## Change process

Changing a shape here after Day 1 is fine — flag it in standup and the PR
description, since someone else's component likely depends on it.