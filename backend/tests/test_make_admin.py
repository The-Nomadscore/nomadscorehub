from app.extensions import db
from app.make_admin import make_admin
from app.models import User

from tests.conftest import app


def add_user(email):
    db.session.add(User(email=email, password_hash="not-a-real-hash"))
    db.session.commit()


def test_make_admin_promotes_an_existing_user(app):
    add_user("boss@example.com")
    assert make_admin("boss@example.com").is_admin is True
    assert User.query.filter_by(email="boss@example.com").one().is_admin is True


def test_make_admin_ignores_case_and_spaces(app):
    add_user("boss@example.com")
    assert make_admin("  Boss@Example.COM ") is not None
    assert User.query.one().is_admin is True


def test_make_admin_unknown_email_changes_nothing(app):
    add_user("someone@example.com")
    assert make_admin("nobody@example.com") is None
    assert User.query.count() == 1
    assert User.query.one().is_admin is False


def test_make_admin_only_promotes_the_named_user(app):
    add_user("boss@example.com")
    add_user("other@example.com")
    make_admin("boss@example.com")
    assert User.query.filter_by(email="other@example.com").one().is_admin is False