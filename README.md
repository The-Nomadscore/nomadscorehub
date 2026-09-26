# NomadScore

Find your next remote work hub. Phase 1: pure React frontend against the
public Teleport API.

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

### One-time GitHub setup
1. Push this scaffold, create `develop` from `main`.
2. Settings → Branches → protect `main` and `develop`: require 1 review,
   require CI check, no force pushes.
3. Create labels: `day-1`…`day-7`, `lead`, `search`, `shortlist`,
   `dashboard`, `compare`, `infra`, `bug`, `polish`.
4. Import the Day 1–7 tickets as Issues, add to a Project board
   (Backlog → In Progress → Review → Done).

## Docs
- `docs/teleport-api-notes.md` — API shapes, quirks, rate-limit notes.
- `docs/prop-contracts.md` — the data contract every component builds against.