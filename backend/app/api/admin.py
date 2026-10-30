import re, unicodedata
from sqlalchemy import func
from sqlalchemy.exc import IntegrityError
from flask import jsonify, request

from ..api_utils import error_response, validation_error
from . import api_bp
from ..auth import admin_required
from ..extensions import db
from ..models import User, City, ShortlistItem, Itinerary, CityScore, METRICS

from .cities import format_city_response

NAME_MAX_LEN, COUNTRY_MAX_LEN, WIKITITLE_MAX_LEN = 120, 120, 200

def slugify_city_name(name):
    """Convert a city name into a lowercase ASCII slug."""
    normalized = unicodedata.normalize("NFKD", name)
    ascii_name = normalized.encode("ascii", "ignore").decode("ascii")

    slug = re.sub(r"[^a-z0-9]+", "-", ascii_name.lower()).strip("-")

    return slug if len(slug) > 0 else None


def _clean_fields(body):
    values, errors = {}, {}
    metric_id_to_label = { metric_id: label for metric_id, label in METRICS }

    # validate name
    name = body.get('name')
    
    if not isinstance(name, str) or not name.strip():
        errors["name"] = "is a required non-empty string"

    elif len(name.strip()) > NAME_MAX_LEN:
        errors["name"] = f"Must be at most {NAME_MAX_LEN} characters"

    else:
        name = name.strip()
        city_id = slugify_city_name(name)

        if not city_id:
            errors["name"] = "Must contain at least one ASCII alphanumeric character."

        else:
            values["name"] = name.strip()
            values["id"] = city_id


    # validate country
    country = body.get('country')

    if not isinstance(country, str) or not country.strip():
        errors["country"] = "is a required non-empty string"

    elif len(country.strip()) > COUNTRY_MAX_LEN:
        errors["country"] = f"Must be at most {COUNTRY_MAX_LEN} characters"

    else:
        values["country"] = country.strip()


    # validate latitude & longitude
    for field, min_value, max_value in (("latitude", -90, 90), ("longitude", -180, 180)):
        value = body.get(field)

        if (
            isinstance(value, bool)
            or not isinstance(value, (int, float))
            or not min_value <= value <= max_value
        ):
            errors[field] = f"Must be a number between {min_value} and {max_value}"
        else:
            values[field] = value
    


    # validate wikititle
    wiki_title = body.get("wikiTitle")

    if isinstance(wiki_title, str) and wiki_title.strip():
        if len(wiki_title.strip()) > WIKITITLE_MAX_LEN:
            errors["wiki_title"] = f"Must be at most {WIKITITLE_MAX_LEN} characters"

        else:
            values["wiki_title"] = wiki_title.strip()

    else:
        values["wiki_title"] = values.get("name", "")

    # validate scores
    received_scores = body.get("scores")

    if not isinstance(received_scores, list):
        errors["scores"] = "Must be a list containing all 17 metrics"
    else:
        validated_scores = {}

        for index, item in  enumerate(received_scores):
            field = f"scores[{index}]"

            if not isinstance(item, dict):
                errors[field]="Must be an object"
                continue

            metric_id = item.get("id")
            score = item.get("scoreOutOf10")

            if not isinstance(metric_id, str) or metric_id not in metric_id_to_label:
                errors[field] = "Unknown metric id"
                continue

            if metric_id in validated_scores:
                errors[field] = f"Duplicate metric id: {metric_id}"
                continue

            if (
                isinstance(score, bool)
                or not isinstance(score, (int, float))
                or not 0 <= score <= 10
            ):
                errors[field] = "Must be a number between 0 and 10"
                continue

            validated_scores[metric_id] = score

        missing_metrics = set(metric_id_to_label) - set(validated_scores)

        if missing_metrics:
            errors["scores"] = f"Missing fields: {', '.join(sorted(missing_metrics))}"
        elif len(received_scores) != len(metric_id_to_label):
            errors["scores"] = "Must contain exactly 17 metric entries."
        else:
            values["scores"] = validated_scores

    return values, errors



@api_bp.get("/admin/stats", strict_slashes=False)
@admin_required
def admin_stats():
    stats = {
        "users": db.session.query(func.count(User.id)).scalar(),
        "cities": db.session.query(func.count(City.id)).scalar(),
        "shortlists": db.session.query(func.count(ShortlistItem.id)).scalar(),
        "itineraries": db.session.query(func.count(Itinerary.id)).scalar(),
    }

    return jsonify(stats), 200

@api_bp.post("/admin/cities", strict_slashes=False)
@admin_required
def create_city():
    body = request.get_json(silent=True)

    # validate body
    if not isinstance(body, dict) or not body:
        return validation_error({"body": "Request body must be a non-empty JSON object."})

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

        for metric_id, score in values["scores"].items():
            metric = CityScore(
                    city_id=city.id,
                    metric_id=metric_id,
                    score=score
                )
            
            db.session.add(metric)

        db.session.commit()

    except IntegrityError:
        db.session.rollback()
        return error_response(409, "internal_server_error", "City could not be saved.")
    
    except Exception:
        db.session.rollback()
        raise

    new_city = db.session.get(City, str(city.id))
    return format_city_response(new_city), 201