# Backend

Flask API backend for the project.

This guide explains how to set up and run the backend from a fresh clone on **Windows, macOS, or Linux**.

## Prerequisites

Install the following before starting:

- Git
- Python 3
- `pip`

Check that Python is installed:

### Windows

```bash
python --version
```

### macOS / Linux

```bash
python3 --version
```

---

## 1. Get the latest backend code

From the project root:

```bash
git checkout develop
git pull
```

Then move into the backend directory:

```bash
cd backend
```

---

## 2. Create a virtual environment

Create the virtual environment once for this project.

### Windows

```bash
python -m venv venv
```

### macOS / Linux

```bash
python3 -m venv venv
```

This creates a local `venv/` directory inside `backend/`. Run this only once.

---

## 3. Activate the virtual environment

Your terminal prompt should start with `(venv)` after activation.

### Windows — Command Prompt

```cmd
venv\Scripts\activate
```

### Windows — Git Bash

```bash
source venv/Scripts/activate
```

### macOS / Linux

```bash
source venv/bin/activate
```

### Windows PowerShell

PowerShell may block activation scripts depending on your execution-policy settings.

If activation fails, use **Command Prompt or Git Bash** instead.

---

## 4. Install dependencies

With the virtual environment active and while inside `backend/`:

```bash
pip install -r requirements.txt
```

If `requirements.txt` changes after a `git pull`, run this command again:

```bash
pip install -r requirements.txt
```

---

## 5. Configure environment variables

The backend reads its settings from a `.env` file. Copy the example file:

### Windows — Command Prompt

```cmd
copy .env.example .env
```

### Windows — Git Bash

```bash
cp .env.example .env
```

### macOS / Linux

```bash
cp .env.example .env
```

Then open `.env` and check these variables:

| Variable | What it does | If missing |
| --- | --- | --- |
| `SECRET_KEY` | General Flask secret | Falls back to a dev-only value |
| `DATABASE_URL` | Database connection | Local SQLite file (`nomadscore.db`) |
| `CORS_ORIGINS` | Comma-separated frontend origins allowed to call the API | `http://localhost:5173` |
| `JWT_SECRET_KEY` | Signs login tokens | **No built-in default. Set it yourself.** |

Generate your own `JWT_SECRET_KEY` and paste it into `.env`:

```bash
python -c "import secrets; print(secrets.token_hex(32))"
```

Login tokens expire after 1 hour. Never share or commit your secret.

Do **not** commit `.env`.

---

## 6. Verify the Flask application

Make sure the virtual environment is active:

```bash
flask --app wsgi routes
```

The application should load without errors.

