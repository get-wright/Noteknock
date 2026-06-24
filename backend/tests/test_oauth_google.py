import time

import pytest
from jose import jwt

from app.services.oauth_google import GoogleOAuthError, verify_google_id_token


def _rsa_jwk_for_tests() -> tuple[dict, bytes, dict]:
    from cryptography.hazmat.primitives import serialization
    from cryptography.hazmat.primitives.asymmetric import rsa
    from jose.utils import base64url_encode

    private_key = rsa.generate_private_key(public_exponent=65537, key_size=2048)
    public_numbers = private_key.public_key().public_numbers()

    def _enc_int(value: int) -> str:
        length = (value.bit_length() + 7) // 8
        return base64url_encode(value.to_bytes(length, "big")).decode("ascii")

    jwk = {
        "kty": "RSA",
        "kid": "test-key",
        "use": "sig",
        "alg": "RS256",
        "n": _enc_int(public_numbers.n),
        "e": _enc_int(public_numbers.e),
    }
    private_pem = private_key.private_bytes(
        encoding=serialization.Encoding.PEM,
        format=serialization.PrivateFormat.PKCS8,
        encryption_algorithm=serialization.NoEncryption(),
    )
    return jwk, private_pem, {"keys": [jwk]}


def test_verify_google_id_token_accepts_valid_claims():
    key, private_pem, jwks = _rsa_jwk_for_tests()
    now = int(time.time())
    token = jwt.encode(
        {
            "iss": "https://accounts.google.com",
            "aud": "client-id.apps.googleusercontent.com",
            "sub": "google-sub-1",
            "email": "user@example.com",
            "email_verified": True,
            "name": "Test User",
            "exp": now + 3600,
            "iat": now,
        },
        private_pem,
        algorithm="RS256",
        headers={"kid": key["kid"]},
    )
    profile = verify_google_id_token(token, "client-id.apps.googleusercontent.com", jwks)
    assert profile.sub == "google-sub-1"
    assert profile.email == "user@example.com"
    assert profile.name == "Test User"


def test_verify_google_id_token_rejects_unverified_email():
    key, private_pem, jwks = _rsa_jwk_for_tests()
    now = int(time.time())
    token = jwt.encode(
        {
            "iss": "accounts.google.com",
            "aud": "client-id.apps.googleusercontent.com",
            "sub": "google-sub-2",
            "email": "user@example.com",
            "email_verified": False,
            "exp": now + 3600,
        },
        private_pem,
        algorithm="RS256",
        headers={"kid": key["kid"]},
    )
    with pytest.raises(GoogleOAuthError):
        verify_google_id_token(token, "client-id.apps.googleusercontent.com", jwks)