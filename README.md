# NomadScore

Find your next remote work hub. NomadScore helps you compare global cities across liveability metrics and plan where you might want to stay.

NomadScore aggregates liveability data — cost of living, internet quality, safety, and more — for global startup/nomad hubs into one interactive dashboard, so you can compare cities side by side instead of researching each one separately.

**🔗 Live demo:** https://nomadscorehub.vercel.app/

## Features

- **Search & browse** a curated set of global nomad hubs
- **Filter** by internet quality, cost of living, and safety
- **Shortlist** favorite cities
- **Compare** up to four cities side by side across 17 liveability metrics
- **City profiles** with live summary text and imagery pulled from Wikipedia
- **Plan itineraries** by selecting a city, adding a title, setting travel dates, and optionally recording notes.
- **View and manage trips** by creating, updating, listing, and deleting itineraries.

## Tech stack

- **Frontend:** React, Vite, Tailwind CSS
- **Backend:** Flask, Python, SQLAlchemy
- **Database:** SQLite by default for local development, configurable through DATABASE_URL.
- **Wikipedia REST API** — live city summaries and imagery
- **Open-Meteo Geocoding API** — city coordinate data
- Hand-curated liveability dataset (see [`docs/data-sources.md`](docs/data-sources.md) for why, and sourcing methodology)

## Prerequisites
Install the following before starting:

- Git
- Python 3 and pip
- Node.js 18 or higher and npm

## Running it locally

### Set up Frontend

1. **Clone the repo**
```bash
   git clone https://github.com/The-Nomadscore/nomadscorehub.git
   cd nomadscorehub
```

2. **Install frontend dependencies**
```bash
   npm install
```

3. **Set up environment variables**
```bash
   cp .env.example .env
```
   The default settings work out of the box — no API keys required, since
   every data source this project uses is free and public.

4. **Start frontend the dev server**
```bash
   npm run dev
```
   Open the URL it prints (usually `http://localhost:5173`) in your browser.


### Set up Backend
**Running backend:** See [`backend/README.md`]

### Available scripts

| Command | What it does |
|---|---|
| `npm run dev` | Starts the local development server |
| `npm run build` | Builds a production bundle into `dist/` |
| `npm run preview` | Serves the production build locally, to sanity-check it before deploying |
| `npm run lint` | Runs ESLint across the project |

### Environment variables
#### Frontend
| Variable | Default | What it does |
|---|---|---|
| `VITE_USE_MOCK_DATA` | `false` | Set to `true` to run against a small 3-city offline mock dataset instead of live data — useful for development without a network connection |
| `VITE_API_BASE_URL` | `http://localhost:5000/api` | Base URL of the Flask backend (include `/api`). Set this to the deployed backend URL on Vercel. |


#### Backend
| Variable | Default | What it does |
|---|---|---|
| `DATABASE_URL` | `sqlite:///nomadscore.db` | configures the local SQLite database |
| `CORS_ORIGINS` | `http://localhost:5173,https://nomadscorehub.vercel.app` | lists the frontend origins permitted to make cross-origin API requests. |

Run on `nomadscorehub/`
```bash
   cp .env.example .env
   cd backend
   cp .env.example .env
```
   To set up .env variables

### Verify the full application

Confirm that:

- The backend health endpoint returns 200 OK.
- The frontend loads in your browser.
- The frontend can retrieve city data from the backend.
- City scores appear for cities that have scores in the database.
- Cities without scores are handled without breaking the interface.

If the frontend cannot reach the API, check that the backend is running and that VITE_API_BASE_URL points to the correct address. Restart the frontend development server after changing environment variables.

## Project structure

nomadscorehub/
├── backend/
│   ├── app/
│   │   ├── api/            # API endpoint modules
│   │   ├── models.py       # Database models
│   │   ├── config.py       # Application configuration
│   │   └── extensions.py   # Shared Flask extensions
│   ├── data/               # Backend seed data, if present
│   ├── migrations/         # DB migrations
│   ├── tests/              # Backend tests
│   ├── requirements.txt
│   └── wsgi.py
├── src/
│   ├── components/         # UI components
│   ├── context/            # Shared application state
│   ├── hooks/              # Reusable hooks
│   ├── services/           # API access and frontend services
│   └── App.jsx
├── docs/                   # API contracts and project documentation
├── CONTRIBUTING.md
└── README.md


## Data sources

NomadScore's liveability scores are **curated and may include estimates**.
They supplied by a single verified live API. See [`docs/data-sources.md`] for sourcing details.

## Contributing

See [`CONTRIBUTING.md`](CONTRIBUTING.md) for branching conventions, architecturerules this project follows, backend conventions, testing, and the pull-request process.