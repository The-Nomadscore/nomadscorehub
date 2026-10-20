import pytest
from tests.conftest import app

@pytest.fixture
def client(app):
    return app.test_client()

def test_unknown_route_returns_json_error(client):
    response = client.get("/api/does-not-exist")

    assert response.status_code == 404
    assert response.is_json
    assert response.get_json()["error"]["code"] == "route_not_found"


def test_disallowed_method_returns_json_error(client):
    response = client.patch("/api/health", json={"title": "Lisbon + Porto", "end_date": "2026-11-20"})

    assert response.status_code == 405
    assert response.is_json
    assert response.get_json()["error"]["code"] == "method_not_allowed"