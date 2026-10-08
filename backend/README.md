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

An environment file is optional for the current setup.

If `backend/.env.example` exists, you can copy it to `.env`.

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

The default values should work for local development.

Do **not** commit `.env`.

---

## 6. Verify the Flask application

Make sure the virtual environment is active:

```bash
flask --app wsgi routes
```

The application should load without errors.

The expected routes include the Flask static route and the API health endpoint:

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

**Remember:** activate `(venv)` in every new terminal before running Flask or pip commands.