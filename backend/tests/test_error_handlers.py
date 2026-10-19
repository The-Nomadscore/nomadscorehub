"""Shared JSON error handlers (docs/api-contract.md, section 1.2)."""

import pytest
from flask_sqlalchemy.query import Query

from tests.test_models import app  # noqa: F401  (shared app fixture)


@pytest.fixture
def client(app):
    return app.test_client()


def test_unknown_api_route_returns_json_404(client):
    response = client.get("/api/nope")
    assert response.status_code == 404
    assert response.get_json()["error"]["code"] == "route_not_found"


def test_wrong_method_returns_json_405(client):
    response = client.post("/api/cities")  # cities is GET-only
    assert response.status_code == 405
    assert response.get_json()["error"]["code"] == "method_not_allowed"


def test_non_api_404_keeps_flask_default(client):
    response = client.get("/nope")
    assert response.status_code == 404
    assert response.content_type.startswith("text/html")


def test_unhandled_exception_returns_generic_500(client, monkeypatch):
    def boom(*args, **kwargs):
        raise RuntimeError("secret database detail")

    monkeypatch.setattr(Query, "all", boom)

    response = client.get("/api/cities")

    assert response.status_code == 500
    body = response.get_json()
    assert body["error"]["code"] == "internal_error"
    assert "secret database detail" not in response.get_data(as_text=True)