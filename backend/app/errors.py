"""Shared JSON error handlers (docs/api-contract.md, section 1.2).

Flask answers unknown routes (404), wrong methods (405) and crashes (500) with
HTML pages by default. These handlers return the contract's error shape for
paths under /api/ instead. They are registered on the app, not the blueprint,
because routing errors happen before Flask knows which blueprint a request
belongs to.
"""

from flask import request
from werkzeug.exceptions import HTTPException

from .api_utils import error_response

# HTTP status -> contract error code. Statuses not listed keep Flask's default.
HTTP_ERROR_CODES = {
    404: "route_not_found",
    405: "method_not_allowed",
}


def register_error_handlers(app):
    @app.errorhandler(HTTPException)
    def handle_http_exception(exc):
        code = HTTP_ERROR_CODES.get(exc.code)
        if code is None or not request.path.startswith("/api/"):
            return exc  # not ours: leave Flask's default response
        return error_response(exc.code, code, exc.description)

    @app.errorhandler(Exception)
    def handle_unexpected_error(exc):
        if isinstance(exc, HTTPException):
            return exc
        # Full details go to the server log only; the response stays generic.
        app.logger.exception("Unhandled error")
        return error_response(500, "internal_error", "Unexpected server error")