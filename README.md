# NomadScore

Find your next remote work hub. Phase 1: React frontend combining live
Wikipedia summaries/imagery, Open-Meteo city search, and a curated
liveability dataset (see docs/data-sources.md — Teleport, our original
planned source, was retired before this project started).

## Quick start

\`\`\`bash
npm install
cp .env.example .env
npm run dev
\`\`\`

`.env.example` defaults `VITE_USE_MOCK_DATA=true` so you can build UI
immediately without hitting the live API or waiting on anyone else.

## Architecture rule (read this before opening a PR)

**All data fetching goes through `src/services/api.js`. No component calls
`fetch()` directly.** This is what lets Phase 2 swap Teleport for our own
Flask backend by changing one file.

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
- `docs/prop-contracts.md` — the data contract every component builds against.