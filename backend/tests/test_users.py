"""Checks for A2: the users table, its constraints, and that no plain-text
password is stored anywhere."""

import pytest
from flask_migrate import downgrade, upgrade
from sqlalchemy import inspect, text
from sqlalchemy.exc import IntegrityError

from app.extensions import db
from app.models import User

from tests.conftest import MIGRATIONS_DIR

FAKE_HASH = "not-a-real-hash"


def assert_rejected(*rows):
    db.session.add_all(rows)
    with pytest.raises(IntegrityError):
        db.session.commit()
    db.session.rollback()


def add_user(email="ada@example.com"):
    user = User(email=email, password_hash=FAKE_HASH)
    db.session.add(user)
    db.session.commit()
    return user


def test_upgrade_creates_users_table(app):
    assert "users" in inspect(db.engine).get_table_names()


def test_user_defaults(app):
    user = add_user()
    assert len(user.id) == 36
    assert user.is_admin is False
    assert user.created_at.tzinfo is not None


def test_email_is_trimmed_and_lowercased(app):
    user = add_user("  Ada@Example.COM ")
    assert user.email == "ada@example.com"


def test_email_must_be_unique_ignoring_case(app):
    add_user("ada@example.com")
    assert_rejected(User(email="ADA@example.com", password_hash=FAKE_HASH))


def test_database_rejects_an_unnormalized_email(app):
    # Core insert skips the model's normalization, so the CHECK is what rejects it.
    with pytest.raises(IntegrityError):
        db.session.execute(
            User.__table__.insert().values(email="Ada@Example.com", password_hash=FAKE_HASH)
        )
    db.session.rollback()


def test_database_rejects_an_empty_email(app):
    assert_rejected(User(email="   ", password_hash=FAKE_HASH))


def test_is_admin_defaults_to_false_in_the_database(app):
    db.session.execute(
        text(
            "INSERT INTO users (id, email, password_hash, created_at) "
            "VALUES ('u1', 'raw@example.com', 'x', '2026-01-01 00:00:00')"
        )
    )
    db.session.commit()
    value = db.session.execute(text("SELECT is_admin FROM users WHERE id = 'u1'")).scalar()
    assert not value


def test_no_plain_text_password_is_stored_or_printed(app):
    columns = {c["name"] for c in inspect(db.engine).get_columns("users")}
    assert columns == {"id", "email", "password_hash", "is_admin", "created_at"}
    assert FAKE_HASH not in repr(add_user())


def test_users_table_has_no_foreign_keys(app):
    assert inspect(db.engine).get_foreign_keys("users") == []


def test_users_migration_downgrades_and_upgrades_again(app):
    db.session.remove()
    downgrade(directory=MIGRATIONS_DIR, revision="afd5d20a644f")
    assert "users" not in inspect(db.engine).get_table_names()
    upgrade(directory=MIGRATIONS_DIR)
    assert "users" in inspect(db.engine).get_table_names()