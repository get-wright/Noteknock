import pytest
from pydantic import ValidationError

from app.schemas.auth import CamelModel, Token, UserCreate


def test_user_create_accepts_camel_case():
    u = UserCreate.model_validate({"name": "Hà", "email": "ha@test.com", "password": "secret123"})
    assert u.name == "Hà"
    assert u.email == "ha@test.com"
    assert u.password == "secret123"


def test_user_create_accepts_snake_case_via_populate_by_name():
    u = UserCreate.model_validate({"name": "Hà", "email": "ha@test.com", "password": "secret123"})
    u2 = UserCreate(name="Hà", email="ha@test.com", password="secret123")
    assert u.email == "ha@test.com"
    assert u2.email == "ha@test.com"


def test_user_create_rejects_bad_email():
    with pytest.raises(ValidationError):
        UserCreate.model_validate({"name": "Hà", "email": "not-an-email", "password": "secret123"})


def test_user_create_rejects_short_password():
    with pytest.raises(ValidationError):
        UserCreate.model_validate({"name": "Hà", "email": "ha@test.com", "password": "short"})


def test_token_is_snake_case():
    t = Token(access_token="abc", token_type="bearer")
    dumped = t.model_dump()
    assert dumped == {"access_token": "abc", "token_type": "bearer"}
    assert "accessToken" not in dumped


def test_camel_model_alias_generator():
    class Sub(CamelModel):
        last_modified: float

    s = Sub.model_validate({"lastModified": 1.5})
    assert s.last_modified == 1.5
    assert s.model_dump(by_alias=True) == {"lastModified": 1.5}
