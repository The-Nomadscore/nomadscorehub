import os
import pytest
from flask_jwt_extended import create_access_token
from flask_migrate import downgrade, upgrade

from app import create_app
from app.config import Config
from app.extensions import db
from app.models import User

BACKEND_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MIGRATIONS_DIR = os.path.join(BACKEND_DIR, "migrations")

OWNER = "3f2b8c1e-9a4d-4e7b-8c55-1d2e3f4a5b6c"
OTHER = "9b1d2c3e-4f5a-4b6c-8d7e-0f1a2b3c4d5e"

def add_users():
    for user_id, email in ((OWNER, "owner@example.com"), (OTHER, "other@example.com")):
        db.session.add(User(id=user_id, email=email, password_hash="not-a-real-hash"))
    db.session.commit()


def auth(user_id):
    return {"Authorization": f"Bearer {create_access_token(identity=user_id)}"}

@pytest.fixture
def app(tmp_path):
    url = os.environ.get("TEST_DATABASE_URL")
    if url and url.startswith(("postgres://", "postgresql://")):
        url = "postgresql+psycopg2://" + url.split("://", 1)[1]

    class TestConfig(Config):
        TESTING = True
        SQLALCHEMY_DATABASE_URI = url or f"sqlite:///{tmp_path / 'test.db'}"
        JWT_SECRET_KEY = "test-only-secret-key-at-least-32-characters"

    app = create_app(TestConfig)
    with app.app_context():
        upgrade(directory=MIGRATIONS_DIR)
        yield app
        db.session.remove()
        downgrade(directory=MIGRATIONS_DIR, revision="base")