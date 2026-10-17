"""Checks Add cities API endpoints and response formatting- #97

NOTE: Reusing testing app setups from tests.test_models.py
To run this test:
    pytest -v   - runs all tests including test_models.py
"""

import pytest
from app.extensions import db
from app.models import METRICS, City, CityScore
from sqlalchemy.orm import selectinload
from flask_sqlalchemy.query import Query

from tests.test_models import app


@pytest.fixture
def client(app):
    """Provides a functional test client bound to your app and active migration fixture."""
    return app.test_client()


@pytest.fixture
def seed_test_cities(app):
    """Seeds exactly 12 specific test cities inside the active database transaction context."""
    city_data = [
        ("nairobi", "Nairobi", "Kenya"),
        ("lisbon", "Lisbon", "Portugal"),
        ("tokyo", "Tokyo", "Japan"),
        ("berlin", "Berlin", "Germany"),
        ("paris", "Paris", "France"),
        ("london", "London", "United Kingdom"),
        ("austin", "Austin", "United States"),
        ("sydney", "Sydney", "Australia"),
        ("cairo", "Cairo", "Egypt"),
        ("mumbai", "Mumbai", "India"),
        ("no_scores_city", "Empty Ville", "Unknown"),
        ("partial_scores_city", "Partial Ville", "Unknown"),
    ]

    cities = []
    for city_id, name, country in city_data:
        city = City(
            id=city_id,
            name=name,
            country=country,
            wiki_title=f"{name}_Wiki",
            is_sample_data=True,
            score_source="Automated Mock Engine Context"
        )
        db.session.add(city)
        cities.append(city)
    db.session.flush()

    for index, (metric_id, _) in enumerate(METRICS):
        score_val = 5.0 if index % 2 == 0 else 6.0
        db.session.add(CityScore(city_id="nairobi", metric_id=metric_id, score=score_val))

    for city in cities:
        if city.id in ["nairobi", "no_scores_city", "partial_scores_city"]:
            continue
        for metric_id, _ in METRICS:
            db.session.add(CityScore(city_id=city.id, metric_id=metric_id, score=7.0))

    
    for i in range(3):
        metric_id = METRICS[i][0]
        db.session.add(CityScore(city_id="partial_scores_city", metric_id=metric_id, score=8.0))

    db.session.commit()


def test_get_cities_returns_twelve_sorted_elements(client, seed_test_cities):
    """Verifies that GET /api/cities yields exactly 12 cities sorted alphabetically by name."""
    response = client.get("/api/cities")
    assert response.status_code == 200
    
    data = response.get_json()
    assert len(data) == 12

    returned_names = [city["name"] for city in data]
    assert returned_names == sorted(returned_names)


def test_nairobi_score_computation_equals_fifty_five(client, seed_test_cities):
    """Validates that Nairobi's overall score is evaluated dynamically on the server to exactly 55."""

    response = client.get("/api/cities/nairobi")
    assert response.status_code == 200
    
    data = response.get_json()
    assert data["name"] == "Nairobi"
    assert data["teleportCityScore"] == 55


def test_metrics_comply_with_strict_model_order(client, seed_test_cities):
    """Ensures score arrays follow the sequential layout index specified in the METRICS metadata list."""

    response = client.get("/api/cities/nairobi")
    data = response.get_json()
    
    scores = data["scores"]
    assert len(scores) == 17

    for index, (metric_id, metric_name) in enumerate(METRICS):
        assert scores[index]["id"] == metric_id
        assert scores[index]["name"] == metric_name


def test_city_with_zero_metrics_returns_empty_state(client, seed_test_cities):
    """Confirms that a city with no metrics records yields a null score and an empty list."""

    response = client.get("/api/cities/no_scores_city")
    assert response.status_code == 200
    
    data = response.get_json()
    assert data["teleportCityScore"] is None
    assert data["scores"] == []


def test_city_with_incomplete_metrics(client, seed_test_cities):
    """Verifies partial metric payloads aggregate their total score over valid existing criteria."""

    response = client.get("/api/cities/partial_scores_city")
    assert response.status_code == 200
    
    data = response.get_json()

    assert data["teleportCityScore"] == 80
    assert len(data["scores"]) == 3


def test_invalid_city_id_yields_shared_spec_error(client, seed_test_cities):
    """Validates that a 404 response payload matches the clean JSON criteria configured in contract 1.2."""

    response = client.get("/api/cities/atlantis_lost_slug")
    assert response.status_code == 404
    
    data = response.get_json()
    assert "error" in data
    assert data["error"]["code"] == "city_not_found"
    assert "atlantis_lost_slug" in data["error"]["message"]

def test_get_cities_database_failure(client, seed_test_cities, monkeypatch):
    """Verifies that GET /api/cities returns the standard 500 error when the database query fails."""

    def mock_all(*args, **kwargs):
        raise Exception("Database connection failed")

    monkeypatch.setattr(Query, "all", mock_all)

    response = client.get("/api/cities")

    assert response.status_code == 500

    data = response.get_json()

    assert data["error"]["code"] == "500 internal_error"
    assert data["error"]["message"] == "Unexpected server error"
