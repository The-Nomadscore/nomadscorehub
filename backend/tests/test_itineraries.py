"""Checks for the itinerary endpoints (#99): owner header, validation with the
shared error shape, unknown city, date order, and owner scoping on every
endpoint."""

import os

import pytest

from app.extensions import db
from app.models import City

from tests.conftest import app, OWNER, OTHER


TRIP = {
    "city_id": "lisbon",
    "title": "Lisbon workation",
    "start_date": "2026-11-03",
    "end_date": "2026-11-17",
    "notes": "Book coworking near Baixa.",
}

@pytest.fixture
def client(app):
    for cid, name, country in [
        ("lisbon", "Lisbon", "Portugal"),
        ("austin", "Austin", "United States"),
    ]:
        db.session.add(City(id=cid, name=name, country=country, wiki_title=name))

    return app.test_client()


def h(owner):
    return {"X-Owner-Id": owner}


def create(client, owner=OWNER, **overrides):
    return client.post("/api/itineraries", json={**TRIP, **overrides}, headers=h(owner))


def fields(response):
    return response.get_json()["error"]["details"]["fields"]


# --- X-Owner-Id ---------------------------------------------------------------

@pytest.mark.parametrize(
    "method, path, body",
    [
        ("get", "/api/itineraries", None),
        ("post", "/api/itineraries", TRIP),
        ("patch", "/api/itineraries/1", {"title": "x"}),
        ("delete", "/api/itineraries/1", None),
    ],
)
def test_missing_owner_header_is_400(client, method, path, body):
    response = getattr(client, method)(path, json=body)
    assert response.status_code == 400
    assert response.get_json()["error"]["code"] == "missing_owner_id"


def test_malformed_owner_header_is_400(client):
    response = client.get("/api/itineraries", headers=h("not-a-uuid"))
    assert response.status_code == 400
    assert response.get_json()["error"]["code"] == "invalid_owner_id"


# --- Create and list ------------------------------------------------------------

def test_create_returns_the_itinerary(client):
    response = create(client)
    assert response.status_code == 201
    body = response.get_json()
    assert isinstance(body["id"], int)
    assert {k: body[k] for k in TRIP} == TRIP


def test_notes_are_optional(client):
    trip = {k: v for k, v in TRIP.items() if k != "notes"}
    response = client.post("/api/itineraries", json=trip, headers=h(OWNER))
    assert response.status_code == 201
    assert response.get_json()["notes"] == ""


def test_same_start_and_end_date_is_allowed(client):
    assert create(client, end_date=TRIP["start_date"]).status_code == 201


def test_list_returns_only_my_itineraries_in_date_order(client):
    create(client, title="Later", start_date="2026-12-01", end_date="2026-12-05")
    create(client, title="Sooner")
    create(client, owner=OTHER, title="Not mine")
    response = client.get("/api/itineraries", headers=h(OWNER))
    assert response.status_code == 200
    titles = [i["title"] for i in response.get_json()["itineraries"]]
    assert titles == ["Sooner", "Later"]


def test_list_with_trailing_slash(client):
    assert client.get("/api/itineraries/", headers=h(OWNER)).status_code == 200


# --- Validation (shared error shape) -------------------------------------------------

def test_end_date_before_start_date_is_rejected(client):
    response = create(client, start_date="2026-11-17", end_date="2026-11-03")
    assert response.status_code == 400
    assert response.get_json()["error"]["code"] == "validation_error"
    assert fields(response) == {"end_date": "must be on or after start_date"}


@pytest.mark.parametrize("bad", ["03/11/2026", "2026-02-30", "20261103", "", 20261103, None])
def test_bad_dates_are_rejected(client, bad):
    response = create(client, start_date=bad)
    assert response.status_code == 400
    assert "start_date" in fields(response)


def test_missing_fields_are_all_reported(client):
    response = client.post("/api/itineraries", json={}, headers=h(OWNER))
    assert response.status_code == 400
    assert set(fields(response)) == {"city_id", "title", "start_date", "end_date"}


