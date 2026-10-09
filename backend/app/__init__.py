from flask import Flask
from flask_cors import CORS

from .config import Config
from .extensions import db, migrate


def create_app(config_class=Config):
    app = Flask(__name__)
    app.config.from_object(config_class)

    db.init_app(app)
    migrate.init_app(app, db)

    # CORS is wired in the "CORS and connectivity" ticket (Erick).
    # Allowed origins come from config (CORS_ORIGINS env var), never hardcoded.
    # Scoped to /api/* so nothing else is exposed cross-origin.
    CORS(app, resources={r"/api/*": {"origins": app.config["CORS_ORIGINS"]}})

    # Import the models so Flask-Migrate can see every table (#85).
    from . import models  # noqa: F401

    from .api import api_bp

    app.register_blueprint(api_bp)

    return app