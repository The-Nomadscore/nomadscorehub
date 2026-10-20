"""Helpers shared by the user-owned endpoints (shortlist, itineraries).

- error_response / validation_error: the one error shape from
  docs/api-contract.md, section 1.2.
- require_owner_id: the X-Owner-Id rules from section 1.1 (decision 3 in
  docs/decisions.md). Missing or malformed header -> 400, never 401.
"""

import uuid
from functools import wraps

from flask import jsonify, request


def error_response(status, code, message, details=None):
    body = {"error": {"code": code, "message": message}}
    if details:
        body["error"]["details"] = details
    return jsonify(body), status


def validation_error(fields, message="Request body is invalid."):
    return error_response(400, "validation_error", message, {"fields": fields})


def _parse_uuid4(value):
    try:
        parsed = uuid.UUID(value)
    except ValueError:
        return None
    if parsed.version != 4 or str(parsed) != value.lower():
        return None
    return str(parsed)


def require_owner_id(view):
    """Check X-Owner-Id first (before the body), then pass it to the view
    as its first argument."""

    @wraps(view)
    def wrapper(*args, **kwargs):
        raw = request.headers.get("X-Owner-Id")
        if raw is None or not raw.strip():
            return error_response(
                400, "missing_owner_id",
                "The X-Owner-Id header is required for this endpoint.",
            )
        owner_id = _parse_uuid4(raw.strip())
        if owner_id is None:
            return error_response(
                400, "invalid_owner_id", "X-Owner-Id must be a valid UUID v4."
            )
        return view(owner_id, *args, **kwargs)

    return wrapper