@pytest.mark.parametrize("title", ["", "   ", None, 42, "x" * 201])
def test_bad_titles_are_rejected(client, title):
    response = create(client, title=title)
    assert response.status_code == 400
    assert "title" in fields(response)


def test_body_must_be_json_object(client):
    response = client.post(
        "/api/itineraries", data="not json",
        headers={**h(OWNER), "Content-Type": "application/json"},
    )
    assert response.status_code == 400
    assert response.get_json()["error"]["code"] == "validation_error"


def test_error_shape_has_code_and_message(client):
    error = create(client, end_date="2026-01-01").get_json()["error"]
    assert set(error) == {"code", "message", "details"}
    assert isinstance(error["message"], str) and error["message"]


# --- Unknown city ----------------------------------------------------------------

def test_unknown_city_returns_clear_error(client):
    response = create(client, city_id="atlantis")
    assert response.status_code == 404
    error = response.get_json()["error"]
    assert error["code"] == "city_not_found"
    assert error["message"]


# --- Update -------------------------------------------------------------------

def test_patch_changes_only_sent_fields(client):
    trip_id = create(client).get_json()["id"]
    response = client.patch(
        f"/api/itineraries/{trip_id}",
        json={"title": "Lisbon + Porto", "end_date": "2026-11-20"},
        headers=h(OWNER),
    )
    assert response.status_code == 200
    body = response.get_json()
    assert body["title"] == "Lisbon + Porto"
    assert body["end_date"] == "2026-11-20"
    assert body["start_date"] == TRIP["start_date"]
    assert body["notes"] == TRIP["notes"]


def test_patch_end_date_before_stored_start_date_is_rejected(client):
    trip_id = create(client).get_json()["id"]
    response = client.patch(
        f"/api/itineraries/{trip_id}", json={"end_date": "2026-11-01"}, headers=h(OWNER)
    )
    assert response.status_code == 400
    assert fields(response) == {"end_date": "must be on or after start_date"}


@pytest.mark.parametrize("field", ["city_id", "id"])
def test_patch_cannot_change_id_or_city(client, field):
    trip_id = create(client).get_json()["id"]
    response = client.patch(
        f"/api/itineraries/{trip_id}", json={field: "austin"}, headers=h(OWNER)
    )
    assert response.status_code == 400
    assert fields(response) == {field: "cannot be changed"}


def test_patch_with_nothing_to_change_is_rejected(client):
    trip_id = create(client).get_json()["id"]
    response = client.patch(f"/api/itineraries/{trip_id}", json={}, headers=h(OWNER))
    assert response.status_code == 400
    assert response.get_json()["error"]["code"] == "validation_error"


def test_patch_unknown_id_is_404(client):
    response = client.patch("/api/itineraries/999", json={"title": "x"}, headers=h(OWNER))
    assert response.status_code == 404
    assert response.get_json()["error"]["code"] == "not_found"


# --- Delete -------------------------------------------------------------------

def test_delete_removes_the_itinerary(client):
    trip_id = create(client).get_json()["id"]
    response = client.delete(f"/api/itineraries/{trip_id}", headers=h(OWNER))
    assert response.status_code == 204
    assert response.data == b""
    again = client.delete(f"/api/itineraries/{trip_id}", headers=h(OWNER))
    assert again.status_code == 404


# --- Owner scoping on every endpoint -------------------------------------------------

def test_other_owner_cannot_see_change_or_delete_my_itinerary(client):
    trip_id = create(client).get_json()["id"]

    listed = client.get("/api/itineraries", headers=h(OTHER)).get_json()
    assert listed["itineraries"] == []

    patched = client.patch(
        f"/api/itineraries/{trip_id}", json={"title": "Hijacked"}, headers=h(OTHER)
    )
    assert patched.status_code == 404
    assert patched.get_json()["error"]["code"] == "not_found"

    deleted = client.delete(f"/api/itineraries/{trip_id}", headers=h(OTHER))
    assert deleted.status_code == 404

    mine = client.get("/api/itineraries", headers=h(OWNER)).get_json()["itineraries"]
    assert [i["title"] for i in mine] == [TRIP["title"]]
