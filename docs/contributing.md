# Contributing to NomadScore

## Architecture rule

**All data fetching goes through `src/services/api.js`. No component calls
`fetch()` directly.** This is what lets the data layer be swapped (e.g. for
a future backend) by changing one file instead of every component. This
rule was tested for real mid-project when our originally planned data
source was discontinued — see `docs/data-sources.md`.

Components communicate only via props and the two Contexts in
`src/context/`. See `docs/prop-contracts.md` for exact shapes — read it
before building a component that receives or emits data, and update it in
your PR if you add or change a prop.

## Branching & PRs

- `main` — protected, always demo-ready. No direct pushes.
- `develop` — integration branch, default for local work.
- `feature/<short-name>` — branch per ticket off `develop`.
- Every PR needs 1 review + green CI (lint + build) before merging.
- Squash-merge to keep history readable.

## Local setup

See the main [`README.md`](README.md) for setup instructions.