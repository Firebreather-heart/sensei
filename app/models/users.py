from pydantic import BaseModel, Field, EmailStr
from datetime import datetime
from enum import Enum


class UserRole(str, Enum):
    USER = 'user'
    ADMIN = 'admin'


class User(BaseModel):
    id: str = Field(..., description="Unique identifier for the user")
    username: str = Field(..., description="Username of the user")
    email: EmailStr = Field(..., description="Email address of the user")
    role: UserRole = Field(
        UserRole.USER, description="Role of the user in the system")
    password: str = Field(exclude=True)
    created_at: datetime = Field(
        default_factory=datetime.utcnow, description="Timestamp when the user was created")
    updated_at: datetime = Field(
        default_factory=datetime.utcnow, description="Timestamp when the user was last updated")

    class Config:
        from_attributes = True
        use_enum_values = True

class UserSecure(User):
    password: str = Field(exclude=True, description="Password of the user, excluded in responses")

class UserCreate(BaseModel):
    username: str = Field(..., min_length=3,  max_length=50)
    email: EmailStr
    password: str = Field(..., min_length=8)


class UserUpdate(BaseModel):
    username: str | None = Field(None, min_length=3, max_length=50)
    email: EmailStr | None = None
    role: UserRole | None = None


class UserLogin(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=8)


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_in: int


class TokenData(BaseModel):
    username: str | None
    email: EmailStr | None