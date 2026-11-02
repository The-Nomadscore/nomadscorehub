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

## Backend Conventions

## API Routes
* **Endpoint Modules:** Add endpoint modules under `backend/app/api/`.
* **Blueprints:** Follow the existing Flask blueprint conventions.

### Application Setup
* **Factory Pattern:** Use the existing Flask application factory.
* **Shared Extensions:** Utilize the shared extensions already configured in the application.

### Database
* **Models:** Use the existing SQLAlchemy models and database configuration.
* **Source of Truth:** Do not introduce a separate source of truth for data already managed by the backend.
* **Schema Changes:** Follow the existing migration workflow when altering database schemas.

### API Contracts & Validation
* **Response Formats:** Follow `docs/api-contract.md` for response formats, status codes, validation, and error handling.
* **Validation & Errors:** Validate incoming requests and use the shared error-response helpers where applicable.

### Authentication & Data Ownership
* **Protecting routes:** Routes that need a signed-in user use the `@jwt_required()` decorator from `flask_jwt_extended`, the same way `shortlist.py` and `itineraries.py` do. Admin-only routes use the `admin_required` decorator from `backend/app/auth.py`. Do not write your own token check inside an endpoint. Clients send the token as `Authorization: Bearer <token>`.
* **Resource Scoping:** Scope user-owned resources to the signed-in user, which you get from `current_user` (imported from `flask_jwt_extended`). Never accept a user id from the request body, query string or a header.
* **Security:** **Never** expose another user's data. If a signed-in user asks for a resource that belongs to someone else, return `404 not_found`, as described in `docs/api-contract.md`.
* **Old convention:** The `X-Owner-Id` header is no longer used. The backend ignores it, so do not build anything on it.

### Environment & Dependencies
* **Configuration:** Do not commit `.env` files, secrets (including `JWT_SECRET_KEY`), local databases, or virtual environments. See the [backend README](../backend/README.md) for the environment variables and how to generate a secret.
* **Dependencies:** Add new Python dependencies to `backend/requirements.txt` and include them in your PR.

---

## Testing

Run backend tests before opening a PR. From the `backend/` directory, activate your virtual environment, install dependencies if needed, and run:

```bash
pip install -r requirements.txt
pytest -v
```

Tests should cover:
* **Successful Requests:** Verify successful requests and expected response formats.
* **Validation Failures:** Test invalid input, missing required fields, and error responses.
* **Resource Isolation:** Ensure proper resource ownership and isolation between different users, and that protected routes return `401` without a valid token.
* **Edge Cases:** Address relevant edge cases introduced by the change.

Use isolated test data and test database configuration where provided. Tests must not depend on production data or a developer's personal database.
Run the relevant frontend checks when changing frontend code. All required CI checks must pass before merging.


## Branching & PRs

- `main` — protected, always demo-ready. No direct pushes.
- `develop` — integration branch, default for local work.
- `feature/<short-name>` — branch per ticket off `develop`.
- Every PR needs 1 review + green CI (lint + build) before merging.
- Squash-merge to keep history readable.

## Local setup

See the main [`README.md`](../README.md) for setup instructions. For the backend, including the JWT secret and how the first admin account is created, see the [backend README](../backend/README.md).