The list includes the Flask static route and every API route in the [API Endpoints](#api-endpoints) table below, for example:

```text
/api/health
```

---

# Running the Backend

From the `backend/` directory, with `(venv)` active:

```bash
flask --app wsgi run
```

Flask will normally start the development server at:

```text
http://127.0.0.1:5000
```

---

## Health Check

The backend provides a simple health endpoint:

```http
GET /api/health
```

Open the following in your browser:

```text
http://127.0.0.1:5000/api/health
```

Expected response:

```json
{
  "status": "ok"
}
```

The endpoint should return:

- **HTTP status:** `200 OK`
- **Content-Type:** JSON

You can also test it with `curl`:

```bash
curl http://127.0.0.1:5000/api/health
```

Expected response:

```json
{
  "status": "ok"
}
```

### Database health check

```http
GET /api/health/db
```

Returns `200` with `{"status": "ok", "database": "reachable"}` when the backend can reach the database, and `503` with `{"status": "error", "database": "unreachable"}` when it cannot.

---

# API Endpoints

All routes start with `/api`. Full request and response details, including error shapes, are in [`docs/api-contract.md`](../docs/api-contract.md).

| Method | Path | Who can call it |
| --- | --- | --- |
| GET | `/api/health` | Anyone |
| GET | `/api/health/db` | Anyone |
| POST | `/api/auth/register` | Anyone |
| POST | `/api/auth/login` | Anyone |
| GET | `/api/auth/me` | Signed-in users |
| GET | `/api/cities` | Anyone |
| GET | `/api/cities/<city_id>` | Anyone |
| GET | `/api/shortlist` | Signed-in users |
| POST | `/api/shortlist` | Signed-in users |
| PUT | `/api/shortlist/order` | Signed-in users |
| DELETE | `/api/shortlist/<city_id>` | Signed-in users |
| GET | `/api/itineraries` | Signed-in users |
| POST | `/api/itineraries` | Signed-in users |
| PATCH | `/api/itineraries/<itinerary_id>` | Signed-in users |
| DELETE | `/api/itineraries/<itinerary_id>` | Signed-in users |
| GET | `/api/admin/stats` | Admins only |
| POST | `/api/admin/cities` | Admins only |

---

# Authentication

The API uses login tokens (JWT).

1. Create an account with `POST /api/auth/register`. The response already contains a token, so the new user is signed in straight away.
2. Later, log in with `POST /api/auth/login`. The response also contains a token.
3. Send the token on every protected request in the `Authorization` header:

```text
Authorization: Bearer <token>
```

- `GET /api/auth/me` returns the account the token belongs to, including whether it is an admin.
- Tokens expire after **1 hour**. After that, log in again.
- Tokens are signed with `JWT_SECRET_KEY` (see [section 5](#5-configure-environment-variables)). The backend cannot sign tokens properly without it, so set it before you run the backend.
- Admin routes need a token for an admin account. A signed-in user who is not an admin is refused with `403`.

---

# First Admin Account

Nobody becomes an admin through the sign-up form. An admin is created in two steps:

1. **Register the account normally** (through the sign-up form or `POST /api/auth/register`).
2. **Promote it once** from the `backend/` directory, with `(venv)` active:

```bash
python -m app.make_admin someone@example.com
```

What to know:

- The script only promotes an **existing** user. It never creates an account. If the email is not found, it prints `No user with email ... Ask them to register first.`
- The script prints `Database: ...` before it changes anything. **Read that line** to confirm you are promoting the user in the database you intended (local or production).
- To promote a user in production, put `DATABASE_URL="<production connection string>"` in front of the command. See the Deployment section below.

---

# Adding a New API Endpoint

API endpoints are organized as separate files inside:

```text
backend/app/api/
```

The API package automatically imports endpoint modules, so you should **create a new file** rather than editing the shared API initialization file.

For example:

```text
backend/
└── app/
    └── api/
        ├── __init__.py
        ├── health.py
        └── users.py
```

A new endpoint file should import the shared blueprint:

```python
from . import api_bp


@api_bp.get("/example")
def example():
    return {"message": "Hello"}
```

This would create:

```text
GET /api/example
```

Do not edit:

```text
backend/app/__init__.py
backend/app/api/__init__.py
```

without discussing it with the team first.

---

# Common Errors

## `flask: command not found`

Your virtual environment is probably not active.

Activate it first.

### Windows

```cmd
venv\Scripts\activate
```

### Git Bash

```bash
source venv/Scripts/activate
```

### macOS / Linux

```bash
source venv/bin/activate
```

Then try:

```bash
flask --app wsgi run
```

---

## `ModuleNotFoundError`

Make sure you are inside the `backend/` directory:

```bash
cd backend
```

Also make sure the virtual environment is active and dependencies are installed:

```bash
pip install -r requirements.txt
```

---

## PowerShell says script execution is disabled

PowerShell can block virtual-environment activation scripts.

Use **Command Prompt** or **Git Bash** instead:

```bash
source venv/Scripts/activate
```

---

## `No module named ...`

The required dependency may not be installed.

Run:

```bash
pip install -r requirements.txt
```

If the missing module is a new project dependency, do not install and commit a new package without adding it to `requirements.txt` as part of your PR.

---

## `404 Not Found` at `/`

Opening:

```text
http://127.0.0.1:5000/
```

may return `404 Not Found`.
That does **not** necessarily mean the backend is broken. The application does not currently need to provide a root `/` endpoint.
Test the health endpoint instead:

```text
http://127.0.0.1:5000/api/health
```

It should return:

```json
{
  "status": "ok"
}
```

---

## Health endpoint returns `404`

Make sure:

1. You are running the latest `develop` branch:

```bash
git checkout develop
git pull
```

2. You are running Flask from `backend/`:

```bash
cd backend
```

3. Your virtual environment is active.
4. The health endpoint file exists:

```text
backend/app/api/health.py
```

5. Restart the Flask development server after adding the endpoint.
Then check:

```bash
flask --app wsgi routes
```

The `/api/health` route should be listed.

---

## `requirements.txt` changed after `git pull`

Reinstall dependencies:

```bash
pip install -r requirements.txt
```

Do this whenever the project's `requirements.txt` changes.

---

# Git and Files You Must Not Commit

The following files/directories are local development files and must not be committed:

```text
venv/
.env
*.db
```

They are gitignored.
Before committing, check:

```bash
git status
```

If `venv/`, `.env`, or a database file appears as an untracked or modified file, **stop and ask before committing**.

---

# Development Workflow

Follow the same Git workflow used in Phase 1.
Create a feature branch from `develop`:

```bash
git checkout develop
git pull
git checkout -b feature/<name>
```

Make your changes, test them, and commit your work.
Push the branch:

```bash
git push -u origin feature/<name>
```

Then open a pull request into `develop`.
PRs require **1–2 reviews** and green CI before merging.

---

# Adding Dependencies

If your ticket requires a new Python package:

1. Add it to `requirements.txt`.
2. Include the dependency change in your PR.
3. Mention the new dependency in the PR description.

Do **not** independently upgrade or re-pin existing dependencies unless the team has agreed to it.

---

# Running backend tests

Ensure you are in backend/ & virtual env activated.
For minimal view testing run:
```bash
pytest
```

For detailed view testing run:
```bash
pytest -v
```

---

**Remember:** activate `(venv)` in every new terminal before running Flask or pip commands.

## Deployment (Render)

- **Start command:** `gunicorn --bind 0.0.0.0:$PORT wsgi:app`. Migrations run on start, so a new deploy applies any pending schema changes automatically.
- **Free-tier cold starts:** the service sleeps when idle, so the first request after a pause can take about 50 seconds.
- **Environment variables:** set `JWT_SECRET_KEY` in the Render dashboard to a freshly generated value (see [section 5](#5-configure-environment-variables)). Do not reuse the example value or your local one. Changing it later signs every user out, because tokens made with the old secret stop working.
- **Seeding is manual and one-time.** Seeding does not run on deploy. After a fresh database, run it once with the production `DATABASE_URL` set:

```bash
  cd backend
  DATABASE_URL="<production connection string>" python -m app.seed
```

  The seed requires all 17 scores per city. Do not commit the connection string.
- **Frontend:** `VITE_API_BASE_URL` is baked in at build time, so changing it in Vercel needs a redeploy.
- **Branches:** Vercel production builds from `main`. The API on Render is deployed from `develop`.
- **First admin in production.** Follow [First Admin Account](#first-admin-account) above, but put `DATABASE_URL="<production connection string>"` in front of the command, the same way as for seeding:

```bash
  cd backend
  DATABASE_URL="<production connection string>" python -m app.make_admin someone@example.com
```

  Use the External Database URL from the Render dashboard, since the Internal one only works inside Render. Check the `Database: ...` line the script prints before you trust the result.