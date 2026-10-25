# NomadScore API Contract (Phase 2, updated for Phase 3)

Status: AGREED on merge.
Issues: #74 [D1] Draft API contract document. #134 [A1] API contract for auth, shortlist, itinerary and admin (adds login and admin, and replaces the `X-Owner-Id` header with `Authorization: Bearer`).

## 1. Conventions

- Base path: `/api`
- Auth endpoints live under `/api/auth`, admin endpoints under `/api/admin`.
- Format: JSON requests and responses (`Content-Type: application/json`)
- Dates: ISO 8601 date strings, `YYYY-MM-DD`
- City ids are strings (see `docs/prop-contracts.md`), so every `city_id` in this document is a string.
- The backend serves only city data and scores (decision 7 in `docs/decisions.md`). Wikipedia text and photos (`summary`, `heroImage`, `imageAttribution`, `sourceUrl`) are still fetched by the frontend, and `api.js` combines both into the full City object the components use (`docs/prop-contracts.md`).
- The City JSON uses the camelCase names from `docs/prop-contracts.md` for fields that exist there. Shortlist and itinerary bodies use snake_case field names (`city_id`, `start_date`, ...).

### 1.1 Authentication: the `Authorization: Bearer` header

Users sign in with an email and password and get a token. The browser sends that token on every request that needs a signed-in user. This replaces the `X-Owner-Id` header from Phase 2. `X-Owner-Id` is no longer used, and the backend ignores it if it is sent.

**The token**

