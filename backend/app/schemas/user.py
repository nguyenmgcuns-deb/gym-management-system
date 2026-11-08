from datetime import datetime

from pydantic import BaseModel, ConfigDict, EmailStr, Field


# Schema for incoming registration requests
class UserCreate(BaseModel):
    email: EmailStr
    password: str
    first_name: str
    last_name: str


# Schema for outgoing responses (no password included!)
class UserResponse(BaseModel):
    id: int
    email: EmailStr
    first_name: str
    last_name: str
    created_at: datetime

    # Lets Pydantic read data from a SQLAlchemy User object
    model_config = ConfigDict(from_attributes=True)


# Schema for incoming login requests
class LoginRequest(BaseModel):
    email: EmailStr
    password: str


# Schema for the token we send back after login
class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


# Schema for profile updates: every field is optional
class UserUpdate(BaseModel):
    first_name: str | None = Field(default=None, min_length=1, max_length=100)
    last_name: str | None = Field(default=None, min_length=1, max_length=100)