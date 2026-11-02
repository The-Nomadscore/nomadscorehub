"""Itinerary endpoints (#99). See docs/api-contract.md, section 3.4.

Every route needs a token (Authorization: Bearer). A user only ever sees or
changes their own itineraries; another user's id returns 404 not_found, so ids
don't reveal what exists. Checks run in the contract's order: token, then
body, then whether the record exists.
"""

import re
from datetime import date

from flask import jsonify, request
from flask_jwt_extended import current_user, jwt_required
from sqlalchemy.exc import IntegrityError

from ..api_utils import error_response, validation_error
from ..extensions import db
from ..models import City, Itinerary
from . import api_bp

TITLE_MAX = 200  # matches itineraries.title VARCHAR(200)
_ISO_DATE = re.compile(r"^\d{4}-\d{2}-\d{2}$")


def _serialize(itinerary):
    return {
        "id": itinerary.id,
        "city_id": itinerary.city_id,
        "title": itinerary.title,
        "start_date": itinerary.start_date.isoformat(),
        "end_date": itinerary.end_date.isoformat(),
        "notes": itinerary.notes,
    }


def _json_object():
    body = request.get_json(silent=True)
    return body if isinstance(body, dict) else None


def _parse_date(value):
    """'YYYY-MM-DD' -> date, or None if missing, wrong type or not a real date."""
    if not isinstance(value, str) or not _ISO_DATE.match(value):
        return None
    try:
        return date.fromisoformat(value)
    except ValueError:  # e.g. 2026-02-30
        return None


def _clean_fields(body, required):
    """Validate the editable fields present in body.

    Returns (values, errors). With required=True (create), title, start_date
    and end_date must be present; with required=False (update), only the
    fields that were sent are checked.
    """
    values, errors = {}, {}

    if "title" in body or required:
        title = body.get("title")
        if not isinstance(title, str) or not title.strip():
            errors["title"] = "is required and must be a non-empty string"
        elif len(title.strip()) > TITLE_MAX:
            errors["title"] = f"must be at most {TITLE_MAX} characters"
        else:
            values["title"] = title.strip()

    for field in ("start_date", "end_date"):
        if field in body or required:
            parsed = _parse_date(body.get(field))
            if parsed is None:
                errors[field] = "is required and must be a date in YYYY-MM-DD format"
            else:
                values[field] = parsed

    if "notes" in body:
        notes = body.get("notes")
        if notes is None:
            values["notes"] = ""
        elif not isinstance(notes, str):
            errors["notes"] = "must be a string"
        else:
            values["notes"] = notes

    return values, errors


def _dates_error(start, end):
    if end < start:
        return {"end_date": "must be on or after start_date"}
    return None


def _owned_itinerary(itinerary_id):
    return Itinerary.query.filter_by(id=itinerary_id, user_id=current_user.id).first()


def _not_found():
    return error_response(404, "not_found", "No itinerary with that id.")


@api_bp.get("/itineraries", strict_slashes=False)
@jwt_required()
def list_itineraries():
    itineraries = (
        Itinerary.query.filter_by(user_id=current_user.id)
        .order_by(Itinerary.start_date, Itinerary.id)
        .all()
    )
    return jsonify({"itineraries": [_serialize(i) for i in itineraries]}), 200


@api_bp.post("/itineraries", strict_slashes=False)
@jwt_required()
def create_itinerary():
    body = _json_object()
    if body is None:
        return validation_error({}, "Request body must be a JSON object.")

    values, errors = _clean_fields(body, required=True)

    city_id = body.get("city_id")
    if not isinstance(city_id, str) or not city_id.strip():
        errors["city_id"] = "is required and must be a non-empty string"
    else:
        city_id = city_id.strip()

    if not errors:
        errors = _dates_error(values["start_date"], values["end_date"]) or {}
    if errors:
        return validation_error(errors)

    if db.session.get(City, city_id) is None:
        return error_response(404, "city_not_found", "No city matches that city_id.")

    itinerary = Itinerary(user_id=current_user.id, city_id=city_id, **values)
    db.session.add(itinerary)
    try:
        db.session.commit()
    except IntegrityError:
        # The database CHECK/FK constraints are the last line of defence.
        db.session.rollback()
        return validation_error({}, "Itinerary could not be saved.")
    return jsonify(_serialize(itinerary)), 201


@api_bp.patch("/itineraries/<int:itinerary_id>")
@jwt_required()
def update_itinerary(itinerary_id):
    body = _json_object()
    if body is None:
        return validation_error({}, "Request body must be a JSON object.")

    errors = {
        field: "cannot be changed"
        for field in ("id", "city_id")
        if field in body
    }
    values, field_errors = _clean_fields(body, required=False)
    errors.update(field_errors)
    if not errors and not values:
        return validation_error(
            {}, "Send at least one of: title, start_date, end_date, notes."
        )
    if errors:
        return validation_error(errors)

    itinerary = _owned_itinerary(itinerary_id)
    if itinerary is None:
        return _not_found()

    # Check the dates against the stored values when only one is being changed.
    dates_error = _dates_error(
        values.get("start_date", itinerary.start_date),
        values.get("end_date", itinerary.end_date),
    )
    if dates_error:
        return validation_error(dates_error)

    for field, value in values.items():
        setattr(itinerary, field, value)
    try:
        db.session.commit()
    except IntegrityError:
        db.session.rollback()
        return validation_error({}, "Itinerary could not be saved.")
    return jsonify(_serialize(itinerary)), 200


@api_bp.delete("/itineraries/<int:itinerary_id>")
@jwt_required()
def delete_itinerary(itinerary_id):
    itinerary = _owned_itinerary(itinerary_id)
    if itinerary is None:
        return _not_found()
    db.session.delete(itinerary)
    db.session.commit()
    return "", 204
