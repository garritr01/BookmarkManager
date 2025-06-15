import firebase_admin
from firebase_admin import credentials, firestore
from server.config import FIREBASE_CREDS

# Init Firebase SDK
if not firebase_admin._apps:
	cred = credentials.Certificate(FIREBASE_CREDS)
	firebase_admin.initialize_app(cred)

# Init db and get collections for distributing to routes
db = firestore.client()
bookmarksCo = db.collection("bookmarks")
tempBookmarksCo = db.collection("tempBookmarks")