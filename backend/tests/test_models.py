"""Checks for #85: the first migration builds every table on a fresh database,
and the constraints in docs/database-schema.md are really enforced.

Run from backend/ with the venv active:
    pytest
To run the same checks against PostgreSQL, point TEST_DATABASE_URL at an
empty database first, e.g.
    TEST_DATABASE_URL=postgresql://user:pass@localhost/nomadscore_test pytest
"""

import os
from datetime import date

import pytest
from flask_migrate import downgrade, upgrade
from sqlalchemy import inspect
from sqlalchemy.exc import IntegrityError

from app import create_app
from app.config import Config
from app.extensions import db
from app.models import METRIC_IDS, City, CityScore, Itinerary, ShortlistItem

BACKEND_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MIGRATIONS_DIR = os.path.join(BACKEND_DIR, "migrations")
OWNER = "3f2b8c1e-9a4d-4e7b-8c55-1d2e3f4a5b6c"
OTHER_OWNER = "9b1d2c3e-4f5a-4b6c-8d7e-0f1a2b3c4d5e"


@pytest.fixture
def app(tmp_path):
    url = os.environ.get("TEST_DATABASE_URL")
    if url and url.startswith(("postgres://", "postgresql://")):
        url = "postgresql+psycopg2://" + url.split("://", 1)[1]

    class TestConfig(Config):
        TESTING = True
        SQLALCHEMY_DATABASE_URI = url or f"sqlite:///{tmp_path / 'test.db'}"

    app = create_app(TestConfig)
    with app.app_context():
        upgrade(directory=MIGRATIONS_DIR)
        yield app
        db.session.remove()
        downgrade(directory=MIGRATIONS_DIR, revision="base")


def add_city(city_id="lisbon", name="Lisbon", country="Portugal"):
    city = City(id=city_id, name=name, country=country, wiki_title=name)
    db.session.add(city)
    db.session.commit()
    return city


def assert_rejected(*rows):
    db.session.add_all(rows)
    with pytest.raises(IntegrityError):
        db.session.commit()
    db.session.rollback()


def test_upgrade_creates_all_four_tables(app):
    tables = set(inspect(db.engine).get_table_names())
    assert {"cities", "city_scores", "shortlist_items", "itineraries"} <= tables


def test_city_defaults(app):
    city = add_city()
    assert city.is_sample_data is True
    assert city.score_source == ""
    assert city.created_at is not None


def test_city_name_and_country_unique(app):
    add_city("lisbon")
    assert_rejected(City(id="lisbon-2", name="Lisbon", country="Portugal", wiki_title="Lisbon"))


def test_city_latitude_range(app):
    assert_rejected(City(id="x", name="X", country="Y", wiki_title="X", latitude=95))


def test_one_score_per_metric_per_city(app):
    add_city()
    db.session.add(CityScore(city_id="lisbon", metric_id="HOUSING", score=3.1))
    db.session.commit()
    assert_rejected(CityScore(city_id="lisbon", metric_id="HOUSING", score=5.0))


def test_score_must_be_between_0_and_10(app):
    add_city()
    assert_rejected(CityScore(city_id="lisbon", metric_id="SAFETY", score=10.5))
    assert_rejected(CityScore(city_id="lisbon", metric_id="SAFETY", score=-1))


def test_metric_id_must_be_one_of_the_17(app):
    add_city()
    assert len(METRIC_IDS) == 17
    assert_rejected(CityScore(city_id="lisbon", metric_id="NIGHTLIFE", score=5))


def test_score_needs_a_real_city(app):
    assert_rejected(CityScore(city_id="atlantis", metric_id="HOUSING", score=5))


def test_shortlist_owner_cannot_add_same_city_twice(app):
    add_city()
    db.session.add(ShortlistItem(owner_id=OWNER, city_id="lisbon", position=1))
    db.session.commit()
    assert_rejected(ShortlistItem(owner_id=OWNER, city_id="lisbon", position=2))


def test_shortlist_different_owners_can_add_same_city(app):
    add_city()
    db.session.add_all([
        ShortlistItem(owner_id=OWNER, city_id="lisbon", position=1),
        ShortlistItem(owner_id=OTHER_OWNER, city_id="lisbon", position=1),
    ])
    db.session.commit()
    assert ShortlistItem.query.count() == 2


def test_shortlist_position_starts_at_1(app):
    add_city()
    assert_rejected(ShortlistItem(owner_id=OWNER, city_id="lisbon", position=0))


def test_itinerary_end_date_not_before_start_date(app):
    add_city()
    assert_rejected(Itinerary(owner_id=OWNER, city_id="lisbon", title="Trip",
                              start_date=date(2026, 11, 17), end_date=date(2026, 11, 3)))


def test_itinerary_title_not_empty(app):
    add_city()
    assert_rejected(Itinerary(owner_id=OWNER, city_id="lisbon", title="",
                              start_date=date(2026, 11, 3), end_date=date(2026, 11, 3)))


def test_deleting_a_city_cascades_to_scores_and_shortlist(app):
    add_city()
    db.session.add_all([
        CityScore(city_id="lisbon", metric_id="HOUSING", score=3.1),
        ShortlistItem(owner_id=OWNER, city_id="lisbon", position=1),
    ])
    db.session.commit()
    db.session.execute(City.__table__.delete().where(City.id == "lisbon"))
    db.session.commit()
    assert CityScore.query.count() == 0
    assert ShortlistItem.query.count() == 0


def test_deleting_a_city_with_itineraries_is_blocked(app):
    add_city()
    db.session.add(Itinerary(owner_id=OWNER, city_id="lisbon", title="Trip",
                             start_date=date(2026, 11, 3), end_date=date(2026, 11, 17)))
    db.session.commit()
    with pytest.raises(IntegrityError):
        db.session.execute(City.__table__.delete().where(City.id == "lisbon"))
        db.session.commit()
    db.session.rollback()
