import firebase_admin
from firebase_admin import credentials, firestore_async
import os

if not firebase_admin._apps:
    cred_path = os.getenv("FIREBASE_KEY_PATH", "firebase_key.json")
    cred = credentials.Certificate(cred_path)
    firebase_admin.initialize_app(cred)


class FirebaseService:
    _db = firestore_async.client()
    _is_initialized: bool = False

    def __new__(cls, *args, **kwargs):
        if not hasattr(cls, 'instance'):
            cls.instance = super().__new__(cls)
        return cls.instance

    def __init__(self):
        if not self._is_initialized:
            self._initialize_firebase()
            FirebaseService._is_initialized = True

    def _initialize_firebase(self):
        if not firebase_admin._apps:
            key_path = os.getenv('FIREBASE_KEY_PATH')
            cred = credentials.Certificate(key_path)
            firebase_admin.initialize_app(cred)
        FirebaseService._db = firestore_async.client()

    @property
    def db(self):
        if self._db is None:
            raise RuntimeError(
                "FirebaseService is not properly initialized: 'db' is None.")
        return self._db
