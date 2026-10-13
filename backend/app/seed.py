from app import create_app
from .extensions import db
# import models

def seed_cities():
    app = create_app()
    with app.app_context():
        pass