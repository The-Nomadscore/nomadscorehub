"""SQLAlchemy models for the four tables in docs/database-schema.md (#85).

Change docs/database-schema.md first, then this file, then add a migration:
    flask --app wsgi db migrate -m "describe the change"
    flask --app wsgi db upgrade
"""

from datetime import datetime, timezone

from sqlalchemy import CheckConstraint, Index, UniqueConstraint, event
from sqlalchemy.engine import Engine

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


@event.listens_for(Engine, "connect")
def _enable_sqlite_foreign_keys(dbapi_connection, connection_record):
    """SQLite ignores foreign keys unless this runs on every connection.

    Without it, ON DELETE CASCADE / RESTRICT would work on PostgreSQL but not
    locally. Does nothing for other databases.
    """
    if type(dbapi_connection).__module__.startswith("sqlite3"):
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
    created_at = db.Column(db.DateTime(timezone=True), nullable=False, default=_utcnow)
    updated_at = db.Column(
        db.DateTime(timezone=True), nullable=False, default=_utcnow, onupdate=_utcnow
    )

    scores = db.relationship(
        "CityScore",
        back_populates="city",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )

    __table_args__ = (
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
        db.String(64), db.ForeignKey("cities.id", ondelete="CASCADE"), nullable=False
    )
    metric_id = db.Column(db.String(32), nullable=False)
    score = db.Column(db.Float, nullable=False)

    city = db.relationship("City", back_populates="scores")

    __table_args__ = (
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
        db.String(64), db.ForeignKey("cities.id", ondelete="CASCADE"), nullable=False
    )
    # 1-based. Not unique on purpose: reordering rewrites every position at once
    # (see docs/database-schema.md).
    position = db.Column(db.Integer, nullable=False)
    created_at = db.Column(db.DateTime(timezone=True), nullable=False, default=_utcnow)

    city = db.relationship("City")

    __table_args__ = (
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
        db.String(64), db.ForeignKey("cities.id", ondelete="RESTRICT"), nullable=False
    )
    title = db.Column(db.String(200), nullable=False)
    start_date = db.Column(db.Date, nullable=False)
    end_date = db.Column(db.Date, nullable=False)
    notes = db.Column(db.Text, nullable=False, default="", server_default="")
    created_at = db.Column(db.DateTime(timezone=True), nullable=False, default=_utcnow)
    updated_at = db.Column(
        db.DateTime(timezone=True), nullable=False, default=_utcnow, onupdate=_utcnow
    )

    city = db.relationship("City")

    __table_args__ = (
        CheckConstraint("end_date >= start_date", name="ck_itineraries_dates"),
        CheckConstraint("title <> ''", name="ck_itineraries_title_not_empty"),
        Index("ix_itineraries_owner_id", "owner_id"),
    )

    def __repr__(self):
        return f"<Itinerary {self.id} {self.city_id}>"
