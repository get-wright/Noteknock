import pytest
from fastapi import Depends, FastAPI
from fastapi.testclient import TestClient
from jose import JWTError

from app.core.security import create_token, decode_token, hash_password, verify_password


def test_hash_and_verify_password():
    h = hash_password("secret123")
    assert h != "secret123"
    assert verify_password("secret123", h) is True
    assert verify_password("wrong", h) is False


def test_create_and_decode_token():
    token = create_token(sub="user-uuid-here")
    payload = decode_token(token)
    assert payload["sub"] == "user-uuid-here"
    assert "exp" in payload


def test_decode_invalid_token_raises():
    with pytest.raises(JWTError):
        decode_token("not-a-jwt")


def test_get_current_user_no_token_401():
    from app.core.deps import get_current_user
    from app.db.session import get_db

    async def _fake_get_db():
        yield None

    app = FastAPI()

    @app.get("/me")
    async def me(user=Depends(get_current_user)):
        return {"id": str(user.id)}

    app.dependency_overrides[get_db] = _fake_get_db
    client = TestClient(app)
    assert client.get("/me").status_code == 401
