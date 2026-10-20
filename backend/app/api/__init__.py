import importlib
import pkgutil

from flask import Blueprint

api_bp = Blueprint("api", __name__, url_prefix="/api")

# Auto-import every module in this package, so each endpoint file registers
# its routes on api_bp without anyone editing a shared file. To add endpoints,
# just drop a new file in this folder (see health.py pattern in the README).
for _, _name, _ in pkgutil.iter_modules(__path__):
    importlib.import_module(f"{__name__}.{_name}")