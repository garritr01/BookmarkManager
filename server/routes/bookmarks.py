from flask import Blueprint, jsonify, request
from server.firebase import db, bookmarksCo
from server.auth import handleFirebaseAuth
from server.logger import getLogger

logger = getLogger(__name__)

bookmarksBP = Blueprint("bookmarks", __name__, url_prefix="/bookmarks")

@bookmarksBP.route("", methods=["GET"])
@handleFirebaseAuth
def listBookmarks(uID):
	try:
		logger.debug("Listing bookmarks for user: %s", uID)
		docs = bookmarksCo.where("ownerID", "==", uID).stream()
		results = []
		for d in docs:
			data = d.to_dict()
			data['_id'] = d.id
			results.append(data)
		logger.debug("Found %d bookmarks for user %s", len(results), uID)
		return jsonify(results), 200
	except Exception as e:
		logger.exception("Unknown exception listing bookmarks for user %s: %s", uID, e)
		return jsonify({"error": "Unknown exception listing bookmarks"}), 500

@bookmarksBP.route("", methods=["POST", "PUT"])
@handleFirebaseAuth
def saveBookmark(uID):
	try:
		data = request.get_json()
		logger.debug("Save request payload: %s", data)

		if 'ownerID' not in data:
			data["ownerID"] = uID
		elif data["ownerID"] != uID:
			logger.warning("User %s attempted to modify bookmark owned by %s", uID, data.get("ownerID"))
			return jsonify({"error": "User not permitted to edit this bookmark"}), 403

		docID = data.get("_id")
		if docID:
			logger.info("Updating bookmark %s for user %s", docID, uID)
			ref = bookmarksCo.document(docID)
		else:
			logger.info("Creating bookmark for user %s", uID)
			ref = bookmarksCo.document()

		ref.set(data)
		response = {**data, "_id": ref.id}
		return jsonify(response), 200 if docID else 201
	except Exception as e:
		logger.exception("Unknown exception saving bookmark for user %s: %s", uID, e)
		return jsonify({"error": "Unknown exception saving bookmark"}), 500

@bookmarksBP.route("", methods=["DELETE"])
@handleFirebaseAuth
def deleteBookmark(uID):
	try:
		payload = request.get_json()
		docID = payload.get("_id")
		if not docID:
			logger.warning("Delete called without _id by user %s", uID)
			return jsonify({"error": "No _id provided to delete bookmark"}), 400

		ref = bookmarksCo.document(docID)
		doc = ref.get()
		if not doc.exists or doc.to_dict().get("ownerID") != uID:
			logger.warning("Permission denied for deleting doc %s by user %s", docID, uID)
			return jsonify({"error": "Permission denied"}), 403

		ref.delete()
		logger.info("Deleted bookmark %s for user %s", docID, uID)
		return jsonify({"deleted": [docID]}), 200
	except Exception as e:
		logger.exception("Error deleting bookmark %s for user %s: %s", docID, uID, e)
		return jsonify({"error": f"Uknown exception deleting bookmark"}), 500

@bookmarksBP.route("/dir", methods=["DELETE"])
@handleFirebaseAuth
def deleteDirectory(uID):
	try:
		payload = request.get_json(force=True)
		logger.debug("Delete directory payload: %s", payload)
		path = payload.get("path")

		if not path:
			logger.warning("Delete directory called without path by user %s", uID)
			return jsonify({"error": "No path provided to delete directory"}), 400

		query = (
			bookmarksCo
				.where("ownerID", "==", uID)
				.where("path", ">=", path + "/")
				.where("path", "<",  path + "/" + "\uf8ff")
		)

		batch = db.batch()
		deleted = []
		for doc in query.stream():
			batch.delete(doc.reference)
			deleted.append(doc.id)
		batch.commit()

		logger.info("Deleted %d documents under directory %s for user %s", len(deleted), path, uID)
		return jsonify({"deleted": deleted}), 200
	except Exception as e:
		logger.exception("Error deleting directory %s for user %s: %s", path, uID, e)
		return jsonify({"error": "deleteDirectory unknown exception"}), 500
