import re, unicodedata
from sqlalchemy import func
from flask import jsonify, request

from ..api_utils import error_response, validation_error
from . import api_bp
from ..auth import admin_required
from ..extensions import db
from ..models import User, City, ShortlistItem, Itinerary, CityScore, METRICS

from .cities import format_city_response

def slugify_city_name(name):
    """Convert a city name into a lowercase ASCII slug."""
    normalized = unicodedata.normalize("NFKD", name)
    ascii_name = normalized.encode("ascii", "ignore").decode("ascii")

    cleaned = re.sub(r"[^a-zA-Z0-9 -]+", "", ascii_name.lower())
    slug = re.sub(r" +", "-", cleaned.strip())

    return slug if slug.length < 1 else None


def _clean_fields(body):
    values, errors = {}, {}

    # validate name
    if "name" in body:
        name = body.get('name')
        id = slugify_city_name(name)

        if not isinstance(name, str) or not id:
            errors["name"] = "is required and must be a non-empty string with atleast one ASCII character"
        else:
            values["name"] = name.strip()
            values["id"] = id
    else:
        errors["name"] = "is required and must be a non-empty string with atleast one ASCII character"

    # validate country
    if "country" in body:
        country = body.get('country')
        if not isinstance(country, str) or not country.strip():
            errors["country"] = "is a required non-empty string"
        else:
            values["country"] = country.strip()
    else:
        errors["country"] = "is a required non-empty string"

    # validate latitude & longitude
    for field in ("latitude", "longitude"):
        if field in body:
            value = body.get(field)

            if  not isinstance(value, (int, float)) or not -180 <= value <= 180:
                errors[field] = "Must be a number between -90 and 90."
            else:
                values[field] = value
        else:
            errors[field] = "Must be a number between -90 and 90."


    # validate wikititle
    wikiTitle = body.get("wikiTitle")
    if isinstance(wikiTitle, str) and wikiTitle.strip():
        values["wiki_title"] = wikiTitle.strip()
    else:
        values["wiki_title"] = values["name"]

    # validate scores
    if "scores" in body:
        metric_id_to_label = { metric_id: label for metric_id, label in METRICS }

        received_scores = body.get("scores")
        validated_scores = {}

        if not isinstance(received_scores, list):
            errors["scores"] = "Must be a list containing all 17 metrics"

        else:
            for index, item in  enumerate(received_scores):
                field = f"scores[{index}]"

                if not isinstance(item, dict):
                    errors[field]="Must be an object"
                    continue

                metric_id = item.get("id")
                score = item.get("scoreOutOf10")

                if metric_id not in metric_id_to_label:
                    errors[field] = "Unknown metric id"
                    continue

                if metric_id in validated_scores:
                    errors[field] = f"Duplicate metric id: {metric_id}"
                    continue

                if not isinstance(score, (int, float)) or not 0 <= score <= 10:
                    errors[field] = "Must be a number between 0 and 10"
                    continue

                validated_scores[metric_id] = score

            missing_fields = set(metric_id_to_label) - set(validated_scores)
            if missing_fields:
                errors["scores"] = f"Missing fields: {', '.join(sorted(missing_fields))}"
            else:
                values["scores"] = validated_scores

    return values, errors



@api_bp.get("/admin/stats", strict_slashes=False)
@admin_required
def admin_stats():
    stats = {
        "users": db.session.query(func.count(User.id)).scalar(),
        "cities": db.session.query(func.count(City.id)).scalar(),
        "cities shortlisted": db.session.query(func.count(ShortlistItem.id)).scalar(),
        "itineraries": db.session.query(func.count(Itinerary.id)).scalar(),
    }

    return jsonify(stats), 200

@api_bp.post("/admin/cities", strict_slashes=False)
@admin_required
def create_citty():
    body = request.get_json(silent=True)

    # validate body
    if not isinstance(body, dict):
        return validation_error({}, "Request body must be a JSON object.")

    # validate fields
    values, errors = _clean_fields(body)

    if errors:
        return validation_error(errors)

    # check if city already exists
    duplicate = db.session.query(City.id).filter(
        func.lower(City.name) == values["name"].lower(),
        func.lower(City.country) == values["country"].lower(),
    ).first()

    if duplicate or db.session.get(City, values["id"]):
        return error_response(409, "city_already_exists", "A city with this name and country, or generated ID, already exists.")

    # create city object
    city = City(
        id=values["id"],
        name=values["name"],
        country=values["country"],
        wiki_title=values["wiki_title"],
        latitude=values["latitude"],
        longitude=values["longitude"],
        is_sample_data=False,
        score_source="admin",
    )

    # save to db
    try:
        db.session.add(city)
        db.session.flush()

        for metric_id, score in values["scores"]:
            db.session.add(
                CityScore(
                    city_id=city.id,
                    metric_id=metric_id,
                    score_out_of_10=score
                )
            )
        db.session.commit()

    except Exception:
        db.session.rollback()
        validation_error({}, "Itinerary could not be saved.")

    city = db.session.get(City, str(city.id))
    return format_city_response(city), 201