# NomadScore API Contract (Phase 2)

Status: DRAFT for standup review.
Issue: #74 [D1] Draft API contract document

## 1. Conventions

- Base path: `/api`
- Format: JSON requests and responses (`Content-Type: application/json`)
- Dates: ISO 8601 date strings, `YYYY-MM-DD`
- City ids are strings (see `docs/prop-contracts.md`), so every `city_id` in this document is a string.
- The backend serves only city data and scores (decision 7 in `docs/decisions.md`). Wikipedia text and photos (`summary`, `heroImage`, `imageAttribution`, `sourceUrl`) are still fetched by the frontend, and `api.js` combines both into the full City object the components use (`docs/prop-contracts.md`).
- The City JSON uses the camelCase names from `docs/prop-contracts.md` for fields that exist there. Shortlist and itinerary bodies use snake_case field names (`city_id`, `start_date`, ...). See the standup list in section 4 about the mixed casing.

### 1.1 The `X-Owner-Id` header

There is no login in Phase 2, so user-owned data is separated by an owner id sent by the browser.

| Rule | Detail |
|---|---|
| Required on | `/api/shortlist*` and `/api/itineraries*` |
| Not required on | `/api/health` and `/api/cities*` (if sent, the backend ignores it) |
| Format | UUID v4 string, 36 characters with hyphens, e.g. `3f2b8c1e-9a4d-4e7b-8c55-1d2e3f4a5b6c` |
| Created | Once in the browser, stored in `localStorage` |
| Validation | Backend validates the format |
| Missing header | `400` with code `missing_owner_id` |
| Malformed value | `400` with code `invalid_owner_id` |

It returns 400, not 401, because this is not real authentication. 401 is reserved for Phase 3 when login arrives.

Ownership rule: if an owner asks for an itinerary id that belongs to another owner, the backend returns `404 not_found` (not 403), so ids do not leak what exists.

### 1.2 Shared error format

Every error from every endpoint uses this one shape:

```json
{
  "error": {
    "code": "missing_owner_id",
    "message": "The X-Owner-Id header is required for this endpoint."
  }
}
```

| Field | Type | Meaning |
|---|---|---|
| `error.code` | string | Stable machine-readable code (snake_case). The frontend branches on this. |
| `error.message` | string | Human-readable explanation. Safe to show to the user. |
| `error.details` | object, optional | Extra info, e.g. per-field validation errors (see `validation_error`). |

Error codes:

| HTTP | `code` | When |
|---|---|---|
| 400 | `missing_owner_id` | `X-Owner-Id` absent on an endpoint that requires it |
| 400 | `invalid_owner_id` | `X-Owner-Id` is not a valid UUID v4 |
| 400 | `validation_error` | Body or query is invalid (`details.fields` lists problems) |
| 404 | `not_found` | Resource does not exist, or belongs to another owner |
| 404 | `city_not_found` | `city_id` does not match any city |
| 404 | `route_not_found` | The path does not exist |
| 405 | `method_not_allowed` | The path exists but not for this HTTP method |
| 409 | `already_in_shortlist` | City is already in this owner's shortlist |
| 500 | `internal_error` | Unexpected server error |

Example with details:

```json
{
  "error": {
    "code": "validation_error",
    "message": "Request body is invalid.",
    "details": {
      "fields": {
        "end_date": "must be on or after start_date"
      }
    }
  }
}
```

### 1.3 Request handling rules

- **Order of checks:** the `X-Owner-Id` header is checked first (on endpoints that need it), then the request body, then whether the resource exists.
- **Bad JSON:** a body that is not valid JSON, or a missing JSON body where one is required, returns `400 validation_error` with a clear message.
- **Unknown routes and methods:** these also return the shared error shape (`route_not_found`, `method_not_allowed`), never an HTML error page.
- **Unexpected errors:** `500 internal_error` with a generic message. Never include stack traces or internal details in the response.
- **CORS:** handled by the CORS ticket (Erick). `flask-cors` as set up in `create_app()` for `/api/*` allows all request headers, so `X-Owner-Id` works, and the methods GET, POST, PUT, PATCH, DELETE and OPTIONS by default. The allowed origins come from the `CORS_ORIGINS` setting and must include the frontend origin.
- **Shared error handling:** `create_app()` has no error handlers yet, so Flask would return its default HTML error pages. One shared set of handlers is needed to return the error shape in section 1.2 for `route_not_found`, `method_not_allowed`, `internal_error` and bad JSON. The `X-Owner-Id` check should also be one shared helper, not copied into every endpoint.

### 1.4 Notes for wiring `src/services/api.js`

