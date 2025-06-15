import json
from flask import Blueprint, jsonify, request
from google import genai
from server.firebase import db, bookmarksCo, tempBookmarksCo
from server.auth import handleFirebaseAuth
from server.logger import getLogger

# configure Gemini, logger, and blueprint
genai_client = genai.Client()
logger = getLogger(__name__)
tempBookmarksBP = Blueprint("tempBookmarks", __name__, url_prefix="/tempBookmarks")

@tempBookmarksBP.route("", methods=["GET"])
@handleFirebaseAuth
def listTempBookmarks(uID):
	try:
		logger.debug("Listing temp bookmarks for user %s", uID)
		docs = tempBookmarksCo.where("ownerID", "==", uID).stream()
		bookmarks = []
		for d in docs:
			data = d.to_dict()
			data['_id'] = d.id
			bookmarks.append(data)
		logger.info("Found %d temporary bookmarks for user %s", len(bookmarks), uID)
		return jsonify(bookmarks), 200
	except Exception as e:
		logger.exception("Unknown exception listing temp bookmarks for user %s: %s", uID, e)
		return jsonify({"error": "Unknown exception listing temp bookmarks"}), 500

@tempBookmarksBP.route("", methods=["POST", "PUT"])
@handleFirebaseAuth
def saveTempBookmark(uID):
	try:
		data = request.get_json()
		logger.debug("Saving temp bookmark for user %s", uID)

		if 'ownerID' not in data:
			data['ownerID'] = uID
		elif data['ownerID'] != uID:
			logger.warning("User %s attempted to modify bookmark owned by %s", uID, data['ownerID'])
			return jsonify({"error": "User not permitted to edit this bookmark"}), 403

		# build directory tree
		logger.debug("Building directory tree for user: %s", uID)
		dirTree = makeDirTree(uID)
		logger.debug("Directory tree: %s", json.dumps(dirTree))

		# define info for Gemini to autofill
		initial = {
			"url": data.get("url"),
			"path": data.get("path"),
			"tags": data.get("tags"),
			"notes": data.get("notes")
		}
		autoData = autofillBookmark(dirTree, initial)

		# add user info back to 
		for key, val in data.items():
			if key not in autoData or not autoData.get(key):
				autoData[key] = val
		logger.debug("Final data to save: %s", autoData)

		# persist and respond
		ref = tempBookmarksCo.document()
		ref.set(autoData)
		logger.info("Saved temp bookmark %s for user %s", ref.id, uID)
		return jsonify({**autoData, "_id": ref.id}), 201

	except Exception:
		logger.exception("Error svaing temp bookmark for user %s", uID)
		return jsonify({"error": "Failed to save temp bookmark"}), 500

@tempBookmarksBP.route("", methods=["DELETE"])
@handleFirebaseAuth
def deleteTempBookmark(uID):
	try:
		payload = request.get_json()
		docID = payload.get("_id")
		if not docID:
			logger.warning("Missing _id in temp delete requested by user %s", uID)
			return jsonify({"error": "Missing _id"}), 400

		ref = tempBookmarksCo.document(docID)
		doc = ref.get()
		if not doc.exists or doc.to_dict().get("ownerID") != uID:
			logger.warning("Permission denied delete attempt: user %s on doc %s", uID, docID)
			return jsonify({"error": "Permission denied"}), 403

		ref.delete()
		logger.info("Deleted temp bookmark %s for user %s", docID, uID)
		return jsonify({"deleted": [docID]}), 200
	except Exception as e:
		logger.exception("Error deleting temp bookmark %s for user %s: %s", docID, uID, e)
		return jsonify({"error": f"Uknown exception deleting temp bookmark"}), 500

def makeDirTree(uID):
	try:
		logger.debug("Making directory tree for user: %s", uID)
		tree = {}
		docs = bookmarksCo.where("ownerID", "==", uID).select(["path"]).stream()
		for doc in docs:
			snapshot = doc.to_dict()
			path = snapshot.get("path")
			if not path:
				continue

			parts = path.split("/")
			node = tree
			for part in parts:
				node = node.setdefault(part, {})
			logger.debug("Inserted path into tree: %s", parts)

		logger.info("Completed directory tree for user %s", uID)
		return tree
	except Exception as e:
		logger.warning("Failed to make directory tree for user %s: %s", uID, e)
		return {}

def autofillBookmark(dirTree, bookmark):
	try:
		prompt = (
			"Return only a json object with structure: { 'path': str, 'tags': list, 'notes': str }. "
			+ "This user has bookmarks stored in the following path structures:\n"
			+ json.dumps(dirTree)
			+ " Note that an empty dict value indicates the key was the end of the path and nothing should be nested within. "
			+ "If the user has very few 'directories' to infer their preferred structure, prefer to define the path under a very general directory, followed by a more specific subdirectory and a specific name. This looks like 'a/b/c' and should categorize the bookmark intuitively. "
			+ f"\nGather some information about this url: '{bookmark.get('url', 'emptyURL')}' to infer what the user is using this site for and autofill the 'path' field with the most logical path as a string. "
			+ "Autofill the 'tags' field with about five keywords that relate to the site's purpose. "
			+ "Autofill the 'notes' field with your best guess about the user's purpose for using the site. "
			+ "'notes' should be written from the user's perspective. "
			+ "If there is already a path present, do not change it. "
			+ "If there are already tags present, do not remove them, but add more if necessary. "
			+ "The current state of this object follows: "
			+ json.dumps(bookmark)
		)

		resp = genai_client.models.generate_content(
			model="gemini-2.0-flash",
			contents=prompt
		)
		obj_str = resp.text.strip()
		logger.debug("Raw response text: %s", obj_str)

		# strip markdown fences
		if obj_str.startswith("```json") and obj_str.endswith("```"):
			obj_str = obj_str[7:-3].strip()
		info = json.loads(obj_str)
		logger.info("Autofill parsed info: %s", info)
		return info

	except Exception as e:
		logger.warning("Failed to autofill bookmark: %s", e)
		return bookmark
