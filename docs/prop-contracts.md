# Prop Contracts 

Rule: components talk to each other and to data **only** through props and
the two Context providers below. No component reaches into another
component's file. No component calls `fetch()` — only `services/api.js` does.

If you need a field that isn't here, add it to this doc in your PR *before*
using it, so everyone sees the change.

## The `City` object

```ts
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
```

## The `Itinerary` object

```ts
{
  id: number,
  cityId: string,        // matches City.id
  title: string,
  startDate: string,     // "YYYY-MM-DD"
  endDate: string,       // "YYYY-MM-DD", not before startDate
  notes: string,         // "" when none
}
```

Note: the backend sends `snake_case` (`city_id`, `start_date`, `end_date`).
`services/api.js` converts to the camelCase shape above, so components
never see snake_case.

## Components and their props (Day 2 owners in parentheses)

### `<CityCard>` (Gabriel)
```ts
{
  city: City,
  isShortlisted: boolean,
  onToggleShortlist: (cityId: string) => void,
  onOpenDetail: (cityId: string) => void,
}
```

### `<CityGrid>` (Gabriel)
```ts
{
  cities: City[],
  shortlistedIds: string[],
  onToggleShortlist: (cityId: string) => void,
  onOpenDetail: (cityId: string) => void,
}
```

### `<SearchBar>` (Gabriel)
```ts
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
```

### `<ShortlistDrawer>` (Erick)
```ts
{
  cities: City[],
  onRemove: (cityId: string) => void,
  onReorder: (index: number, direction: -1 | 1) => void,
  onSelectForCompare: (cityId: string) => void,
  onPlanTrip: (cityId: string) => void,
  isOpen: boolean,
  onClose: () => void,
}
```

### `<CityDetailModal>` (Deb)
```ts
{
  city: City | null,
  onClose: () => void,
  onPlanTrip: (cityId: string) => void,
}
```

### `<ScoreBar>` (Deborah — used inside modal, 17x)
```ts
{
  label: string,
  scoreOutOf10: number,
}
```

### `<ItineraryList>` (Deborah)
```ts
{
  itineraries: Itinerary[],
  cities: City[],                       // used to look up city names
  onCreate: () => void,
  onEdit: (itineraryId: number) => void,
  onDelete: (itineraryId: number) => void,
}
// Shows an empty state when itineraries is [].
```

### `<ItineraryCard>` (Deborah)
```ts
{
  itinerary: Itinerary,
  city: City | null,                    // null if the city isn't found
  onEdit: (itineraryId: number) => void,
  onDelete: (itineraryId: number) => void,
}
```

### `<ItineraryForm>` (Deborah)
```ts
{
  initialValues: Itinerary | null,      // null = create, set = edit
  preselectedCityId: string | null,     // create mode only: pre-fills the city (still changeable)
  cities: City[],
  onSubmit: (values: {
    cityId: string,
    title: string,
    startDate: string,
    endDate: string,
    notes: string,
  }) => void,
  onCancel: () => void,
}
// In edit mode cityId is read-only (the API can't change it).
```

### `<ComparisonDrawer>` (Johnson)
```ts
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
```

## Context (Cindy — Day 2)

### `ShortlistContext`
```ts
{
  shortlistedIds: string[],
  addToShortlist: (cityId: string) => void,
  removeFromShortlist: (cityId: string) => void,
  isShortlisted: (cityId: string) => boolean,
  reorderShortlist: (index: number, direction: -1 | 1) => void,
  isLoading: boolean,        // true until the first load from the API finishes
    error: { status: number | null, message: string } | null, // set when a load or save fails 
  clearError: () => void,
  reload: () => Promise<void>, // re-reads the shortlist from the API
}
```

### `ComparisonContext`
```ts
{
  cityAId: string | null,
  cityBId: string | null,
  pendingCityId: string | null,         // set when both slots are full
  selectForCompare: (cityId: string) => void, // ignores cities already compared
  replaceSlot: (slot: 'A' | 'B') => void,
  cancelReplace: () => void,
  removeFromCompare: (slot: 'A' | 'B') => void,
  dropInvalidSlots: (isValid: (cityId: string) => boolean) => void, // empties slots whose city fails isValid (#112)
}
```
`cityAId` / `cityBId` are restored from `localStorage` on load (decision 10 in
`docs/decisions.md`); `App.jsx` calls `dropInvalidSlots` once cities and the
shortlist have loaded.

## Change process

Changing a shape here after Day 1 is fine — flag it in standup and the PR
description, since someone else's component likely depends on it.