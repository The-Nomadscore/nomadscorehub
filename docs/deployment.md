# Deployment

## Hosting

Deploy the Flask backend on Render and use a Render PostgreSQL database.
SQLite is for local development only; do not use it for hosted data because
Render web services have an ephemeral filesystem.

Set `DATABASE_URL` on the Render web service to the database's internal
connection URL. The application accepts both `postgres://` and
`postgresql://` URLs. Set `SECRET_KEY` to a generated secret and set
`CORS_ORIGINS` to the deployed frontend origin.

## Render free PostgreSQL limits

Render's [free instance documentation](https://render.com/docs/free#free-postgres)
currently lists these limits:

- Only one free PostgreSQL database can be active per workspace.
- Storage is limited to 1 GB.
- **The database expires 30 days after it is created.** After expiration it is
  inaccessible unless upgraded to a paid plan.
- There is a 14-day grace period to upgrade after expiration. Render deletes
  the database and its data after that period.
- Free databases do not have backups or managed connection pooling, and may
  be restarted or taken down for maintenance at any time.

The expiry clock starts on database creation, not on the presentation date.
For example, a database created on October 8, 2026 expires on November 7, 2026;
it becomes inaccessible then and is scheduled for deletion after the following
14-day grace period. If the presentation or grading happens after the expiry
date, upgrade the database before then or choose a paid plan; do not rely on
the free database being available.

Render describes free instances as suitable for testing and hobby projects,
not production. Confirm the database's creation and expiry dates in the Render
dashboard before relying on it.

## Deployed setup (checked [10/9/2026])

- **Host:** Render, free web service plus free Postgres
- **Service URL:** https://nomadscore-api.onrender.com
- **Region:** [Oregon (US West)], same for the service and the database
- **Python:** set with `PYTHON_VERSION=[3.14.1]` (Render picks its own otherwise)
- **Root directory:** `backend`
- **Build command:** `pip install -r requirements.txt`
- **Start command:** `gunicorn --bind 0.0.0.0:$PORT wsgi:app`
- **Branch deployed:** [develop, after the Render PR merges]
- **Environment variables (names only):** `PYTHON_VERSION`, `DATABASE_URL`,
  `CORS_ORIGINS`, `SECRET_KEY`

## Verified endpoints
- `/api/health` returns `{"status":"ok"}`
- `/api/health/db` returns `{"status":"ok","database":"reachable"}`
- CORS verified from `http://localhost:5173` and `https://nomadscorehub.vercel.app`,
  including a request with a custom `X-Owner-Id` header

## Database dates
- Created: 10/9/2026
- Expires: [date + 30 days]
- Deleted if not upgraded: [expiry + 14 days]

## Backup host
Railway, **not verified**. Will Check its own pricing and docs before relying on it.

## Troubleshooting
- **Build fails with `No module named 'psycopg'`:** SQLAlchemy 2.1 changed the
  default driver for `postgresql://` URLs to psycopg 3. `config.py` names
  `postgresql+psycopg2://` explicitly. Don't remove that.
- **CORS blocked and no `access-control-allow-origin` header:** check the
  environment variable NAME first (it must be exactly `CORS_ORIGINS`), then the
  value (comma-separated, `https://`, no trailing slash). A misspelled key fails
  silently because the config falls back to a localhost-only default.
- **First request very slow:** the free tier sleeps after about 15 idle minutes
  and can take up to a minute to wake. Open `/api/health` before a demo.