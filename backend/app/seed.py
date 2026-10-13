import json
import re
from pathlib import Path
from flask import Flask

from app import create_app
from .extensions import db
from .models import City, CityScore, METRICS


BASE_DIR = Path(__file__).resolve().parent.parent
DATA_FILE = BASE_DIR / "data" / "cities.json"

# create a metric dict of label: metric_id
METRIC_LABEL_ID = { label: metric_id for metric_id, label in METRICS }


def load_curated_cities() -> list:
    """Read curated cities from cities.json into a list"""

    if not DATA_FILE.exists():
        raise FileNotFoundError(f"City data file not found: {DATA_FILE}")

    
    with open(DATA_FILE, "r", encoding="utf-8") as file:

        raw_data = file.read()

        raw_data = raw_data.replace("\u00a0", " ")
        raw_data = re.sub(r"\\+~", "~", raw_data)

        data = json.loads(raw_data)
        curated_cities = data.get("CURATED_CITIES", [])

        for city in curated_cities:
            city.pop("teleportCityScore", None)

        return curated_cities
    



def seed_cities(app: Flask):
    """Insert or update cities and their metric scores"""

    print("Seeding started\n...")

    # Load curated cities
    curated_cities = load_curated_cities()

    # Seed interface variables to track changes made to db
    cities_processed = 0
    scores_processed = 0
    cities_added = 0
    scores_added = 0

    try:
        for curated_city in curated_cities:

            city_id = curated_city["id"]

            # get city from db
            city = db.session.get(City, city_id)

            # if city doesn't exist add it
            if city is None:
                city = City(id=city_id)
                db.session.add(city)
                cities_added += 1

            # update city fields
            city.name = curated_city["name"]
            city.country = curated_city["country"]
            city.wiki_title = curated_city["wikiTitle"]
            city.latitude = curated_city.get("latitude")
            city.longitude = curated_city.get("longitude")
            city.is_sample_data = curated_city["isSampleData"]
            city.score_source = curated_city["scoreSource"]

            # Push session into memory to ensure no Foreign key errors from CityScore table
            db.session.flush()

            scores = curated_city["scores"]
            if not isinstance(scores, dict):
                raise ValueError(
                    f"Scores for {city_id} must be a JSON object"
                )

            # check for unknown metrics
            unknown_metrics = [ 
                label for label in scores
                if label not in METRIC_LABEL_ID
            ]

            if unknown_metrics:
                raise ValueError(
                    f"Unknown metrics for {city_id}: "
                    f"{unknown_metrics}: "
                )

            # Require all 17 scores
            if len(scores) != len(METRICS):
                raise ValueError(
                    f"City {city_id} has incomplete metric metrics profiles. "
                    f"Expected {len(METRICS)} scores, found {len(scores)}."
                )

            # Process scores
            for label, score_value in scores.items():
                # get metric_id
                metric_id = METRIC_LABEL_ID[label]

                # Query score using metric_id
                score = CityScore.query.filter_by(
                    city_id=city_id,
                    metric_id=metric_id,
                ).first()

                # If score doesn't exist add it else update it
                if score is None:
                    score = CityScore(
                        city_id = city_id,
                        metric_id = metric_id,
                        score = score_value,
                    )

                    db.session.add(score)
                    scores_added += 1
                else:
                    score.score = score_value

                scores_processed += 1
            cities_processed += 1
        db.session.commit()

        total_cities_in_db = City.query.count()

        print("Seeding completed")
        print(f"Cities added: {cities_added}")
        print(f"Metric scores added: {scores_added}")
        print(f"Cities processed: {cities_processed}")
        print(f"Metric scores processed: {scores_processed}")
        print(f"Total cities in database: {total_cities_in_db}")
        
        
            

    except Exception:
        db.session.rollback()
        raise


def main():
    app = create_app()
    with app.app_context():
        seed_cities(app)

if __name__ == "__main__":
    main()