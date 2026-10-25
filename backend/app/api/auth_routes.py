"""Auth endpoints (docs/api-contract.md): register, login, me."""

import re

from flask import current_app, jsonify, request
from flask_jwt_extended import create_access_token, current_user, jwt_required
from sqlalchemy.exc import IntegrityError

from ..api_utils import error_response, validation_error
from ..auth import check_password, hash_password
from ..extensions import db
from ..models import User
from . import api_bp

EMAIL_MAX = 254
PASSWORD_MIN = 8
PASSWORD_MAX = 128
# Deliberately simple: one @, no spaces, a dot in the domain. Real proof that
# an address works is an email, which is out of scope for Phase 3.
_EMAIL_RE = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")


def _serialize_user(user):
    return {"id": user.id, "email": user.email, "is_admin": user.is_admin}


def _auth_response(user, status):
    expires = current_app.config["JWT_ACCESS_TOKEN_EXPIRES"]
    token = create_access_token(identity=user.id)  # identity must be a string
    return (
        jsonify(
            {
                "token": token,
                "expires_in": int(expires.total_seconds()),
                "user": _serialize_user(user),
            }
        ),
        status,
    )


@api_bp.post("/auth/register")
def register():
    body = request.get_json(silent=True)
    if not isinstance(body, dict):
        body = {}
    email = body.get("email")
    password = body.get("password")

    fields = {}
    if not isinstance(email, str):
        fields["email"] = "must be a string"
    else:
        email = email.strip().lower()
        if len(email) > EMAIL_MAX or not _EMAIL_RE.match(email):
            fields["email"] = f"must be a valid email address (max {EMAIL_MAX} characters)"
    if not isinstance(password, str):
        fields["password"] = "must be a string"
    elif not PASSWORD_MIN <= len(password) <= PASSWORD_MAX:
        fields["password"] = f"must be {PASSWORD_MIN} to {PASSWORD_MAX} characters"
    if fields:
        return validation_error(fields)

    if User.query.filter_by(email=email).first() is not None:
        return error_response(409, "email_taken", "An account with that email already exists.")

    user = User(email=email, password_hash=hash_password(password))
    db.session.add(user)
    try:
        db.session.commit()
    except IntegrityError:
        # Two requests registered the same email at the same moment: the
        # unique constraint is the real guard, the check above is a courtesy.
        db.session.rollback()
        return error_response(409, "email_taken", "An account with that email already exists.")
    return _auth_response(user, 201)


@api_bp.post("/auth/login")
def login():
    body = request.get_json(silent=True)
    if not isinstance(body, dict):
        body = {}
    email = body.get("email")
    password = body.get("password")

    fields = {}
    if not isinstance(email, str) or not email.strip():
        fields["email"] = "must be a non-empty string"
    if not isinstance(password, str) or not password:
        fields["password"] = "must be a non-empty string"
    if fields:
        return validation_error(fields)

    user = User.query.filter_by(email=email.strip().lower()).first()
    # check_password also runs a hash when the user is None, so an unknown
    # email and a wrong password take about the same time.
    if not check_password(user, password):
        return error_response(401, "invalid_credentials", "Email or password is incorrect.")
    return _auth_response(user, 200)


@api_bp.get("/auth/me")
@jwt_required()
def me():
    return jsonify({"user": _serialize_user(current_user)}), 200