"""Checks for the shortlist endpoints: owner header, no duplicates,
consistent positions, and owner isolation."""

import os

import pytest

from app.extensions import db
from app.models import City

from tests.conftest import app, OWNER, OTHER, add_users, auth


@pytest.fixture
def client(app):
    for cid, name, country in [
        ("lisbon", "Lisbon", "Portugal"),
        ("austin", "Austin", "United States"),
        ("chiang-mai", "Chiang Mai", "Thailand"),
    ]:
        db.session.add(City(id=cid, name=name, country=country, wiki_title=name))

    add_users()
    return app.test_client()


def h(owner):
    return auth(owner)


def add(client, owner, city_id):
    return client.post("/api/shortlist", json={"city_id": city_id}, headers=h(owner))


def ids(client, owner):
    items = client.get("/api/shortlist", headers=h(owner)).get_json()["items"]
    return [i["city_id"] for i in items]


@pytest.mark.parametrize(
    "method, path, body",
    [
        ("get", "/api/shortlist", None),
        ("post", "/api/shortlist", {"city_id": "lisbon"}),
        ("put", "/api/shortlist/order", {"city_ids": []}),
        ("delete", "/api/shortlist/lisbon", None),
    ],
)
def test_missing_token_is_401(client, method, path, body):
    response = getattr(client, method)(path, json=body)
    assert response.status_code == 401
    assert response.get_json()["error"]["code"] == "missing_token"


def test_invalid_token_is_401(client):
    response = client.get("/api/shortlist", headers={"Authorization": "Bearer abc"})
    assert response.status_code == 401
    assert response.get_json()["error"]["code"] == "invalid_token"


def test_owner_id_header_alone_is_not_enough(client):
    response = client.get("/api/shortlist", headers={"X-Owner-Id": OWNER})
    assert response.status_code == 401
    assert response.get_json()["error"]["code"] == "missing_token"


def test_adding_same_city_twice_does_not_duplicate(client):
    assert add(client, OWNER, "lisbon").status_code == 201
    second = add(client, OWNER, "lisbon")
    assert second.status_code == 409
    assert second.get_json()["error"]["code"] == "already_in_shortlist"
    assert ids(client, OWNER) == ["lisbon"]


def test_unknown_city_is_404(client):
    response = add(client, OWNER, "atlantis")
    assert response.status_code == 404
    assert response.get_json()["error"]["code"] == "city_not_found"


def test_delete_renumbers_positions(client):
    for city in ("lisbon", "austin", "chiang-mai"):
        add(client, OWNER, city)
    assert client.delete("/api/shortlist/lisbon", headers=h(OWNER)).status_code == 204
    items = client.get("/api/shortlist", headers=h(OWNER)).get_json()["items"]
    assert items == [
        {"city_id": "austin", "position": 1},
        {"city_id": "chiang-mai", "position": 2},
    ]


def test_reorder_keeps_positions_consistent(client):
    for city in ("lisbon", "austin", "chiang-mai"):
        add(client, OWNER, city)
    response = client.put(
        "/api/shortlist/order",
        json={"city_ids": ["chiang-mai", "lisbon", "austin"]},
        headers=h(OWNER),
    )
    assert response.status_code == 200
    assert response.get_json()["items"] == [
        {"city_id": "chiang-mai", "position": 1},
        {"city_id": "lisbon", "position": 2},
        {"city_id": "austin", "position": 3},
    ]


@pytest.mark.parametrize(
    "city_ids",
    [["lisbon"], ["lisbon", "austin", "austin"], ["lisbon", "austin", "chiang-mai"]],
)
def test_reorder_must_match_current_items(client, city_ids):
    add(client, OWNER, "lisbon")
    add(client, OWNER, "austin")
    response = client.put(
        "/api/shortlist/order", json={"city_ids": city_ids}, headers=h(OWNER)
    )
    assert response.status_code == 400
    assert response.get_json()["error"]["code"] == "validation_error"
    assert ids(client, OWNER) == ["lisbon", "austin"]


def test_user_cannot_see_or_change_another_users_shortlist(client):
    add(client, OWNER, "lisbon")
    add(client, OWNER, "austin")

    assert ids(client, OTHER) == []
    assert client.delete("/api/shortlist/lisbon", headers=h(OTHER)).status_code == 404
    reorder = client.put(
        "/api/shortlist/order",
        json={"city_ids": ["austin", "lisbon"]},
        headers=h(OTHER),
    )
    assert reorder.status_code == 400

    assert ids(client, OWNER) == ["lisbon", "austin"]  # untouched


def test_same_city_can_be_in_two_owners_shortlists(client):
    assert add(client, OWNER, "lisbon").status_code == 201
    assert add(client, OTHER, "lisbon").status_code == 201