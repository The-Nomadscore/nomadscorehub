from sqlalchemy import func

from flask import jsonify
from . import api_bp
from ..auth import admin_required
from ..extensions import db
from ..models import User, City, ShortlistItem, Itinerary


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