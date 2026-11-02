"""Checks for A3's building blocks: password hashing, and that every token problem
produces the contract's 401 error (docs/api-contract.md, section 1.1)."""

from datetime import timedelta

import pytest
from flask_jwt_extended import create_access_token, jwt_required

from app.auth import check_password, hash_password
from app.extensions import db
from app.models import User

PASSWORD = "a-long-enough-password"


def make_user(email="ada@example.com"):
    user = User(email=email, password_hash=hash_password(PASSWORD))
    db.session.add(user)
    db.session.commit()
    return user


@pytest.fixture
def client(app):
    # A throwaway protected route, so the error handlers can be exercised.
    @app.get("/api/_protected")
    @jwt_required()
    def _protected():
        return {"ok": True}

    return app.test_client()


def get(client, header=None):
    headers = {"Authorization": header} if header is not None else {}
    return client.get("/api/_protected", headers=headers)


def assert_401(response, code):
    assert response.status_code == 401
    assert response.get_json()["error"]["code"] == code


# ---- passwords ----

def test_hash_is_not_the_password_and_is_salted():
    first = hash_password(PASSWORD)
    assert PASSWORD not in first
    assert hash_password(PASSWORD) != first


def test_check_password_right_wrong_and_unknown_user():
    user = User(email="x@example.com", password_hash=hash_password(PASSWORD))
    assert check_password(user, PASSWORD) is True
    assert check_password(user, "some-other-password") is False
    assert check_password(None, PASSWORD) is False


# ---- token errors ----

def test_missing_header(client):
    assert_401(get(client), "missing_token")


def test_garbage_token(client):
    assert_401(get(client, "Bearer not-a-real-token"), "invalid_token")


def test_wrong_scheme(client):
    # The library treats a non-Bearer scheme as "no Bearer token supplied".
    assert_401(get(client, "Basic abc123"), "missing_token")


def test_valid_token(client):
    token = create_access_token(identity=make_user().id)
    response = get(client, f"Bearer {token}")
    assert response.status_code == 200
    assert response.get_json() == {"ok": True}


def test_tampered_token(client):
    token = create_access_token(identity=make_user().id)
    tampered = token[:-2] + ("AA" if not token.endswith("AA") else "BB")
    assert_401(get(client, f"Bearer {tampered}"), "invalid_token")


def test_expired_token(client):
    user = make_user()
    token = create_access_token(identity=user.id, expires_delta=timedelta(seconds=-1))
    assert_401(get(client, f"Bearer {token}"), "token_expired")


def test_token_for_deleted_user(client):
    user = make_user()
    token = create_access_token(identity=user.id)
    db.session.delete(user)
    db.session.commit()
    assert_401(get(client, f"Bearer {token}"), "invalid_token")