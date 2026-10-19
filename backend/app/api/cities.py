from flask import jsonify
from sqlalchemy.orm import selectinload

from . import api_bp
from app.extensions import db
from app.models import City, METRICS
from app.api_utils import error_response

def format_city_response(city: City) -> dict:
    """Formats a city model into a prop-contract compliant response"""

    formatted_scores = []
    total_scores = 0.0
    score_count = 0

    city_scores = {s.metric_id: float(s.score) for s in city.scores}

    for metric_id, metric_name in METRICS:
        if metric_id in city_scores:
            score_value = city_scores[metric_id]

            formatted_scores.append({
                "id": metric_id,
                "name": metric_name,
                "scoreOutOf10": score_value
            })

            total_scores += score_value
            score_count += 1


    if score_count > 0:
        average_out_of_10 = total_scores / score_count
        teleport_city_score = round(average_out_of_10 * 10)

    else:
        teleport_city_score = None

    return {
        "id": str(city.id),
        "name": city.name,
        "country": city.country,
        "wikiTitle": city.wiki_title if city.wiki_title else "",
        "latitude": float(city.latitude) if city.latitude is not None else None,
        "longitude": float(city.longitude) if city.longitude is not None else None,
        "isSampleData": bool(city.is_sample_data),
        "scoreSource": getattr(city, "score_source", "Unknown"),
        "teleportCityScore": teleport_city_score,
        "scores": formatted_scores
    }


@api_bp.get("/cities", strict_slashes=False)
def get_cities():
    """Get /api/cities - Returns a cleaned list of all curated cities"""

    cities = (
        City.query
        .order_by(City.name)
        .options(selectinload(City.scores))
        .all()
    )

    return jsonify({
        "cities": [format_city_response(city) for city in cities]
    }), 200


@api_bp.get("/cities/<city_id>")
def get_city(city_id):
    """Get /api/cities/<city_id> - Returns a specific city"""
    
    city = db.session.get(City, str(city_id))
    if city is None:
        return error_response(404, "city_not_found", f"{city_id} does not match any city")

    return jsonify(format_city_response(city)), 200