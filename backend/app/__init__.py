from flask import Flask

from .config import Config
from .extensions import db, migrate


def create_app(config_class=Config):
    app = Flask(__name__)
    app.config.from_object(config_class)

    db.init_app(app)
    migrate.init_app(app, db)

    # CORS is wired in the "CORS and connectivity" ticket (Erick).
    # Models are imported here once they exist (Day 2, Johnson).

    from .api import api_bp

    app.register_blueprint(api_bp)

    return app