Checked against `api.js` as it is today. Whoever swaps it to the backend needs to handle:

- **Base URL:** `API_BASE_URL` comes from `VITE_API_BASE_URL`, default `http://localhost:5000/api`. All paths in this document are relative to it. The Vite dev server origin (default `http://localhost:5173`) must be allowed by CORS.
- **`fetchJson(url)`** currently only does GET with no headers or body, and always calls `response.json()`. It must be extended to send a method, a JSON body, `Content-Type: application/json` and `X-Owner-Id`. It must skip `response.json()` for `204` replies (DELETE endpoints). On errors it should read `error.code` and `error.message` from the shared error shape instead of only the status.
- **`scores` shape:** `toCity()` expects `base.scores` as an object map (`{ "Housing": 3.1 }`). The backend returns an array of `{ id, name, scoreOutOf10 }` rows, so `toCity()` must accept the array.
- **Owner id:** generate the UUID v4 once, store it in `localStorage`, and send it as `X-Owner-Id` on every `/api/shortlist*` and `/api/itineraries*` request.

## 2. Data models

### City

What the backend returns for a city. Field names that also exist in `docs/prop-contracts.md` use the same names.

| Field | Type | Notes |
|---|---|---|
| `id` | string | |
| `name` | string | |
| `country` | string | not in `prop-contracts.md` yet (added there by whoever builds `/api/cities`) |
| `wikiTitle` | string | Wikipedia article title, used by the frontend to fetch the summary and photo |
| `latitude` | number or null | |
| `longitude` | number or null | |
| `isSampleData` | boolean | `true` means the UI shows the "Sample data" label |
| `scoreSource` | string | where the scores came from, not in `prop-contracts.md` yet |
| `teleportCityScore` | number or null | 0 to 100. Computed by the server from the 17 scores, never stored (decision 6): the average of the `scoreOutOf10` values times 10, rounded to the nearest whole number (the same formula `api.js` uses today). `null` when there are no scores. |
| `scores` | array of Score | 17 entries when data is complete, `[]` when there is no score data |

Not returned by the backend, because the frontend builds them in `api.js`: `fullName`, `heroImage`, `imageAttribution`, `summary`, `sourceUrl`, and `hasScores` (true when `scores` is not empty).

### Score

| Field | Type | Notes |
|---|---|---|
| `id` | string | metric id |
| `name` | string | metric display name |
| `scoreOutOf10` | number | 0 to 10 |

### The 17 metrics

Every complete City has exactly these 17 scores, with these ids and names (taken from `src/services/mockData.js`):

| # | `id` | `name` |
|---|---|---|
| 1 | `HOUSING` | Housing |
| 2 | `COST_OF_LIVING` | Cost of Living |
| 3 | `STARTUPS` | Startups |
| 4 | `VENTURE_CAPITAL` | Venture Capital |
| 5 | `TRAVEL_CONNECTIVITY` | Travel Connectivity |
| 6 | `COMMUTE` | Commute |
| 7 | `BUSINESS_FREEDOM` | Business Freedom |
| 8 | `SAFETY` | Safety |
| 9 | `HEALTHCARE` | Healthcare |
| 10 | `EDUCATION` | Education |
| 11 | `ENVIRONMENTAL_QUALITY` | Environmental Quality |
| 12 | `ECONOMY` | Economy |
| 13 | `TAXATION` | Taxation |
| 14 | `INTERNET_ACCESS` | Internet Access |
| 15 | `LEISURE_CULTURE` | Leisure & Culture |
| 16 | `TOLERANCE` | Tolerance |
| 17 | `OUTDOORS` | Outdoors |

The ids follow the rule used in `mockData.js`: uppercase the name and replace every run of non-letters with `_`. Scores are returned in the order above.

### ShortlistItem

| Field | Type | Notes |
|---|---|---|
| `city_id` | string | |
| `position` | integer | 1-based order in the shortlist |

### Itinerary

| Field | Type | Notes |
|---|---|---|
| `id` | integer | |
| `city_id` | string | |
| `title` | string | required, non-empty |
| `start_date` | string (date) | |
| `end_date` | string (date) | on or after `start_date` |
| `notes` | string | optional, may be empty |

## 3. Endpoints

### 3.1 Health

#### GET `/api/health`

No `X-Owner-Id` needed. No body.

Success `200`:

```json
{ "status": "ok" }
```

### 3.2 Cities

No `X-Owner-Id` needed on these. The paths `/api/cities` and `/api/cities/` both work.

#### GET `/api/cities`

Returns all cities. No body.

Success `200`:

