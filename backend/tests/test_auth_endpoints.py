import pytest

from app.extensions import db
from app.models import User

EMAIL = "debby@example.com"
PASSWORD = "correct-horse-battery"


@pytest.fixture
def client(app):
    return app.test_client()


def register(client, email=EMAIL, password=PASSWORD):
    return client.post("/api/auth/register", json={"email": email, "password": password})


def login(client, email=EMAIL, password=PASSWORD):
    return client.post("/api/auth/login", json={"email": email, "password": password})


def code(resp):
    return resp.get_json()["error"]["code"]


# ---- register ----

def test_register_success(client):
    resp = register(client)
    assert resp.status_code == 201
    data = resp.get_json()
    assert data["expires_in"] == 3600
    assert data["token"]
    assert data["user"]["email"] == EMAIL
    assert data["user"]["is_admin"] is False
    assert "password" not in data["user"] and "password_hash" not in data["user"]
def test_register_accepts_normal_domains(client):
    for email in ["a@b.com", "first.last@mail.example.co.ke", "x+tag@sub.domain.org"]:
        assert register(client, email=email).status_code == 201


def test_register_normalizes_email_and_stores_hash(client, app):
    register(client, email="  Debby@Example.COM ")
    user = User.query.filter_by(email=EMAIL).one()
    assert user.password_hash != PASSWORD
    assert user.password_hash.startswith(("scrypt:", "pbkdf2:"))


def test_register_duplicate_ignores_case_and_spaces(client):
    assert register(client).status_code == 201
    resp = register(client, email=" DEBBY@example.com ")
    assert resp.status_code == 409
    assert code(resp) == "email_taken"


@pytest.mark.parametrize(
    "email",
    ["", "nope", "a@b", "a b@c.com", 123, None, "x" * 250 + "@a.com",
     "a@b..com", "a@b.com.", "a@.b.com"],
)
def test_register_bad_email(client, email):
    resp = register(client, email=email)
    assert resp.status_code == 400
    assert code(resp) == "validation_error"
    assert "email" in resp.get_json()["error"]["details"]["fields"]


@pytest.mark.parametrize("password", ["short", "", "x" * 129, 12345678, None])
def test_register_bad_password(client, password):
    resp = register(client, password=password)
    assert resp.status_code == 400
    assert "password" in resp.get_json()["error"]["details"]["fields"]


def test_register_body_not_json(client):
    resp = client.post("/api/auth/register", data="hello", content_type="text/plain")
    assert resp.status_code == 400
    assert code(resp) == "validation_error"


def test_register_password_boundaries(client):
    assert register(client, email="a@example.com", password="x" * 8).status_code == 201
    assert register(client, email="b@example.com", password="x" * 128).status_code == 201

def test_register_ignores_is_admin_in_the_body(client):
    resp = client.post(
        "/api/auth/register",
        json={"email": EMAIL, "password": PASSWORD, "is_admin": True},
    )
    assert resp.status_code == 201
    assert resp.get_json()["user"]["is_admin"] is False
    assert User.query.filter_by(email=EMAIL).one().is_admin is False

# ---- login ----

def test_login_success(client):
    register(client)
    resp = login(client)
    assert resp.status_code == 200
    assert resp.get_json()["user"]["email"] == EMAIL


def test_login_email_is_case_insensitive(client):
    register(client)
    assert login(client, email="DEBBY@EXAMPLE.COM").status_code == 200


def test_login_wrong_password_and_unknown_email_look_identical(client):
    register(client)
    wrong = login(client, password="not-the-password")
    unknown = login(client, email="nobody@example.com")
    assert wrong.status_code == unknown.status_code == 401
    assert wrong.get_json() == unknown.get_json()
    assert code(wrong) == "invalid_credentials"


def test_login_missing_fields(client):
    resp = client.post("/api/auth/login", json={})
    assert resp.status_code == 400
    fields = resp.get_json()["error"]["details"]["fields"]
    assert "email" in fields and "password" in fields


# ---- me ----

def test_me_with_token(client):
    token = register(client).get_json()["token"]
    resp = client.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert resp.status_code == 200
    assert resp.get_json()["user"]["email"] == EMAIL


def test_me_without_token(client):
    resp = client.get("/api/auth/me")
    assert resp.status_code == 401
    assert code(resp) == "missing_token"


def test_me_for_deleted_user(client, app):
    token = register(client).get_json()["token"]
    db.session.delete(User.query.filter_by(email=EMAIL).one())
    db.session.commit()
    resp = client.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert resp.status_code == 401
    assert code(resp) == "invalid_token"