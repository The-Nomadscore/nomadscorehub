
from datetime import date

import pytest
from flask_jwt_extended import create_access_token
from werkzeug.security import generate_password_hash

from app.extensions import db
from app.models import City, Itinerary, ShortlistItem, User


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


def auth_headers(token):
    return {"Authorization": f"Bearer {token}"}


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
        "shortlists": 2,
        "itineraries": 2,
    }