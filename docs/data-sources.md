# Data Sources (Day 4 — supersedes the original Teleport plan)

**Teleport (`api.teleport.org`) was retired** sometime before this project
started — the domain no longer resolves. This was approved as a substitution
by our TM (Ian) after we found this during Day 3/4 prep. The 17-metric
liveability scores it would have supplied don't have a free live-API
replacement, so those numbers are now curated by hand (see below).

## What we use instead

### Wikipedia REST API — summary text + hero image
`https://en.wikipedia.org/api/rest_v1/page/summary/{title}`
No key required.

Returns `extract` (prose summary), `originalimage`/`thumbnail` (photo), and
`content_urls.desktop.page` (canonical link — **must be shown as attribution
near the text/image**, since Wikipedia content is CC BY-SA).

Gotchas:
- The `title` must match the exact Wikipedia article title, not just the
  city name — e.g. Austin needs `"Austin, Texas"`, not `"Austin"`, or you'll
  hit a disambiguation page.

- A 404 means no article exists — `api.js` treats this as "no data," not an
  error, so the UI should show a fallback, not a broken state.

### Open-Meteo Geocoding — city search
`https://geocoding-api.open-meteo.com/v1/search?name={query}&count=8`
No key required.

Returns `latitude`, `longitude`, `country`, `name` for places matching the
query. Used for searching cities outside our curated list. These results
have `hasScores: false` — see `docs/prop-contracts.md`.

### Curated cities base fields + liveability scores - `Backend Database`
`[API_BASE_URL]/api/cities`
The **backend database is the absolute source of truth** for city scores.
The frontend retrieves city and score data exclusively from the Flask API.
It **doesn't** treat `localStorage` or a frontend JavaScript dataset as the 
authoritative source of scores.

`src/services/api.js` fetches the city base fields from the backend database
(curated cities)  & wiki fields (`heroImage`, `imageAttribution`, `sourceUrl`,
`summary`) from wikipedia api to make a city object complete.

Every entry is flagged `isSampleData: true` until someone sources real numbers
and cites them in `scoreSource`.


## What `services/api.js` returns to components

Unchanged shape-wise from the original plan, with a few honest additions —
see the `City` object in `docs/prop-contracts.md` for the full, current
shape (`hasScores`, `isSampleData`, `sourceUrl`, `latitude`/`longitude` are
new since the Teleport switch)

## Role of `localStorage`

`localStorage` is not the source of truth for city scores. The backend database
stores the authoritative score records, and the frontend retrieves them through the API.