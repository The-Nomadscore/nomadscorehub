import os
from datetime import timedelta

from dotenv import load_dotenv

load_dotenv()


def _database_url():
    url = os.environ.get("DATABASE_URL", "sqlite:///nomadscore.db")
    # Hosts hand out postgres:// or postgresql:// URLs. Name the driver
    # explicitly: SQLAlchemy 2.1 changed the default for postgresql:// from
    # psycopg2 to psycopg 3, and we install psycopg2.
    for prefix in ("postgres://", "postgresql://"):
        if url.startswith(prefix):
            return "postgresql+psycopg2://" + url[len(prefix):]
    return url


class Config:
    SECRET_KEY = os.environ.get("SECRET_KEY", "dev-only-change-me")
    SQLALCHEMY_DATABASE_URI = _database_url()
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    # Comma-separated list, e.g. "http://localhost:5173,https://nomadscorehub.vercel.app"
        # Secret used to sign login tokens. Read from the environment; never hardcode it.
    JWT_SECRET_KEY = os.environ.get("JWT_SECRET_KEY")
    # Short-lived tokens limit the damage if one leaks (we store it in the browser).
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(hours=1)
    CORS_ORIGINS = [
        o.strip()
        for o in os.environ.get("CORS_ORIGINS", "http://localhost:5173").split(",")
        if o.strip()
    ]