"""SQLAlchemy models for the four tables in docs/database-schema.md (#85).

Change docs/database-schema.md first, then this file, then add a migration:
    flask --app wsgi db migrate -m "describe the change"
    flask --app wsgi db upgrade
"""

import sqlite3
import uuid
from datetime import datetime, timezone

from sqlalchemy import CheckConstraint, Index, PrimaryKeyConstraint, UniqueConstraint, event
from sqlalchemy.types import DateTime, TypeDecorator
from sqlalchemy.engine import Engine
from sqlalchemy.orm import validates

from .extensions import db

# The 17 liveability metrics, in display order (docs/api-contract.md, section 2).
# (id stored in city_scores.metric_id, display name returned by the API)
METRICS = [
    ("HOUSING", "Housing"),
    ("COST_OF_LIVING", "Cost of Living"),
    ("STARTUPS", "Startups"),
    ("VENTURE_CAPITAL", "Venture Capital"),
    ("TRAVEL_CONNECTIVITY", "Travel Connectivity"),
    ("COMMUTE", "Commute"),
    ("BUSINESS_FREEDOM", "Business Freedom"),
    ("SAFETY", "Safety"),
    ("HEALTHCARE", "Healthcare"),
    ("EDUCATION", "Education"),
    ("ENVIRONMENTAL_QUALITY", "Environmental Quality"),
    ("ECONOMY", "Economy"),
    ("TAXATION", "Taxation"),
    ("INTERNET_ACCESS", "Internet Access"),
    ("LEISURE_CULTURE", "Leisure & Culture"),
    ("TOLERANCE", "Tolerance"),
    ("OUTDOORS", "Outdoors"),
]
METRIC_IDS = [metric_id for metric_id, _ in METRICS]
_METRIC_ID_SQL = ", ".join(f"'{metric_id}'" for metric_id in METRIC_IDS)


def _utcnow():
    return datetime.now(timezone.utc)

def _new_uuid():
    return str(uuid.uuid4())

class UTCDateTime(TypeDecorator):
    """A timestamp that always comes back timezone-aware, in UTC.

    SQLite drops the timezone, and PostgreSQL returns values in the server's
    session time zone (e.g. +03:00). Both are normalized to UTC here, so the
    API serializes timestamps the same way on every database.
    """

    impl = DateTime(timezone=True)
    cache_ok = True

    def process_bind_param(self, value, dialect):
        if value is not None and value.tzinfo is not None:
            value = value.astimezone(timezone.utc)
        return value

    def process_result_value(self, value, dialect):
        if value is None:
            return None
        if value.tzinfo is None:  # SQLite: stored in UTC, no timezone attached
            return value.replace(tzinfo=timezone.utc)
        return value.astimezone(timezone.utc)  # PostgreSQL: session time zone -> UTC


@event.listens_for(Engine, "connect")
def _enable_sqlite_foreign_keys(dbapi_connection, connection_record):
    """SQLite ignores foreign keys unless this runs on every connection.

    Without it, ON DELETE CASCADE / RESTRICT would work on PostgreSQL but not
    locally. Does nothing for other databases.
    """
    if isinstance(dbapi_connection, sqlite3.Connection):
        cursor = dbapi_connection.cursor()
        cursor.execute("PRAGMA foreign_keys=ON")
        cursor.close()


class City(db.Model):
    __tablename__ = "cities"

    id = db.Column(db.String(64), primary_key=True)  # slug, e.g. "lisbon"
    name = db.Column(db.String(120), nullable=False)
    country = db.Column(db.String(120), nullable=False)
    wiki_title = db.Column(db.String(200), nullable=False)
    latitude = db.Column(db.Float, nullable=True)
    longitude = db.Column(db.Float, nullable=True)
    is_sample_data = db.Column(db.Boolean, nullable=False, default=True, server_default=db.true())
    score_source = db.Column(db.Text, nullable=False, default="", server_default="")
    created_at = db.Column(UTCDateTime(), nullable=False, default=_utcnow)
    updated_at = db.Column(
        UTCDateTime(), nullable=False, default=_utcnow, onupdate=_utcnow
    )

    scores = db.relationship(
        "CityScore",
        back_populates="city",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )

    __table_args__ = (
        PrimaryKeyConstraint("id", name="pk_cities"),
        UniqueConstraint("name", "country", name="uq_cities_name_country"),
        CheckConstraint(
            "latitude IS NULL OR (latitude >= -90 AND latitude <= 90)",
            name="ck_cities_latitude_range",
        ),
        CheckConstraint(
            "longitude IS NULL OR (longitude >= -180 AND longitude <= 180)",
            name="ck_cities_longitude_range",
        ),
    )

    def __repr__(self):
        return f"<City {self.id}>"


