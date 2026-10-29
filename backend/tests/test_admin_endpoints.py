
from datetime import date

import pytest
from flask_jwt_extended import create_access_token
from werkzeug.security import generate_password_hash

from app.extensions import db
from app.models import City, Itinerary, ShortlistItem, User, CityScore, METRICS


@pytest.fixture
def client(app):
    return app.test_client()


@pytest.fixture
def seeded_admin_data(app):
    """Seed two users, three cities, two shortlist items, and two itineraries."""
    admin = User(
        id="11111111-1111-4111-8111-111111111111",
        email="admin@example.com",
        password_hash=generate_password_hash("admin-password"),
        is_admin=True,
    )
    regular_user = User(
        id="22222222-2222-4222-8222-222222222222",
        email="user@example.com",
        password_hash=generate_password_hash("user-password"),
        is_admin=False,
    )

    cities = [
        City(
            id="nairobi",
            name="Nairobi",
            country="Kenya",
            wiki_title="Nairobi",
        ),
        City(
            id="lisbon",
            name="Lisbon",
            country="Portugal",
            wiki_title="Lisbon",
        ),
        City(
            id="tokyo",
            name="Tokyo",
            country="Japan",
            wiki_title="Tokyo",
        ),
    ]

    db.session.add_all([admin, regular_user, *cities])
    db.session.flush()

    shortlists = [
        ShortlistItem(
            owner_id=admin.id,
            city_id="nairobi",
            position=1,
        ),
        ShortlistItem(
            owner_id=regular_user.id,
            city_id="lisbon",
            position=1,
        ),
    ]

    itineraries = [
        Itinerary(
            owner_id=admin.id,
            city_id="nairobi",
            title="Nairobi Trip",
            start_date=date(2026, 11, 1),
            end_date=date(2026, 11, 3),
        ),
        Itinerary(
            owner_id=regular_user.id,
            city_id="tokyo",
            title="Tokyo Trip",
            start_date=date(2026, 12, 1),
            end_date=date(2026, 12, 5),
        ),
    ]

    db.session.add_all([*shortlists, *itineraries])
    db.session.commit()

    return {
        "admin": admin,
        "regular_user": regular_user,
    }


@pytest.fixture
def admin_token(app, seeded_admin_data):
    with app.app_context():
        return create_access_token(identity=seeded_admin_data["admin"].id)


@pytest.fixture
def regular_user_token(app, seeded_admin_data):
    with app.app_context():
        return create_access_token(
            identity=seeded_admin_data["regular_user"].id
        )

@pytest.fixture
def valid_city_payload():
    """Build a valid request using the project's actual metric IDs."""
    return {
        "name": "Test City",
        "country": "Test Country",
        "latitude": -1.2921,
        "longitude": 36.8219,
        "wikiTitle": "Test_City",
        "scores": [
            {"id": metric_id, "scoreOutOf10": 5.0}
            for metric_id, _ in METRICS
        ],
    }


def auth_headers(token):
    return {"Authorization": f"Bearer {token}"}

# ------- GET "api/admin/stats" ------------

def test_admin_stats_requires_authentication(client, seeded_admin_data):
    response = client.get("/api/admin/stats")

    assert response.status_code == 401
    assert response.json["error"]["code"] == "missing_token"


def test_admin_stats_forbidden_for_non_admin(
    client, regular_user_token, seeded_admin_data
):
    response = client.get(
        "/api/admin/stats",
        headers=auth_headers(regular_user_token),
    )

    assert response.status_code == 403
    assert response.json["error"]["code"] == "forbidden"


def test_admin_stats_returns_exact_counts(
    client, admin_token, seeded_admin_data
):
    response = client.get(
        "/api/admin/stats",
        headers=auth_headers(admin_token),
    )

    assert response.status_code == 200
    assert response.json == {
        "users": 2,
        "cities": 3,
        "cities shortlisted": 2,
        "itineraries": 2,
    }


# ------- POST "api/admin/cities" ------------

def test_create_city_success(client, app, admin_token, valid_city_payload):
    response = client.post(
        "/api/admin/cities",
        json=valid_city_payload,
        headers=auth_headers(admin_token),
    )

    assert response.status_code == 201

    data = response.get_json()
    assert data["id"] == "test-city"
    assert data["name"] == "Test City"
    assert data["country"] == "Test Country"
    assert data["isSampleData"] is False
    assert data["scoreSource"] == "admin"

    with app.app_context():
        city = db.session.get(City, "test-city")
        assert city is not None
        assert city.wiki_title == "Test_City"

        scores = CityScore.query.filter_by(
            city_id="test-city"
        ).all()

        assert len(scores) == len(METRICS)
        assert {score.metric_id for score in scores} == {
            metric_id for metric_id, _ in METRICS
        }


def test_create_city_defaults_wiki_title(
    client, admin_token, valid_city_payload
):
    valid_city_payload.pop("wikiTitle")

    response = client.post(
        "/api/admin/cities",
        json=valid_city_payload,
        headers=auth_headers(admin_token),
    )

    assert response.status_code == 201
    assert response.get_json()["wikiTitle"] == "Test City"


def test_create_city_slugifies_unicode_name(
    client, admin_token, valid_city_payload
):
    valid_city_payload["name"] = "São Paulo"

    response = client.post(
        "/api/admin/cities",
        json=valid_city_payload,
        headers=auth_headers(admin_token),
    )

    assert response.status_code == 201
    assert response.get_json()["id"] == "sao-paulo"


