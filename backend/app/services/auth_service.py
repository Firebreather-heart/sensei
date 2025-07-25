from datetime import datetime, timedelta
import jwt
import bcrypt
import os
import uuid

from firebase_admin.firestore import SERVER_TIMESTAMP  # type:ignore

from .firebase_service import FirebaseService
from ..models.users import User, UserCreate, UserUpdate, UserLogin, Token, TokenData, UserSecure


class AuthService:
    def __init__(self):
        self.db = FirebaseService().db
        self.secret_key = os.getenv(
            'JWT_SECRET_KEY', 'a-wild-key-like-Azula-or-keyla-bee')
        self.algorithm = "HS256"
        self.access_token_expire_minutes = 60 * 24 * 7

    def _hash_password(self, password: str) -> str:
        salt = bcrypt.gensalt()
        return bcrypt.hashpw(password.encode('utf-8'), salt).decode('utf-8')

    def _verify_password(self, plain_password: str, hashed_password: str) -> bool:
        return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))

    def _create_access_token(self, data: dict, expires_delta: timedelta | None = None) -> str:
        to_encode = data.copy()

        if expires_delta:
            expire = datetime.utcnow() + expires_delta
        else:
            expire = datetime.utcnow() + timedelta(self.access_token_expire_minutes)

        to_encode.update({"exp": expire})
        encoded_jwt = jwt.encode(
            to_encode, self.secret_key, algorithm=self.algorithm)
        return encoded_jwt

    async def create_user(self, user_data: UserCreate) -> User:
        issue_dict = dict()
        existing_user = await self.get_user_by_username(user_data.username)
        if existing_user:
            issue_dict['username'] = 'Username already exists'

        existing_email = await self.get_user_by_email(user_data.email)
        if existing_email:
            issue_dict['email'] = 'Email already exists'

        if issue_dict:
            raise ValueError(issue_dict)

        user_id = str(uuid.uuid5(uuid.NAMESPACE_DNS, user_data.username))
        hashed_password = self._hash_password(user_data.password)

        user_doc = {
            "id": user_id,
            "username": user_data.username,
            "email": user_data.email,
            "password": hashed_password,
            "role": "user",
            "created_at": SERVER_TIMESTAMP,
            "updated_at": SERVER_TIMESTAMP
        }

        doc_ref = self.db.collection('users').document(user_id)
        await doc_ref.set(user_doc)

        created_doc = await doc_ref.get()
        if not created_doc.exists:
            raise Exception("User creation failed")

        user_data_dict = created_doc.to_dict()
        if user_data_dict:
            # user_data_dict.pop("password", None)
            return User.model_validate(user_data_dict)
        raise Exception("User creation failed, no data returned")

    async def authenticate_user(self, user_login: UserLogin) -> Token:
        user = await self.get_user_by_email(user_login.email)
        if not user or not self._verify_password(user_login.password, user.password):
            raise ValueError("Invalid email or password")

        access_token_expires = timedelta(
            minutes=self.access_token_expire_minutes)
        access_token = self._create_access_token(
            data={"sub": user.username, "email": user.email},
            expires_delta=access_token_expires
        )

        return Token(access_token=access_token, expires_in=self.access_token_expire_minutes)

    async def get_current_user(self, token: str) -> User | None:
        try:
            payload = jwt.decode(token, self.secret_key,
                                 algorithms=[self.algorithm])
            username: str = payload.get("sub")
            email: str = payload.get("email")
            if username is None or email is None:
                return None
            return await self.get_user_by_username(username)
        except jwt.PyJWTError:
            return None

    async def get_user_by_username(self, username: str) -> UserSecure | None:
        query = self.db.collection('users').where('username', '==', username)
        docs = await query.get()
        if docs:
            user_data = docs[0].to_dict()
            return UserSecure.model_validate(user_data)

        return None

    async def get_user_by_email(self, email: str) -> User | None:
        query = self.db.collection('users').where('email', '==', email)
        docs = await query.get()
        if docs:
            user_data = docs[0].to_dict()
            if user_data:
                # user_data.pop("password", None)
                return User.model_validate(user_data)

        return None

    async def update_user(self, user_id: str, user_update: UserUpdate) -> User:
        user_doc_ref = self.db.collection('users').document(user_id)
        user_doc = await user_doc_ref.get()

        if not user_doc.exists:
            raise ValueError("User not found")

        user_data = user_doc.to_dict()
        if not user_data:
            raise ValueError("User data is empty")

        if user_update.username is not None:
            existing_user = await self.get_user_by_username(user_update.username)
            if existing_user and existing_user.id != user_id:
                raise ValueError("Username already exists")
            user_data['username'] = user_update.username

        if user_update.email is not None:
            existing_email = await self.get_user_by_email(user_update.email)
            if existing_email and existing_email.id != user_id:
                raise ValueError("Email already exists")
            user_data['email'] = user_update.email

        if user_update.role is not None:
            user_data['role'] = user_update.role.value

        user_data['updated_at'] = SERVER_TIMESTAMP
        await user_doc_ref.set(user_data)

        updated_doc = await user_doc_ref.get()
        updated_data = updated_doc.to_dict()
        if updated_data:
            # updated_data.pop("password", None)
            return User.model_validate(updated_data)

        raise Exception("User update failed, no data returned")

    async def get_all_users(self) -> list[User]:
        users = []
        query = self.db.collection('users')
        docs = await query.get()
        for doc in docs:
            user_data = doc.to_dict()
            if user_data:
                # user_data.pop("password", None)
                users.append(User.model_validate(user_data))
        return users
