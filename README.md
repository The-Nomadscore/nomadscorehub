# NomadScore

Find your next remote work hub. NomadScore aggregates liveability data —
cost of living, internet quality, safety, and more — for global
startup/nomad hubs into one interactive dashboard, so you can compare
cities side by side instead of researching each one separately.

**🔗 Live demo:** https://nomadscorehub.vercel.app/

## Features

- **Search & browse** a curated set of global nomad hubs
- **Filter** by internet quality, cost of living, and safety
- **Shortlist** favorite cities (saved locally, survives a refresh)
- **Compare** two cities side by side across 17 liveability metrics
- **City profiles** with live summary text and imagery pulled from Wikipedia

## Tech stack

- **React** (Vite)
- **Tailwind CSS**
- **Wikipedia REST API** — live city summaries and imagery
- **Open-Meteo Geocoding API** — city coordinate data
- Hand-curated liveability dataset (see [`docs/data-sources.md`](docs/data-sources.md) for why, and sourcing methodology)

## Running it locally

**Prerequisites:** [Node.js](https://nodejs.org/) version 18 or higher, and npm (comes with Node).

1. **Clone the repo**
```bash
   git clone https://github.com/The-Nomadscore/nomadscorehub.git
   cd nomadscorehub
```

2. **Install dependencies**
```bash
   npm install
```

3. **Set up environment variables**
```bash
   cp .env.example .env
```
   The default settings work out of the box — no API keys required, since
   every data source this project uses is free and public.

4. **Start the dev server**
```bash
   npm run dev
```
   Open the URL it prints (usually `http://localhost:5173`) in your browser.

### Available scripts

| Command | What it does |
|---|---|
| `npm run dev` | Starts the local development server |
| `npm run build` | Builds a production bundle into `dist/` |
| `npm run preview` | Serves the production build locally, to sanity-check it before deploying |
| `npm run lint` | Runs ESLint across the project |

### Environment variables

| Variable | Default | What it does |
|---|---|---|
| `VITE_USE_MOCK_DATA` | `false` | Set to `true` to run against a small 3-city offline mock dataset instead of live data — useful for development without a network connection |
| `VITE_API_BASE_URL` | `http://localhost:5000/api` | Base URL of the Flask backend (include `/api`). Set this to the deployed backend URL on Vercel. |

## Project structure

src/
├── components/ # Presentational components (CityCard, SearchBar, drawers, etc.)
├── context/ # Shared app state (shortlist, comparison)
├── hooks/ # Reusable logic (e.g. useAsync for loading/error handling)
├── services/ # api.js — the only file that fetches data — and curated city data
└── App.jsx # Top-level app shell
docs/ # Architecture decisions, data sourcing, and component contracts


## A note on data

NomadScore's liveability scores are a **hand-curated, best-effort dataset**,
not pulled from a single verified live source — see
[`docs/data-sources.md`](docs/data-sources.md) for the full explanation,
including why, and which specific figures are sourced versus estimated.
Cities using estimated figures are labeled "Sample data" in the app.

## Contributing

See [`CONTRIBUTING.md`](CONTRIBUTING.md) for branching conventions, the PR
process, and architecture rules this project follows.

