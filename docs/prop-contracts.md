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
`cities` is one page of the filtered list since C2 (#145); App does the paging.

### `<Pagination>` (Johnson, C2 #145)
```ts
{
  page: number,          // current page, 1-based
  pageCount: number,     // page buttons are hidden when this is 1
  total: number,         // cities after search + filters (N); renders nothing when 0
  start: number,         // 1-based index of the first city shown (X)
  end: number,           // 1-based index of the last city shown (Y)
  onPageChange: (page: number) => void,
  label?: string,        // noun after N, default 'cities'
}
```
App builds these with `paginate(items, page, pageSize)` from
`src/utils/paginate.js` (6 per page). Paging is in the browser for now; the
page resets to 1 when the search or a filter changes.

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
  cities: City[],                       // 0 to maxCompare cities, in column order;
                                        // only cities with hasScores: true
                                        // (App guards this before selectForCompare)
  maxCompare: number,                   // 4 (C1, #144)
  pendingCity: City | null,             // city picked while the list is full (#17)
  onRemove: (cityId: string) => void,
  onReplace: (cityId: string) => void,  // put pendingCity in that city's place
  onCancelReplace: () => void,
  isOpen: boolean,
  onClose: () => void,
}
```

### `<ProtectedRoute>` (Johnson, B4 #143)
```ts
{
  adminOnly?: boolean,       // default false; signed-in non-admins go to /explore
  fallback?: ReactNode,      // shown while a saved token is checked; default null
  children?: ReactNode,      // optional; otherwise renders the nested routes (<Outlet />)
}
```
Used as a layout route in `main.jsx`. Signed-out visitors go to
`/login?next=<path + query + hash>` (built by `loginPathFor` in
`src/utils/loginPath.js`); `LoginPage` / `RegisterPage` send them back via
`safeNextPath`. Routes: `/`, `/explore`, `/login`, `/register` are public;
`/itineraries` is protected. `/itineraries?plan=<cityId>` opens the create
form with that city picked ("Plan a trip" uses it, also for guests after
they sign in).

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
  cityIds: string[],                    // compared cities in column order, max 4
  pendingCityId: string | null,         // set when a city is picked while full
  isFull: boolean,                      // cityIds.length === maxCompare
  maxCompare: number,                   // 4 (C1, #144)
  selectForCompare: (cityId: string) => void, // ignores cities already compared
  replaceCity: (oldCityId: string) => void,   // swaps pendingCityId into that place
  cancelReplace: () => void,
  removeFromCompare: (cityId: string) => void,
  dropInvalidSlots: (isValid: (cityId: string) => boolean) => void, // removes compared cities that fail isValid (#112)
}
```
`cityIds` is restored from `localStorage` on load (decision 10 in
`docs/decisions.md`); `App.jsx` calls `dropInvalidSlots` once cities and the
shortlist have loaded. C1 replaced `cityAId` / `cityBId` / `replaceSlot` with
`cityIds` / `replaceCity`, and `removeFromCompare` now takes a city id.

## Change process

Changing a shape here after Day 1 is fine — flag it in standup and the PR
description, since someone else's component likely depends on it.