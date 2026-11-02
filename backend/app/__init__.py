from flask import Flask
from flask_cors import CORS

from .config import Config
from .extensions import db, jwt, migrate   # changed: added jwt
from .errors import register_error_handlers


def create_app(config_class=Config):
    app = Flask(__name__)
    app.config.from_object(config_class)

    # Import the models before db.init_app() creates the engine, so the SQLite
    # foreign-key listener in models.py is registered first (#85).
    from . import models  # noqa: F401

    db.init_app(app)
    migrate.init_app(app, db)
    jwt.init_app(app)   # new: registers JWT support\
    from . import auth  # noqa: F401  (registers the JWT error handlers)

    # Allowed origins come from config (CORS_ORIGINS env var), never hardcoded.
    # Scoped to /api/* so nothing else is exposed cross-origin.
    CORS(app, resources={r"/api/*": {"origins": app.config["CORS_ORIGINS"]}})

    from .api import api_bp

    app.register_blueprint(api_bp)
    register_error_handlers(app)

    return app