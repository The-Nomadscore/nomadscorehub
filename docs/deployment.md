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