class CityScore(db.Model):
    __tablename__ = "city_scores"

    id = db.Column(db.Integer, primary_key=True)
    city_id = db.Column(
        db.String(64),
        db.ForeignKey("cities.id", ondelete="CASCADE", name="fk_city_scores_city_id_cities"),
        nullable=False,
    )
    metric_id = db.Column(db.String(32), nullable=False)
    score = db.Column(db.Float, nullable=False)

    city = db.relationship("City", back_populates="scores")

    __table_args__ = (
        PrimaryKeyConstraint("id", name="pk_city_scores"),
        UniqueConstraint("city_id", "metric_id", name="uq_city_scores_city_metric"),
        CheckConstraint("score >= 0 AND score <= 10", name="ck_city_scores_score_range"),
        CheckConstraint(f"metric_id IN ({_METRIC_ID_SQL})", name="ck_city_scores_metric_id"),
    )

    def __repr__(self):
        return f"<CityScore {self.city_id} {self.metric_id}={self.score}>"


class ShortlistItem(db.Model):
    __tablename__ = "shortlist_items"

    id = db.Column(db.Integer, primary_key=True)
    owner_id = db.Column(db.String(36), nullable=False)
    city_id = db.Column(
        db.String(64),
        db.ForeignKey("cities.id", ondelete="CASCADE", name="fk_shortlist_items_city_id_cities"),
        nullable=False,
    )
    # 1-based. Not unique on purpose: reordering rewrites every position at once
    # (see docs/database-schema.md).
    position = db.Column(db.Integer, nullable=False)
    created_at = db.Column(UTCDateTime(), nullable=False, default=_utcnow)

    city = db.relationship("City")

    __table_args__ = (
        PrimaryKeyConstraint("id", name="pk_shortlist_items"),
        UniqueConstraint("owner_id", "city_id", name="uq_shortlist_owner_city"),
        CheckConstraint("position >= 1", name="ck_shortlist_position_positive"),
        Index("ix_shortlist_items_owner_id", "owner_id"),
    )

    def __repr__(self):
        return f"<ShortlistItem {self.owner_id} {self.city_id} #{self.position}>"


class Itinerary(db.Model):
    __tablename__ = "itineraries"

    id = db.Column(db.Integer, primary_key=True)
    owner_id = db.Column(db.String(36), nullable=False)
    city_id = db.Column(
        db.String(64),
        db.ForeignKey("cities.id", ondelete="RESTRICT", name="fk_itineraries_city_id_cities"),
        nullable=False,
    )
    title = db.Column(db.String(200), nullable=False)
    start_date = db.Column(db.Date, nullable=False)
    end_date = db.Column(db.Date, nullable=False)
    notes = db.Column(db.Text, nullable=False, default="", server_default="")
    created_at = db.Column(UTCDateTime(), nullable=False, default=_utcnow)
    updated_at = db.Column(
        UTCDateTime(), nullable=False, default=_utcnow, onupdate=_utcnow
    )

    city = db.relationship("City")

    __table_args__ = (
        PrimaryKeyConstraint("id", name="pk_itineraries"),
        CheckConstraint("end_date >= start_date", name="ck_itineraries_dates"),
        CheckConstraint("title <> ''", name="ck_itineraries_title_not_empty"),
        Index("ix_itineraries_owner_id", "owner_id"),
    )

    def __repr__(self):
        return f"<Itinerary {self.id} {self.city_id}>"

class User(db.Model):
    __tablename__ = "users"

    id = db.Column(db.String(36), primary_key=True, default=_new_uuid)
    email = db.Column(db.String(254), nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    is_admin = db.Column(db.Boolean, nullable=False, default=False, server_default=db.false())
    created_at = db.Column(UTCDateTime(), nullable=False, default=_utcnow)

    __table_args__ = (
        PrimaryKeyConstraint("id", name="pk_users"),
        UniqueConstraint("email", name="uq_users_email"),
        CheckConstraint("email = lower(trim(email))", name="ck_users_email_normalized"),
        CheckConstraint("email <> ''", name="ck_users_email_not_empty"),
    )

    @validates("email")
    def _normalize_email(self, key, value):
        return value.strip().lower() if isinstance(value, str) else value

    def __repr__(self):
        return f"<User {self.id} {self.email}>"
