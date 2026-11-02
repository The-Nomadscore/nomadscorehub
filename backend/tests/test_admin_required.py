import pytest
from flask import jsonify
from flask_jwt_extended import create_access_token

from app.auth import admin_required, hash_password
from app.extensions import db
from app.models import User


@pytest.fixture
def client(app):
    # A throwaway route, added before the first request is handled.
    @admin_required
    def admin_only():
        return jsonify({"ok": True})

    app.add_url_rule("/api/_admin_only", "admin_only_test", admin_only)
    return app.test_client()


def make_user(email, is_admin):
    user = User(email=email, password_hash=hash_password("password-123"), is_admin=is_admin)
    db.session.add(user)
    db.session.commit()
    return user


def get(client, user=None):
    headers = {}
    if user is not None:
        headers["Authorization"] = f"Bearer {create_access_token(identity=user.id)}"
    return client.get("/api/_admin_only", headers=headers)


def error_code(resp):
    return resp.get_json()["error"]["code"]


def test_no_token_is_401(client):
    resp = get(client)
    assert resp.status_code == 401
    assert error_code(resp) == "missing_token"


def test_regular_user_is_403(client):
    resp = get(client, make_user("user@example.com", False))
    assert resp.status_code == 403
    assert error_code(resp) == "forbidden"


def test_admin_is_200(client):
    resp = get(client, make_user("admin@example.com", True))
    assert resp.status_code == 200


def test_demoted_admin_loses_access_with_the_same_token(client):
    user = make_user("admin@example.com", True)
    token = create_access_token(identity=user.id)
    headers = {"Authorization": f"Bearer {token}"}
    assert client.get("/api/_admin_only", headers=headers).status_code == 200

    user.is_admin = False
    db.session.commit()
    resp = client.get("/api/_admin_only", headers=headers)
    assert resp.status_code == 403


def test_promoted_user_gains_access_with_the_same_token(client):
    user = make_user("user@example.com", False)
    token = create_access_token(identity=user.id)
    headers = {"Authorization": f"Bearer {token}"}
    assert client.get("/api/_admin_only", headers=headers).status_code == 403

    user.is_admin = True
    db.session.commit()
    assert client.get("/api/_admin_only", headers=headers).status_code == 200