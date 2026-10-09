# Decisions Log (Phase 2)

Short record of choices we made and why, so nobody has to rediscover the
reasoning later. Add new decisions at the bottom.

## Decided

### 1. Monorepo: Flask lives in `backend/`
**Why:** one PR can change an endpoint and the `api.js` call that uses it
together, and the team manages one repo, not two. Cost: CI and deployment
are more involved because Vercel builds only the frontend.

### 2. Database: SQLAlchemy + Flask-Migrate
**Why:** SQLite is for local development only (no setup on five laptops);
hosted deployments use PostgreSQL. SQLAlchemy lets us switch with a
connection string, and migrations keep everyone's schema in sync.

### 3. Owner identification: anonymous `X-Owner-Id` header
**Why:** auth does not arrive until Phase 3, but shortlists and itineraries
must be saved per user now.
- The browser generates a UUID v4 on first visit, stores it in
  `localStorage`, and `api.js` sends it as `X-Owner-Id`.
- Required on user-owned routes (`/api/shortlist*`, `/api/itineraries*`).
  Not required on `/api/health` or `/api/cities*`.
- Missing or malformed: `400` with the shared error shape (not `401`,
  which is reserved for real authentication in Phase 3).
- Another owner's record: `404`, so ids do not reveal what exists.
- This is identification, NOT security: anyone can send any id. Phase 3
  replaces it with a real user id; every user-owned table has an
  `owner_id` column so that swap is small.

### 4. `services/api.js` stays the only network layer
**Why:** Phase 1 proved the rule when Teleport was retired and zero
components changed. Components never call `fetch()`.

### 5. Endpoint files auto-register
Every module in `backend/app/api/` is imported automatically and adds its
routes to `api_bp`. **Why:** several people add endpoints at the same time;
this way nobody edits a shared file, so no merge conflicts there.

### 6. Overall city score is computed, not stored
Calculated from the 17 metric scores on the server. **Why:** a hand-entered
total caused the "0/100" bug in Phase 1.

### 7. Wikipedia text and photos stay fetched by the frontend
The backend serves cities and scores only. **Why:** keeps Phase 2 scope small
and avoids the backend depending on a third-party API at request time.

### 8. Scores remain labeled "Sample data" until sourced
Carried over from Phase 1: `is_sample_data` and `score_source` move into the
database with each city, and the UI keeps the label.
### 9. Hosting: Render (free web service + free Postgres)
**Why:** the team and TM were comfortable with it, it connects to GitHub, and
it fits a gunicorn app. Limits (checked against Render's docs, [date]): the
web service sleeps after about 15 idle minutes with up to a minute to wake;
its filesystem is wiped on restart, so SQLite is local-only. The free
Postgres is 1 GB and expires 30 days after creation, then is deleted after a
14-day grace period. Details and dates are in `docs/deployment.md`.

## Open decisions

- **Applying migrations on Render:** decide whether `flask db upgrade` runs as
  part of the build or by hand, once Day 2's models and first migration land.
- **Python version on Render:** `PYTHON_VERSION` is set to the version we
  tested locally; revisit if the team standardizes on another.
- **Dependency versions:** unpinned for now. Pin after the team has run the
  same set on several laptops.
- **Python version:** scaffold tested on Windows with Python 3.14.4. Record
  the version range the team confirms works.
- **Persisting the comparison selection:** stretch ticket, undecided.
- **What happens to itineraries when a city leaves the shortlist:** decided
  during the Day 5 cross-feature checks.