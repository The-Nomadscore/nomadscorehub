from flask import jsonify, request
from sqlalchemy import func
from sqlalchemy.exc import IntegrityError

from ..api_utils import error_response, require_owner_id, validation_error
from ..extensions import db
from ..models import City, ShortlistItem
from . import api_bp


def _owner_items(owner_id):
    return (
        ShortlistItem.query.filter_by(owner_id=owner_id)
        .order_by(ShortlistItem.position)
        .all()
    )


def _serialize(items):
    return [{"city_id": i.city_id, "position": i.position} for i in items]


@api_bp.get("/shortlist")
@require_owner_id
def list_shortlist(owner_id):
    return jsonify({"items": _serialize(_owner_items(owner_id))}), 200


@api_bp.post("/shortlist")
@require_owner_id
def add_to_shortlist(owner_id):
    body = request.get_json(silent=True)
    city_id = body.get("city_id") if isinstance(body, dict) else None
    if not isinstance(city_id, str) or not city_id.strip():
        return validation_error({"city_id": "must be a non-empty string"})
    city_id = city_id.strip()

    if db.session.get(City, city_id) is None:
        return error_response(404, "city_not_found", "No city matches that city_id.")

    already = ShortlistItem.query.filter_by(owner_id=owner_id, city_id=city_id).first()
    if already is not None:
        return error_response(
            409, "already_in_shortlist", "That city is already in your shortlist."
        )

    last = (
        db.session.query(func.max(ShortlistItem.position))
        .filter(ShortlistItem.owner_id == owner_id)
        .scalar()
        or 0
    )
    item = ShortlistItem(owner_id=owner_id, city_id=city_id, position=last + 1)
    db.session.add(item)
    try:
        db.session.commit()
    except IntegrityError:
        # Two simultaneous adds: the unique constraint is the real guard.
        db.session.rollback()
        return error_response(
            409, "already_in_shortlist", "That city is already in your shortlist."
        )
    return jsonify({"city_id": item.city_id, "position": item.position}), 201


@api_bp.put("/shortlist/order")
@require_owner_id
def reorder_shortlist(owner_id):
    body = request.get_json(silent=True)
    ids = body.get("city_ids") if isinstance(body, dict) else None
    if not isinstance(ids, list) or not all(isinstance(i, str) for i in ids):
        return validation_error({"city_ids": "must be a list of city id strings"})
    if len(set(ids)) != len(ids):
        return validation_error({"city_ids": "must not contain duplicates"})

    by_city = {item.city_id: item for item in _owner_items(owner_id)}
    if set(ids) != set(by_city):
        return validation_error(
            {"city_ids": "must contain exactly the cities already in the shortlist"}
        )

    # Position is not unique in the table, so rewriting all at once is safe.
    for position, city_id in enumerate(ids, start=1):
        by_city[city_id].position = position
    db.session.commit()
    return jsonify({"items": _serialize(_owner_items(owner_id))}), 200


@api_bp.delete("/shortlist/<city_id>")
@require_owner_id
def remove_from_shortlist(owner_id, city_id):
    item = ShortlistItem.query.filter_by(owner_id=owner_id, city_id=city_id).first()
    if item is None:
        return error_response(
            404, "not_found", "That city is not in this shortlist."
        )
    db.session.delete(item)
    db.session.flush()
    # Keep positions 1..n with no gaps.
    for position, remaining in enumerate(_owner_items(owner_id), start=1):
        remaining.position = position
    db.session.commit()
    return "", 204