def test_create_city_rejects_missing_token(client, valid_city_payload):
    response = client.post("/api/admin/cities", json=valid_city_payload)

    assert response.status_code == 401
    assert response.get_json()["error"]["code"] == "missing_token"


def test_create_city_rejects_non_admin(
    client, regular_user_token, valid_city_payload
):
    response = client.post(
        "/api/admin/cities",
        json=valid_city_payload,
        headers=auth_headers(regular_user_token),
    )

    assert response.status_code == 403
    assert response.get_json()["error"]["code"] == "forbidden"


@pytest.mark.parametrize(
    "body",
    [
        None,
        {},
        [],
        "not an object",
    ],
)
def test_create_city_rejects_invalid_body(client, admin_token, body):
    headers = auth_headers(admin_token)

    if body is None:
        response = client.post("/api/admin/cities", headers=headers)
    else:
        response = client.post("/api/admin/cities", json=body, headers=headers)

    assert response.status_code == 400


@pytest.mark.parametrize(
    ("field", "value"),
    [
        ("name", ""),
        ("name", "   "),
        ("name", None),
        ("country", ""),
        ("country", "   "),
        ("country", None),
        ("latitude", None),
        ("latitude", -91),
        ("latitude", 91),
        ("latitude", True),
        ("longitude", None),
        ("longitude", -181),
        ("longitude", 181),
        ("longitude", False),
    ],
)
def test_create_city_rejects_invalid_fields(
    client, admin_token, valid_city_payload, field, value
):
    valid_city_payload[field] = value

    response = client.post(
        "/api/admin/cities",
        json=valid_city_payload,
        headers=auth_headers(admin_token),
    )

    assert response.status_code == 400
    assert field in response.get_json()["error"]["details"]["fields"]


def test_create_city_rejects_name_without_ascii_characters(
    client, admin_token, valid_city_payload
):
    valid_city_payload["name"] = "東京"

    response = client.post(
        "/api/admin/cities",
        json=valid_city_payload,
        headers=auth_headers(admin_token),
    )

    assert response.status_code == 400
    assert "name" in response.get_json()["error"]["details"]["fields"]


@pytest.mark.parametrize(
    "scores",
    [
        None,
        {},
        "invalid",
        [],
    ],
)
def test_create_city_rejects_invalid_scores_container(
    client, admin_token, valid_city_payload, scores
):
    valid_city_payload["scores"] = scores

    response = client.post(
        "/api/admin/cities",
        json=valid_city_payload,
        headers=auth_headers(admin_token),
    )

    assert response.status_code == 400
    assert "scores" in response.get_json()["error"]["details"]["fields"]


def test_create_city_rejects_missing_metric(
    client, admin_token, valid_city_payload
):
    valid_city_payload["scores"].pop()

    response = client.post(
        "/api/admin/cities",
        json=valid_city_payload,
        headers=auth_headers(admin_token),
    )

    assert response.status_code == 400
    assert "scores" in response.get_json()["error"]["details"]["fields"]


def test_create_city_rejects_duplicate_metric(
    client, admin_token, valid_city_payload
):
    valid_city_payload["scores"].append(
        valid_city_payload["scores"][0].copy()
    )

    response = client.post(
        "/api/admin/cities",
        json=valid_city_payload,
        headers=auth_headers(admin_token),
    )

    assert response.status_code == 400


def test_create_city_rejects_unknown_metric(
    client, admin_token, valid_city_payload
):
    valid_city_payload["scores"][0]["id"] = "UNKNOWN_METRIC"

    response = client.post(
        "/api/admin/cities",
        json=valid_city_payload,
        headers=auth_headers(admin_token),
    )

    assert response.status_code == 400


@pytest.mark.parametrize("score", [-0.1, 10.1, True, "5", None])
def test_create_city_rejects_invalid_score(
    client, admin_token, valid_city_payload, score
):
    valid_city_payload["scores"][0]["scoreOutOf10"] = score

    response = client.post(
        "/api/admin/cities",
        json=valid_city_payload,
        headers=auth_headers(admin_token),
    )

    assert response.status_code == 400


def test_create_city_rejects_duplicate_name_and_country(
    client, admin_token, valid_city_payload
):
    first_response = client.post(
        "/api/admin/cities",
        json=valid_city_payload,
        headers=auth_headers(admin_token),
    )
    assert first_response.status_code == 201

    duplicate_payload = {
        **valid_city_payload,
        "name": "TEST CITY",
        "country": "test country",
    }

    response = client.post(
        "/api/admin/cities",
        json=duplicate_payload,
        headers=auth_headers(admin_token),
    )

    assert response.status_code == 409
    assert response.get_json()["error"]["code"] == "city_already_exists"


def test_create_city_rejects_duplicate_generated_id(
    client, app, admin_token, valid_city_payload
):
    # Create a city with the same ID but a different name/country.
    with app.app_context():
        db.session.add(
            City(
                id="test-city",
                name="Different Name",
                country="Different Country",
                wiki_title="Different Name",
                latitude=0,
                longitude=0,
                is_sample_data=True,
                score_source="test",
            )
        )
        db.session.commit()

    response = client.post(
        "/api/admin/cities",
        json=valid_city_payload,
        headers=auth_headers(admin_token),
    )

    assert response.status_code == 409
    assert response.get_json()["error"]["code"] == "city_already_exists"