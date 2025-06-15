import os
import json
import logging

def load_env_json(name, fallback_json):
	raw = os.getenv(name)
	if raw is None or raw == "":
		raw = fallback_json
	if os.path.isfile(raw):
		with open(raw, 'r') as f:
			return json.load(f)
	try:
		return json.loads(raw)
	except json.JSONDecodeError:
		return json.loads(fallback_json)

FLASK_ENV   = os.getenv("FLASK_ENV", "production")
DEBUG       = FLASK_ENV == "development"
PORT        = int(os.getenv("PORT", "5000"))
SECRET_KEY  = os.getenv("SECRET_KEY")
CORS_ORIGINS   = load_env_json("CORS_ORIGINS", "[]")
FIREBASE_CREDS = load_env_json("FIREBASE_ADMIN_JSON", "{}")
LOGGER_CREDS   = load_env_json("LOGGER_ADMIN_JSON", "{}")
_log_level_str = os.getenv("LOG_LEVEL", "INFO").upper()
LOG_LEVEL      = getattr(logging, _log_level_str, logging.INFO)