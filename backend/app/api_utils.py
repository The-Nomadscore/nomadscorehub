"""Helpers shared by the user-owned endpoints (shortlist, itineraries).

- error_response / validation_error: the one error shape from
  docs/api-contract.md, section 1.2.
"""

from flask import jsonify


def error_response(status, code, message, details=None):
    body = {"error": {"code": code, "message": message}}
    if details:
        body["error"]["details"] = details
    return jsonify(body), status


def validation_error(fields, message="Request body is invalid."):
    return error_response(400, "validation_error", message, {"fields": fields})