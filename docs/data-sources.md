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
  hit a disambiguation page. Check `wikiTitle` in `curatedCities.js` when
  adding a city.
- A 404 means no article exists — `api.js` treats this as "no data," not an
  error, so the UI should show a fallback, not a broken state.

### Open-Meteo Geocoding — city search
`https://geocoding-api.open-meteo.com/v1/search?name={query}&count=8`
No key required.

Returns `latitude`, `longitude`, `country`, `name` for places matching the
query. Used for searching cities outside our curated list. These results
have `hasScores: false` — see `docs/prop-contracts.md`.

### `curatedCities.js` — the 17 liveability scores
Hand-maintained in the repo. No free live API provides cost-of-living,
internet-quality, safety, etc. at this granularity. Every entry is flagged
`isSampleData: true` until someone sources real numbers and cites them in
`scoreSource`. See the `[D3] Curate liveability dataset` ticket for the
sourcing process.

## What `services/api.js` returns to components

Unchanged shape-wise from the original plan, with a few honest additions —
see the `City` object in `docs/prop-contracts.md` for the full, current
shape (`hasScores`, `isSampleData`, `sourceUrl`, `latitude`/`longitude` are
new since the Teleport switch)