| Item | Detail |
|---|---|
| Format | JWT, signed with a secret read from the environment (never written in the code or committed to git) |
| Contents | `sub` (the user's id as a string), `iat` (issued at) and `exp` (expiry). No password and no email. Admin rights are not stored in the token. |
| Lifetime | 1 hour (3600 seconds). Register and login return `expires_in: 3600`. |
| Refresh | No refresh tokens. When the token expires, the user logs in again. |
| Sent as | `Authorization: Bearer <token>` (one space between `Bearer` and the token) |
| Storage in the browser | The frontend keeps the token in `localStorage`. This is simple and works with the `Authorization` header, but any script running on the page can read it, so an XSS bug would expose it. An `httpOnly` cookie would avoid that, but needs CSRF protection and a different CORS setup. We accept the `localStorage` trade-off for now, and the 1 hour lifetime limits the damage. |
| Logout | There is no logout endpoint. The frontend deletes its stored token. |

**Rules for the header**

| Rule | Detail |
|---|---|
| Required on | `/api/auth/me`, `/api/shortlist*`, `/api/itineraries*` and `/api/admin*` |
| Not required on | `/api/health`, `/api/health/db`, `/api/cities*`, `/api/auth/register` and `/api/auth/login` (if sent, the backend ignores it) |
| No `Authorization` header, or one that does not start with `Bearer ` (for example `Basic abc`) | `401` with code `missing_token` |
| `Bearer <token>` where the token is not valid (bad signature, damaged, or the user no longer exists) | `401` with code `invalid_token` |
| Token has expired | `401` with code `token_expired` |
| Signed in but not an admin, on an admin endpoint | `403` with code `forbidden` |

How the frontend should react: on `token_expired` or `invalid_token`, delete the stored token and send the user to sign in. `missing_token` means the user is a guest (see section 1.5).

**Admin rights.** Whether a user is an admin is read from the user's record in the database on each admin request, not from the token. So a change to a user's admin status applies straight away. The first admin is created by a seed script or an environment setting, never through sign-up. Sign-up ignores any `is_admin` field in the request.

**Ownership rule.** If a signed-in user asks for an itinerary id that belongs to another user, the backend returns `404 not_found` (not 403), so ids do not leak what exists. `403 forbidden` is used only for admin endpoints.

**Which routes need what**

| Route | Token needed | Admin needed |
|---|---|---|
| `/api/health` | no | no |
| `/api/health/db` | no | no |
| `/api/cities`, `/api/cities/<city_id>` | no | no |
| `/api/auth/register`, `/api/auth/login` | no | no |
| `/api/auth/me` | yes | no |
| `/api/shortlist*` (4 routes) | yes | no |
| `/api/itineraries*` (4 routes) | yes | no |
| `/api/admin/*` (2 routes) | yes | yes |

The shortlist and itinerary routes (eight in total) were open with `X-Owner-Id` in Phase 2. They are now protected.

### 1.2 Shared error format

Every error from every endpoint uses this one shape:

```json
{
  "error": {
    "code": "missing_token",
    "message": "The Authorization header is required for this endpoint."
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
| 400 | `validation_error` | Body or query is invalid (`details.fields` lists problems) |
| 401 | `missing_token` | `Authorization` header absent, or not a `Bearer` header, on an endpoint that requires it |
| 401 | `invalid_token` | A `Bearer` header whose token is not valid (damaged, bad signature, or the user no longer exists) |
| 401 | `token_expired` | The token was valid but its hour is over |
| 401 | `invalid_credentials` | Login with a wrong password or an email that has no account (same reply for both) |
| 403 | `forbidden` | Signed in, but this endpoint is for admins only |
| 404 | `not_found` | Resource does not exist, or belongs to another user |
| 404 | `city_not_found` | `city_id` does not match any city |
| 404 | `route_not_found` | The path does not exist |
| 405 | `method_not_allowed` | The path exists but not for this HTTP method |
| 409 | `already_in_shortlist` | City is already in this user's shortlist |
| 409 | `email_taken` | Register with an email that already has an account |
| 409 | `city_already_exists` | Admin tries to add a city that already exists |
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

- **Order of checks:** the token is checked first (`401`, on endpoints that need it), then admin rights (`403`, on admin endpoints), then the request body (`400`), then whether the resource exists (`404` or `409`).
- **Bad JSON:** a body that is not valid JSON, or a missing JSON body where one is required, returns `400 validation_error` with a clear message.
- **Unknown routes and methods:** these also return the shared error shape (`route_not_found`, `method_not_allowed`), never an HTML error page.
- **Unexpected errors:** `500 internal_error` with a generic message. Never include stack traces or internal details in the response.
- **Passwords:** a password or password hash is never returned in any response and never written to logs.
- **Rate limiting:** there is none yet. `/api/auth/login` and `/api/auth/register` can be called as often as a client likes, and this contract does not define a limit or a `429` reply.
- **CORS:** handled by the CORS ticket (Erick). `flask-cors` as set up in `create_app()` for `/api/*` allows all request headers, so `Authorization` works, and the methods GET, POST, PUT, PATCH, DELETE and OPTIONS by default. The allowed origins come from the `CORS_ORIGINS` setting and must include the frontend origin. A6 checks that the `Authorization` header is allowed on the deployed backend.
- **Shared error handling:** the shared handlers are merged in `app/errors.py`. They return the error shape in section 1.2 for `route_not_found`, `method_not_allowed`, `internal_error` and bad JSON. The same handlers must also map the JWT library's errors to the token codes in section 1.1: no `Authorization` header, or one that is not a `Bearer` header (for example `Basic abc`), gives `missing_token`; a `Bearer` header with a damaged token or a bad signature gives `invalid_token`; an expired token gives `token_expired`. Most JWT libraries treat the expiry error as a kind of invalid-token error, so it must be caught first, or every expired token would come back as `invalid_token`. The case where the token is fine but the user no longer exists is checked by the helper, and also gives `invalid_token`. The token check and the admin check are two shared helpers (`jwt_required` and `admin_required`, issue A4), not copied into every endpoint.

### 1.4 Notes for wiring `src/services/api.js`

Checked against `api.js` as it is today. Whoever swaps it to the backend needs to handle:

- **Base URL:** `API_BASE_URL` comes from `VITE_API_BASE_URL`, default `http://localhost:5000/api`. All paths in this document are relative to it. The Vite dev server origin (default `http://localhost:5173`) must be allowed by CORS.
- **`fetchJson(url)`** currently only does GET with no headers or body, and always calls `response.json()`. It must be extended to send a method, a JSON body, `Content-Type: application/json` and, when the user is signed in, `Authorization: Bearer <token>`. It must skip `response.json()` for `204` replies (DELETE endpoints). On errors it should read `error.code` and `error.message` from the shared error shape instead of only the status.
- **`scores` shape:** `toCity()` expects `base.scores` as an object map (`{ "Housing": 3.1 }`). The backend returns an array of `{ id, name, scoreOutOf10 }` rows, so `toCity()` must accept the array.
- **Token:** send `Authorization: Bearer <token>` on every `/api/auth/me`, `/api/shortlist*`, `/api/itineraries*` and `/api/admin*` request. The old owner id (UUID in `localStorage`) and the `X-Owner-Id` header are removed.
- **Expired or bad token:** on `401` with `token_expired` or `invalid_token`, delete the stored token and send the user to sign in.

### 1.5 Guests and the shortlist merge after login

The server no longer keeps anything for guests. A guest is someone with no token.

| Feature | Guest (no token) | Signed in |
|---|---|---|
| Cities, health | Works as before | Works as before |
| Shortlist | Kept in the browser, in a new `localStorage` key (the name is chosen in B3) | Uses `/api/shortlist*` |
| Itineraries | Login required. The guest is sent to sign in. There is no local itinerary mode. | Uses `/api/itineraries*` |
| Add to calendar (C3) | Not available | Signed-in users only |

If a guest's request reaches a protected endpoint anyway, the backend answers `401 missing_token`.

**Merging the guest shortlist after login.** The backend has no merge endpoint. The frontend does the merge with the normal shortlist endpoint:

1. Registering or logging in succeeds, and the frontend stores the token.
2. The frontend reads the guest shortlist from `localStorage`.
3. For each city, in the saved order, it calls `POST /api/shortlist` with `{ "city_id": "..." }`. Cities already on the server keep their positions, and the new ones go to the end in the guest's order.
4. `201` counts as success. `409 already_in_shortlist` also counts as success (the city was already there).
5. If one city fails with another error (for example `city_not_found`), the frontend skips that city and carries on with the rest.
6. If a `401` comes back during the merge, the frontend stops and keeps the guest list, to try again at the next login.
7. When all cities are done, the frontend clears the guest list and loads the shortlist with `GET /api/shortlist`.

### 1.6 Existing Phase 2 data

Phase 2 shortlist and itinerary rows belong to an anonymous `owner_id` (a UUID from the old `X-Owner-Id` header). That id does not match any user, and there is no way to link it to an account.

Proposed: migration B1 deletes all existing shortlist and itinerary rows, so the owner column can become a foreign key to `users.id`. After B1, every row belongs to a real user. The Phase 2 data was test data from anonymous browsers, and guests now keep their shortlist in the browser (section 1.5). To be confirmed by Erick before B1 is merged.

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

### User

What the backend returns for a signed-in user. The password and the password hash are never returned.

| Field | Type | Notes |
|---|---|---|
| `id` | string | UUID, 36 characters with hyphens, e.g. `3f2b8c1e-9a4d-4e7b-8c55-1d2e3f4a5b6c` (the same type as the old owner id) |
| `email` | string | trimmed and stored in lowercase |
| `is_admin` | boolean | the frontend uses this to show the admin dashboard link |

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

The owner is taken from the token, so an Itinerary never includes a user id and the client never sends one.

### AdminStats

| Field | Type | Notes |
|---|---|---|
| `users` | integer | number of accounts |
| `cities` | integer | number of cities |
| `shortlists` | integer | total number of cities saved in shortlists, across all users |
| `itineraries` | integer | number of itineraries, across all users |

## 3. Endpoints

### 3.1 Health

#### GET `/api/health`

No token needed. No body.

Success `200`:

```json
{ "status": "ok" }
```

### 3.2 Cities

No token needed on these. The paths `/api/cities` and `/api/cities/` both work.

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
      "teleportCityScore": 71,
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


#### GET `/api/cities/<city_id>`

Returns a specific city.

Success `200`:

```json
{

  "id": "lisbon",
  "name": "Lisbon",
  "country": "Portugal",
  "wikiTitle": "Lisbon",
  "latitude": 38.7223,
  "longitude": -9.1393,
  "isSampleData": true,
  "scoreSource": "sample",
  "teleportCityScore": 71,
  "scores": [
    { "id": "HOUSING", "name": "Housing", "scoreOutOf10": 3.1 },
    { "id": "COST_OF_LIVING", "name": "Cost of Living", "scoreOutOf10": 5.4 },
    { "id": "STARTUPS", "name": "Startups", "scoreOutOf10": 7.8 }
  ]

}

```

(Example only: `scores` is shortened to three entries and the coordinates and score values are illustrative. The real response has all 17 entries, listed in section 2.)

A city with no score data returns `scores: []` and `teleportCityScore: null`.

Errors: `404 city_not_found`.

### 3.3 Shortlist

All require a token (`Authorization: Bearer <token>`). Each user only sees and changes their own shortlist.

#### GET `/api/shortlist`

Returns the user's shortlist in order. No body.

Success `200`:

```json
{
  "items": [
    { "city_id": "lisbon", "position": 1 },
    { "city_id": "chiang-mai", "position": 2 }
  ]
}
```

Errors: `401 missing_token`, `401 invalid_token`, `401 token_expired`.

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

Errors: `401 missing_token`, `401 invalid_token`, `401 token_expired`, `400 validation_error` (`city_id` missing or not a non-empty string), `404 city_not_found`, `409 already_in_shortlist` (during the guest merge, the frontend treats this as success, see section 1.5).

#### DELETE `/api/shortlist/<city_id>`

Removes a city. Remaining items are renumbered so positions stay 1..n without gaps. No body.

Success `204` with no body.

Errors: `401 missing_token`, `401 invalid_token`, `401 token_expired`, `404 not_found` (city is not in this user's shortlist).

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

Errors: `401 missing_token`, `401 invalid_token`, `401 token_expired`, `400 validation_error` (ids differ from the current shortlist, or duplicates).

### 3.4 Itineraries

All require a token (`Authorization: Bearer <token>`). A user can only read or change their own itineraries. Another user's id returns `404 not_found`.

The paths `/api/itineraries` and `/api/itineraries/` both work.

#### GET `/api/itineraries`

Returns the user's itineraries. No body.

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

Errors: `401 missing_token`, `401 invalid_token`, `401 token_expired`.

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

Errors: `401 missing_token`, `401 invalid_token`, `401 token_expired`, `400 validation_error` (missing field, bad date, `end_date` before `start_date`), `404 city_not_found`.

#### PATCH `/api/itineraries/<id>`

Partial update. Send only the fields to change. `id` and `city_id` cannot be changed in this version: if either one is in the body, the request fails with `400 validation_error`, even if the value is the same as the current one. An empty body (`{}`) also returns `400 validation_error`, because there is nothing to change.

Request:

```json
{ "title": "Lisbon + Porto", "end_date": "2026-11-20" }
```

Success `200`: the full updated Itinerary.

Errors: `401 missing_token`, `401 invalid_token`, `401 token_expired`, `400 validation_error` (empty body, `id` or `city_id` in the body, a bad value, or `end_date` before `start_date`), `404 not_found` (does not exist or belongs to another user).

#### DELETE `/api/itineraries/<id>`

Deletes the itinerary. No body.

Success `204` with no body.

Errors: `401 missing_token`, `401 invalid_token`, `401 token_expired`, `404 not_found`.

### 3.5 Auth

#### POST `/api/auth/register`

Creates an account and signs the user in, so the frontend does not need a second call to log in. No token needed.

Request:

```json
{ "email": "debby@example.com", "password": "at-least-8-chars" }
```

Rules:

- `email` is a string. Spaces at the start and end are removed first, and the rules below apply to the trimmed value. It is stored in lowercase, so duplicates are checked ignoring upper and lower case and spaces.
  - Maximum length: 254 characters.
  - Format: exactly one `@`, with at least one character before it and a domain after it. The domain must contain at least one `.`, must not start or end with `.`, and the whole address must not contain spaces. The server does not check that the mailbox really exists.
- `password` is a string of 8 to 128 characters. It is stored only as a hash.
- Any other field in the body is ignored. In particular, `is_admin` is ignored: sign-up always creates a normal user.

Success `201`:

```json
{
  "token": "<jwt>",
  "expires_in": 3600,
  "user": { "id": "3f2b8c1e-9a4d-4e7b-8c55-1d2e3f4a5b6c", "email": "debby@example.com", "is_admin": false }
}
```

Errors: `400 validation_error` (`details.fields` names `email` and/or `password`, including when a value is too long or the email format is wrong), `409 email_taken`.

#### POST `/api/auth/login`

Signs a user in. No token needed.

Request:

```json
{ "email": "debby@example.com", "password": "at-least-8-chars" }
```

Success `200`: same shape as register.

```json
{
  "token": "<jwt>",
  "expires_in": 3600,
  "user": { "id": "3f2b8c1e-9a4d-4e7b-8c55-1d2e3f4a5b6c", "email": "debby@example.com", "is_admin": false }
}
```

Errors: `400 validation_error` (email or password missing, or not a string), `401 invalid_credentials`.

A wrong password and an email with no account return the same `401 invalid_credentials` reply, so nobody can use the endpoint to find out which emails have accounts.

```json
{
  "error": {
    "code": "invalid_credentials",
    "message": "Email or password is incorrect."
  }
}
```

#### GET `/api/auth/me`

Returns the signed-in user ("who am I"). The frontend calls this when the page reloads to check that a stored token still works. Requires a token. No body.

Success `200`:

```json
{
  "user": { "id": "3f2b8c1e-9a4d-4e7b-8c55-1d2e3f4a5b6c", "email": "debby@example.com", "is_admin": false }
}
```

Errors: `401 missing_token`, `401 invalid_token`, `401 token_expired`.

### 3.6 Admin

Both endpoints need a token and an admin account. A signed-out request gets `401`. A signed-in user who is not an admin gets `403 forbidden`.

#### GET `/api/admin/stats`

Returns counts for the admin dashboard. No body.

Success `200`: an AdminStats object.

```json
{ "users": 12, "cities": 24, "shortlists": 31, "itineraries": 9 }
```

Errors: `401 missing_token`, `401 invalid_token`, `401 token_expired`, `403 forbidden`.

#### POST `/api/admin/cities`

Adds a city.

Request:

```json
{
  "name": "Chiang Mai",
  "country": "Thailand",
  "latitude": 18.7883,
  "longitude": 98.9853,
  "scores": [
    { "id": "HOUSING", "scoreOutOf10": 5.2 },
    { "id": "COST_OF_LIVING", "scoreOutOf10": 8.1 }
  ]
}
```

(Example only: `scores` is shortened to two entries. A real request must contain all 17.)

Rules, the same as the seed data:

- `name` and `country` are required, non-empty strings.
- `latitude` is a number from -90 to 90, and `longitude` a number from -180 to 180.
- `scores` must contain all 17 metrics from section 2, each id exactly once. Each `scoreOutOf10` is a number from 0 to 10. The `name` of each score is filled in by the server.
- `wikiTitle` is optional and defaults to `name`.
- The server creates the `id` from the name as an ASCII slug:
  1. Accented letters become their plain ASCII letter (`é` becomes `e`, `ã` becomes `a`).
  2. Everything is lowercased.
  3. Every run of characters that are not a letter or a digit (spaces, commas, dots, apostrophes and so on) becomes a single hyphen.
  4. Hyphens at the start and end are removed.

  For example: `Chiang Mai` gives `chiang-mai`, `São Paulo` gives `sao-paulo`, and `Washington, D.C.` gives `washington-d-c`. If nothing is left after these steps (for example a name made only of symbols or of letters with no ASCII form), the request fails with `400 validation_error` on `name`.
- The server sets `isSampleData` to `false` and `scoreSource` to `"admin"`, and computes `teleportCityScore`.
- A city is a duplicate if one already exists with the same `name` and `country`, or if the created `id` is already taken. The `name` and `country` check ignores upper and lower case. This is done in the application code, because the database unique constraint is case-sensitive and would not catch `Lisbon` against `lisbon`.

Success `201`: the created City (same shape as `GET /api/cities/<city_id>`).

Errors: `401 missing_token`, `401 invalid_token`, `401 token_expired`, `403 forbidden`, `400 validation_error` (`details.fields` lists each problem, for example `scores` when a metric is missing, repeated or out of range), `409 city_already_exists`.