```json
{
  "cities": [
    {
      "id": "lisbon",
      "name": "Lisbon",
      "country": "Portugal",
      "wikiTitle": "Lisbon",
      "latitude": 38.7223,
      "longitude": -9.1393,
      "isSampleData": true,
      "scoreSource": "sample",
      "teleportCityScore": 71.2,
      "scores": [
        { "id": "HOUSING", "name": "Housing", "scoreOutOf10": 3.1 },
        { "id": "COST_OF_LIVING", "name": "Cost of Living", "scoreOutOf10": 5.4 },
        { "id": "STARTUPS", "name": "Startups", "scoreOutOf10": 7.8 }
      ]
    }
  ]
}
```

(Example only: `scores` is shortened to three entries and the coordinates and score values are illustrative. The real response has all 17 entries, listed in section 2.)

A city with no score data returns `scores: []` and `teleportCityScore: null`.

Errors: `500 internal_error`.

### 3.3 Shortlist

All require `X-Owner-Id`. Each owner only sees and changes their own shortlist.

#### GET `/api/shortlist`

Returns the owner's shortlist in order. No body.

Success `200`:

```json
{
  "items": [
    { "city_id": "lisbon", "position": 1 },
    { "city_id": "chiang-mai", "position": 2 }
  ]
}
```

Errors: `400 missing_owner_id`, `400 invalid_owner_id`.

#### POST `/api/shortlist`

Adds a city to the end of the shortlist.

Request:

```json
{ "city_id": "austin" }
```

Success `201`:

```json
{ "city_id": "austin", "position": 3 }
```

Errors: `400 missing_owner_id`, `400 invalid_owner_id`, `400 validation_error` (`city_id` missing or not a non-empty string), `404 city_not_found`, `409 already_in_shortlist`.

#### DELETE `/api/shortlist/<city_id>`

Removes a city. Remaining items are renumbered so positions stay 1..n without gaps. No body.

Success `204` with no body.

Errors: `400 missing_owner_id`, `400 invalid_owner_id`, `404 not_found` (city is not in this owner's shortlist).

#### PUT `/api/shortlist/order`

Replaces the order of the shortlist. The list must contain exactly the city ids already in the shortlist, no more, no fewer. (The frontend's `onReorder(index, direction)` can work out the new order and send the whole list.)

Request:

```json
{ "city_ids": ["chiang-mai", "lisbon", "austin"] }
```

Success `200`:

```json
{
  "items": [
    { "city_id": "chiang-mai", "position": 1 },
    { "city_id": "lisbon", "position": 2 },
    { "city_id": "austin", "position": 3 }
  ]
}
```

Errors: `400 missing_owner_id`, `400 invalid_owner_id`, `400 validation_error` (ids differ from the current shortlist, or duplicates).

### 3.4 Itineraries

All require `X-Owner-Id`. An owner can only read or change their own itineraries. Another owner's id returns `404 not_found`.

The paths `/api/itineraries` and `/api/itineraries/` both work.

#### GET `/api/itineraries`

Returns the owner's itineraries. No body.

Success `200`:

```json
{
  "itineraries": [
    {
      "id": 12,
      "city_id": "lisbon",
      "title": "Lisbon workation",
      "start_date": "2026-11-03",
      "end_date": "2026-11-17",
      "notes": "Book coworking near Baixa."
    }
  ]
}
```

Errors: `400 missing_owner_id`, `400 invalid_owner_id`.

#### POST `/api/itineraries`

Creates an itinerary.

Request:

```json
{
  "city_id": "lisbon",
  "title": "Lisbon workation",
  "start_date": "2026-11-03",
  "end_date": "2026-11-17",
  "notes": "Book coworking near Baixa."
}
```

`notes` is optional. All other fields are required.

Success `201`: the created Itinerary (same shape as above, including `id`).

Errors: `400 missing_owner_id`, `400 invalid_owner_id`, `400 validation_error` (missing field, bad date, `end_date` before `start_date`), `404 city_not_found`.

#### PATCH `/api/itineraries/<id>`

Partial update. Send only the fields to change. `id` and `city_id` cannot be changed in this version.

Request:

```json
{ "title": "Lisbon + Porto", "end_date": "2026-11-20" }
```

Success `200`: the full updated Itinerary.

Errors: `400 missing_owner_id`, `400 invalid_owner_id`, `400 validation_error`, `404 not_found` (does not exist or belongs to another owner).

#### DELETE `/api/itineraries/<id>`

Deletes the itinerary. No body.

Success `204` with no body.

Errors: `400 missing_owner_id`, `400 invalid_owner_id`, `404 not_found`.
