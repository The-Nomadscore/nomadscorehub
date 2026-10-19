from flask import Flask, request
from flask_cors import CORS

from .config import Config
from .extensions import db, migrate
from .api_utils import error_response
from werkzeug.exceptions import (
    BadRequest,
    InternalServerError,
    MethodNotAllowed,
    NotFound,
)

def create_app(config_class=Config):
    app = Flask(__name__)
    app.config.from_object(config_class)

    # Import the models before db.init_app() creates the engine, so the SQLite
    # foreign-key listener in models.py is registered first (#85).
    from . import models  # noqa: F401

    db.init_app(app)
    migrate.init_app(app, db)

    # CORS is wired in the "CORS and connectivity" ticket (Erick).
    # Allowed origins come from config (CORS_ORIGINS env var), never hardcoded.
    # Scoped to /api/* so nothing else is exposed cross-origin.
    CORS(app, resources={r"/api/*": {"origins": app.config["CORS_ORIGINS"]}})

    from .api import api_bp

    app.register_blueprint(api_bp)

    # ERROR handlers    
    @app.errorhandler(NotFound)
    def handle_not_found(error):
        return error_response( 
            404, 
            "route_not_found", 
            "The requested route was not found.",
        )

    @app.errorhandler(MethodNotAllowed)
    def handle_method_not_allowed(error):
        return error_response(
            405, 
            "method_not_allowed",
            "Method is not allowed for this route.",
        )

    @app.errorhandler(InternalServerError)
    def handle_internal_server_error(error):
        return error_response(
            500,
            "internal_error",
            "An unexpected server error occurred.",
        )

    return app