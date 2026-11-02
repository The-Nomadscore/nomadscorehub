"""
NOTE: Command to run this file -->
    python -m app.make_admin someone@example.com
Promotes an existing user to admin. It never creates an account.
"""

import sys

from app import create_app
from .extensions import db
from .models import User


def make_admin(email):
    """Set is_admin on the user with this email. Returns the user, or None."""
    user = User.query.filter_by(email=email.strip().lower()).first()
    if user is None:
        return None
    user.is_admin = True
    db.session.commit()
    return user


def main():
    if len(sys.argv) != 2:
        print("Usage: python -m app.make_admin <email>")
        return 1
    app = create_app()
    with app.app_context():
        print(f"Database: {db.engine.url.render_as_string(hide_password=True)}")
        user = make_admin(sys.argv[1])
        if user is None:
            print(f"No user with email {sys.argv[1]}. Ask them to register first.")
            return 1
        print(f"{user.email} is now an admin.")
    return 0


if __name__ == "__main__":
    sys.exit(main())