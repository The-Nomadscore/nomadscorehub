# NomadScore

Find your next remote work hub. Phase 1: React frontend combining live
Wikipedia summaries/imagery, Open-Meteo city search, and a curated
liveability dataset (see `docs/data-sources.md` — Teleport, our original
planned source, was retired before this project started).

## Quick start

```bash
npm install
cp .env.example .env
npm run dev
```

By default this runs against live data (Wikipedia + the curated dataset),
so you'll see the full city set on first run. Set `VITE_USE_MOCK_DATA=true`
in `.env` if you want to develop offline against a small 3-city mock set
instead — useful if you're working without a reliable connection.

## Architecture rule (read this before opening a PR)

**All data fetching goes through `src/services/api.js`. No component calls
`fetch()` directly.** This is what lets Phase 2 swap the current data
sources for our own Flask backend by changing one file — it's already
proven itself once: when Teleport (our original planned API) turned out to
be retired mid-project, this rule meant zero component code had to change
to recover from it.

Components communicate only via props and the two Contexts in
`src/context/`. See `docs/prop-contracts.md` for exact shapes.

## Branching & PRs

- `main` — protected, always demo-ready. No direct pushes.
- `develop` — integration branch, default for local work.
- `feature/<short-name>` — branch per ticket off `develop`.
- Every PR needs 1 review + green CI (lint + build).
- Squash-merge to keep history readable.

## Docs

- `docs/data-sources.md` — current API shapes, quirks, and why Teleport
  was replaced.
- `docs/prop-contracts.md` — the data contract every component builds
  against.

## About

NomadScore is a lightweight micro-SaaS application designed for remote
workers and digital nomads looking for their next temporary home base. It
solves the problem of "analysis paralysis" by aggregating and visualizing
liveability metrics for global startup hubs — cost of living, internet
quality, safety, and more — into a single, interactive dashboard, so
instead of fifteen browser tabs you get one clear comparison.