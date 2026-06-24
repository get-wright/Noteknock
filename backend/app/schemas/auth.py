import re
import uuid

from pydantic import BaseModel, ConfigDict, field_validator
from pydantic.alias_generators import to_camel


class CamelModel(BaseModel):
    model_config = ConfigDict(
        alias_generator=to_camel,
        populate_by_name=True,
        from_attributes=True,
    )


class UserCreate(CamelModel):
    name: str
    email: str
    password: str

    @field_validator("email")
    @classmethod
    def validate_email(cls, v: str) -> str:
        if not re.match(r"^[^@\s]+@[^@\s]+\.[^@\s]+$", v):
            raise ValueError("invalid email")
        return v.casefold()

    @field_validator("password")
    @classmethod
    def validate_password(cls, v: str) -> str:
        if len(v) < 8:
            raise ValueError("password must be at least 8 characters")
        return v


class UserOut(CamelModel):
    id: uuid.UUID
    name: str
    email: str


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class GoogleOAuthRequest(CamelModel):
    code: str


class AuthConfigOut(CamelModel):
    auth_type: str
    google_client_id: str | None = None
