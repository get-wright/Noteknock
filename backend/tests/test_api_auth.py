import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_health(client: AsyncClient):
    r = await client.get("/health")
    assert r.status_code == 200
    assert r.json() == "OK"


@pytest.mark.asyncio
async def test_register_then_token_then_authcheck_then_me(client: AsyncClient):
    reg = await client.post(
        "/api/register",
        json={"name": "Hà", "email": "ha@test.com", "password": "secret123"},
    )
    assert reg.status_code == 200
    token_body = reg.json()
    assert "access_token" in token_body
    assert token_body["token_type"] == "bearer"
    token = token_body["access_token"]

    tok = await client.post(
        "/api/token",
        data={"username": "ha@test.com", "password": "secret123"},
    )
    assert tok.status_code == 200
    assert "access_token" in tok.json()

    auth = await client.get(
        "/api/auth-check",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert auth.status_code == 200
    assert auth.json() == "OK"

    me = await client.get(
        "/api/me",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert me.status_code == 200
    body = me.json()
    assert body["name"] == "Hà"
    assert body["email"] == "ha@test.com"
    assert "id" in body


@pytest.mark.asyncio
async def test_register_duplicate_email_409(client: AsyncClient):
    payload = {"name": "A", "email": "dup@test.com", "password": "secret123"}
    r1 = await client.post("/api/register", json=payload)
    assert r1.status_code == 200
    r2 = await client.post("/api/register", json=payload)
    assert r2.status_code == 409
    assert r2.json()["detail"] == "An account with this email already exists."


@pytest.mark.asyncio
async def test_register_duplicate_email_case_insensitive_409(client: AsyncClient):
    r1 = await client.post(
        "/api/register",
        json={"name": "A", "email": "Dup@Test.com", "password": "secret123"},
    )
    assert r1.status_code == 200

    r2 = await client.post(
        "/api/register",
        json={"name": "B", "email": "dup@test.com", "password": "secret123"},
    )
    assert r2.status_code == 409
    assert r2.json()["detail"] == "An account with this email already exists."


@pytest.mark.asyncio
async def test_token_accepts_email_case_insensitive(client: AsyncClient):
    await client.post(
        "/api/register",
        json={"name": "Case", "email": "case@test.com", "password": "secret123"},
    )
    r = await client.post(
        "/api/token",
        data={"username": "CASE@Test.com", "password": "secret123"},
    )
    assert r.status_code == 200
    assert "access_token" in r.json()


@pytest.mark.asyncio
async def test_token_bad_creds_401(client: AsyncClient):
    await client.post(
        "/api/register",
        json={"name": "U", "email": "u@test.com", "password": "secret123"},
    )
    r = await client.post(
        "/api/token",
        data={"username": "u@test.com", "password": "wrongpassword"},
    )
    assert r.status_code == 401
    assert r.json()["detail"] == "Invalid login details."


@pytest.mark.asyncio
async def test_auth_check_no_token_401(client: AsyncClient):
    r = await client.get("/api/auth-check")
    assert r.status_code == 401


@pytest.mark.asyncio
async def test_me_no_token_401(client: AsyncClient):
    r = await client.get("/api/me")
    assert r.status_code == 401


@pytest.mark.asyncio
async def test_config_password_only_when_google_unconfigured(client: AsyncClient):
    r = await client.get("/api/config")
    assert r.status_code == 200
    body = r.json()
    assert body["authType"] == "password"
    assert body.get("googleClientId") in (None, "")


@pytest.mark.asyncio
async def test_google_oauth_not_configured_503(client: AsyncClient):
    r = await client.post("/api/oauth/google", json={"code": "dummy-code"})
    assert r.status_code == 503
