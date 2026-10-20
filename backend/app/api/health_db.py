from flask import current_app
from sqlalchemy import text

from ..extensions import db
from . import api_bp


@api_bp.get("/health/db")
def health_db():
    try:
        db.session.execute(text("SELECT 1"))
        return {"status": "ok", "database": "reachable"}, 200
    except Exception:
        # Log the real error server-side only; don't leak internals to clients.
        current_app.logger.exception("Database health check failed")
        return {"status": "error", "database": "unreachable"}, 503