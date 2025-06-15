import sys
import time
from flask import Flask, request, jsonify
from flask_cors import CORS
from werkzeug.exceptions import HTTPException
from server.config import (
	FLASK_ENV,
	SECRET_KEY,
	PORT,
	CORS_ORIGINS,
	FIREBASE_CREDS,
	LOGGER_CREDS,
	LOG_LEVEL,
)

def createApp():

	# early exit if secrets not defined
	required = {
		"FLASK_ENV": FLASK_ENV,
		"SECRET_KEY": SECRET_KEY,
		"PORT": PORT,
		"CORS_ORIGINS": CORS_ORIGINS,
		"FIREBASE_CREDS": FIREBASE_CREDS,
		"LOGGER_CREDS": LOGGER_CREDS,
		"LOG_LEVEL": LOG_LEVEL,
	}
	missing = [k for k, v in required.items() if not v]
	if missing:
		print(f"Cancelled run due to missing secrets: {', '.join(missing)}")
		sys.exit(1)

	app = Flask(__name__)
	app.config["DEBUG"] = (FLASK_ENV == "development")
	app.config["SECRET_KEY"] = SECRET_KEY
	app.config["PORT"] = PORT

	CORS(
		app,
		origins=CORS_ORIGINS,
		supports_credentials=True,
		intercept_exceptions=True,
		allow_headers=["Content-Type", "Authorization"],
		methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
	)

	@app.route("/hello", methods=["GET"])
	def healthCheck():
		return jsonify({"msg": "hello"}), 200

	from server.routes.bookmarks import bookmarksBP
	app.register_blueprint(bookmarksBP)
	
	from server.routes.tempBookmarks import tempBookmarksBP
	app.register_blueprint(tempBookmarksBP)

	return app
