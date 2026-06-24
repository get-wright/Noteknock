from dataclasses import dataclass
from typing import Any

import httpx
from jose import JWTError, jwk, jwt

GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth"
GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token"
GOOGLE_JWKS_URL = "https://www.googleapis.com/oauth2/v3/certs"
GOOGLE_ISSUERS = frozenset({"accounts.google.com", "https://accounts.google.com"})


class GoogleOAuthError(Exception):
    pass


@dataclass(frozen=True)
class GoogleProfile:
    sub: str
    email: str
    name: str
    email_verified: bool


def _pick_signing_key(jwks: dict[str, Any], kid: str | None) -> dict[str, Any]:
    keys = jwks.get("keys") or []
    if kid:
        for key in keys:
            if key.get("kid") == kid:
                return key
    if len(keys) == 1:
        return keys[0]
    raise GoogleOAuthError("Unable to resolve Google signing key.")


def verify_google_id_token(id_token: str, client_id: str, jwks: dict[str, Any]) -> GoogleProfile:
    try:
        header = jwt.get_unverified_header(id_token)
    except JWTError as exc:
        raise GoogleOAuthError("Invalid Google ID token.") from exc

    key_data = _pick_signing_key(jwks, header.get("kid"))
    try:
        public_key = jwk.construct(key_data)
        claims = jwt.decode(
            id_token,
            public_key,
            algorithms=[key_data.get("alg", "RS256")],
            audience=client_id,
            options={"verify_at_hash": False},
        )
    except JWTError as exc:
        raise GoogleOAuthError("Invalid Google ID token.") from exc

    issuer = claims.get("iss")
    if issuer not in GOOGLE_ISSUERS:
        raise GoogleOAuthError("Invalid Google token issuer.")

    email = claims.get("email")
    sub = claims.get("sub")
    if not sub or not email:
        raise GoogleOAuthError("Google account is missing required profile fields.")

    email_verified = claims.get("email_verified")
    if email_verified not in (True, "true"):
        raise GoogleOAuthError("Google account email is not verified.")

    name = claims.get("name") or email.split("@", 1)[0]
    return GoogleProfile(
        sub=str(sub),
        email=str(email).casefold(),
        name=str(name),
        email_verified=True,
    )


async def fetch_google_jwks() -> dict[str, Any]:
    async with httpx.AsyncClient(timeout=10.0) as client:
        resp = await client.get(GOOGLE_JWKS_URL)
    if resp.status_code != 200:
        raise GoogleOAuthError("Failed to fetch Google signing keys.")
    return resp.json()


async def exchange_code_for_tokens(
    *,
    code: str,
    client_id: str,
    client_secret: str,
    redirect_uri: str,
) -> dict[str, Any]:
    async with httpx.AsyncClient(timeout=10.0) as client:
        resp = await client.post(
            GOOGLE_TOKEN_URL,
            data={
                "code": code,
                "client_id": client_id,
                "client_secret": client_secret,
                "redirect_uri": redirect_uri,
                "grant_type": "authorization_code",
            },
            headers={"Content-Type": "application/x-www-form-urlencoded"},
        )
    if resp.status_code != 200:
        raise GoogleOAuthError("Google sign-in could not be completed.")
    body = resp.json()
    id_token = body.get("id_token")
    if not id_token:
        raise GoogleOAuthError("Google did not return an ID token.")
    return body


async def profile_from_authorization_code(
    *,
    code: str,
    client_id: str,
    client_secret: str,
    redirect_uri: str,
) -> GoogleProfile:
    token_body = await exchange_code_for_tokens(
        code=code,
        client_id=client_id,
        client_secret=client_secret,
        redirect_uri=redirect_uri,
    )
    jwks = await fetch_google_jwks()
    return verify_google_id_token(token_body["id_token"], client_id, jwks)