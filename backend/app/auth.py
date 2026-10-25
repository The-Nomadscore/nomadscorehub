"""Building blocks for sign-in (docs/api-contract.md, sections 1.1 and 3.5).

- Password hashing: passwords are only ever stored as hashes.
- JWT error handlers: every token problem is answered with the contract's
  shared error shape and a 401, instead of the library's own wording.
"""

from werkzeug.security import check_password_hash, generate_password_hash

from .api_utils import error_response
from .extensions import db, jwt
from .models import User


def hash_password(password):
    return generate_password_hash(password)


# Compared against when the email has no account, so an unknown email takes about
# as long to reject as a wrong password (nobody can tell them apart by timing).
_DUMMY_HASH = generate_password_hash("not-a-real-password")


def check_password(user, password):
    """True only if user exists and password matches. user may be None."""
    stored = user.password_hash if user is not None else _DUMMY_HASH
    matches = check_password_hash(stored, password)
    return user is not None and matches


@jwt.unauthorized_loader
def _missing_token(reason):
    return error_response(
        401, "missing_token", "The Authorization header is required for this endpoint."
    )


@jwt.invalid_token_loader
def _invalid_token(reason):
    return error_response(401, "invalid_token", "The token is not valid.")


@jwt.expired_token_loader
def _expired_token(jwt_header, jwt_payload):
    return error_response(
        401, "token_expired", "The token has expired. Please sign in again."
    )


@jwt.user_lookup_loader
def _load_user(jwt_header, jwt_payload):
    # The token holds only the user's id; the account is read on every request, so a
    # deleted account stops working at once.
    return db.session.get(User, jwt_payload["sub"])


@jwt.user_lookup_error_loader
def _user_gone(jwt_header, jwt_payload):
    return error_response(401, "invalid_token", "The token is not valid.")