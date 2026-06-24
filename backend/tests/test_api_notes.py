import pytest
from sqlalchemy import text

BLOCKS_WITH_TAG = [
    {
        "type": "paragraph",
        "content": [
            {"type": "text", "text": "Tích phân #toán từng phần", "styles": {}}
        ],
    },
]
BLOCKS_NO_TAG = [
    {
        "type": "paragraph",
        "content": [{"type": "text", "text": "Just some text", "styles": {}}],
    },
]


@pytest.mark.asyncio
async def test_create_note(client, auth_token):
    resp = await client.post(
        "/api/notes",
        json={
            "title": "Tích phân",
            "content": BLOCKS_WITH_TAG,
            "subject": "toan",
            "difficulty": "de",
        },
        headers={"Authorization": f"Bearer {auth_token}"},
    )
    assert resp.status_code == 200
    note = resp.json()
    assert note["title"] == "Tích phân"
    assert note["content"] == BLOCKS_WITH_TAG
    assert note["subject"] == "toan"
    assert note["difficulty"] == "de"
    assert note["tags"] == ["toán"]
    assert isinstance(note["lastModified"], float)


@pytest.mark.asyncio
async def test_create_note_duplicate_409(client, auth_token):
    await client.post(
        "/api/notes",
        json={"title": "Dup"},
        headers={"Authorization": f"Bearer {auth_token}"},
    )
    resp = await client.post(
        "/api/notes",
        json={"title": "Dup"},
        headers={"Authorization": f"Bearer {auth_token}"},
    )
    assert resp.status_code == 409
    assert (
        resp.json()["detail"]
        == "Cannot create note. A note with the same title already exists."
    )


@pytest.mark.asyncio
async def test_create_note_invalid_title_400(client, auth_token):
    resp = await client.post(
        "/api/notes",
        json={"title": "a/b"},
        headers={"Authorization": f"Bearer {auth_token}"},
    )
    assert resp.status_code == 400
    assert (
        resp.json()["detail"]
        == "The specified note title contains invalid characters."
    )


@pytest.mark.asyncio
async def test_get_note(client, auth_token):
    await client.post(
        "/api/notes",
        json={"title": "GetMe", "content": BLOCKS_WITH_TAG},
        headers={"Authorization": f"Bearer {auth_token}"},
    )
    resp = await client.get(
        "/api/notes/GetMe", headers={"Authorization": f"Bearer {auth_token}"}
    )
    assert resp.status_code == 200
    assert resp.json()["title"] == "GetMe"
    assert resp.json()["tags"] == ["toán"]


@pytest.mark.asyncio
async def test_get_note_missing_404(client, auth_token):
    resp = await client.get(
        "/api/notes/Nope", headers={"Authorization": f"Bearer {auth_token}"}
    )
    assert resp.status_code == 404
    assert resp.json()["detail"] == "The specified note cannot be found."


@pytest.mark.asyncio
async def test_patch_note(client, auth_token):
    await client.post(
        "/api/notes",
        json={"title": "Patch"},
        headers={"Authorization": f"Bearer {auth_token}"},
    )
    resp = await client.patch(
        "/api/notes/Patch",
        json={
            "newTitle": "Patched",
            "newContent": BLOCKS_WITH_TAG,
            "subject": "ly",
            "difficulty": "kho",
        },
        headers={"Authorization": f"Bearer {auth_token}"},
    )
    assert resp.status_code == 200
    note = resp.json()
    assert note["title"] == "Patched"
    assert note["content"] == BLOCKS_WITH_TAG
    assert note["subject"] == "ly"
    assert note["difficulty"] == "kho"
    assert note["tags"] == ["toán"]


@pytest.mark.asyncio
async def test_patch_note_missing_404(client, auth_token):
    resp = await client.patch(
        "/api/notes/Nope",
        json={"subject": "x"},
        headers={"Authorization": f"Bearer {auth_token}"},
    )
    assert resp.status_code == 404


@pytest.mark.asyncio
async def test_patch_note_collision_409(client, auth_token):
    await client.post(
        "/api/notes",
        json={"title": "A"},
        headers={"Authorization": f"Bearer {auth_token}"},
    )
    await client.post(
        "/api/notes",
        json={"title": "B"},
        headers={"Authorization": f"Bearer {auth_token}"},
    )
    resp = await client.patch(
        "/api/notes/A",
        json={"newTitle": "B"},
        headers={"Authorization": f"Bearer {auth_token}"},
    )
    assert resp.status_code == 409


@pytest.mark.asyncio
async def test_delete_note(client, auth_token):
    await client.post(
        "/api/notes",
        json={"title": "Delete"},
        headers={"Authorization": f"Bearer {auth_token}"},
    )
    resp = await client.delete(
        "/api/notes/Delete", headers={"Authorization": f"Bearer {auth_token}"}
    )
    assert resp.status_code == 200
    assert resp.json() is None
    resp2 = await client.get(
        "/api/notes/Delete", headers={"Authorization": f"Bearer {auth_token}"}
    )
    assert resp2.status_code == 404


@pytest.mark.asyncio
async def test_delete_note_missing_404(client, auth_token):
    resp = await client.delete(
        "/api/notes/Nope", headers={"Authorization": f"Bearer {auth_token}"}
    )
    assert resp.status_code == 404


@pytest.mark.asyncio
async def test_get_tags(client, auth_token):
    await client.post(
        "/api/notes",
        json={"title": "N1", "content": BLOCKS_WITH_TAG},
        headers={"Authorization": f"Bearer {auth_token}"},
    )
    await client.post(
        "/api/notes",
        json={
            "title": "N2",
            "content": [
                {
                    "type": "paragraph",
                    "content": [
                        {"type": "text", "text": "#lý bài", "styles": {}}
                    ],
                }
            ],
        },
        headers={"Authorization": f"Bearer {auth_token}"},
    )
    resp = await client.get(
        "/api/tags", headers={"Authorization": f"Bearer {auth_token}"}
    )
    assert resp.status_code == 200
    tags = resp.json()
    assert "toán" in tags
    assert "lý" in tags


@pytest.mark.asyncio
async def test_search_vec_populated(client, auth_token, db):
    await client.post(
        "/api/notes",
        json={"title": "FTSTest", "content": BLOCKS_WITH_TAG},
        headers={"Authorization": f"Bearer {auth_token}"},
    )
    result = await db.execute(
        text("SELECT search_vec FROM notes WHERE title = 'FTSTest'")
    )
    row = result.scalar_one()
    assert row is not None
    s = str(row)
    assert "toán" in s or "tích" in s


@pytest.mark.asyncio
async def test_notes_isolated_per_user(client, auth_token):
    await client.post(
        "/api/notes",
        json={"title": "UserA note"},
        headers={"Authorization": f"Bearer {auth_token}"},
    )
    resp_b = await client.post(
        "/api/register",
        json={"name": "B", "email": "b@test.com", "password": "secret123"},
    )
    token_b = resp_b.json()["access_token"]
    resp = await client.get(
        "/api/notes/UserA note",
        headers={"Authorization": f"Bearer {token_b}"},
    )
    assert resp.status_code == 404
    resp2 = await client.post(
        "/api/notes",
        json={"title": "UserA note"},
        headers={"Authorization": f"Bearer {token_b}"},
    )
    assert resp2.status_code == 200


@pytest.mark.asyncio
async def test_patch_note_can_clear_subject_and_difficulty(client, auth_token):
    await client.post(
        "/api/notes",
        json={"title": "Clear", "subject": "toan", "difficulty": "de"},
        headers={"Authorization": f"Bearer {auth_token}"},
    )
    resp = await client.patch(
        "/api/notes/Clear",
        json={"subject": None, "difficulty": None},
        headers={"Authorization": f"Bearer {auth_token}"},
    )
    assert resp.status_code == 200
    note = resp.json()
    assert note["subject"] is None
    assert note["difficulty"] is None


@pytest.mark.asyncio
async def test_patch_note_empty_body_preserves_fields(client, auth_token):
    await client.post(
        "/api/notes",
        json={"title": "Keep", "subject": "ly", "difficulty": "tb"},
        headers={"Authorization": f"Bearer {auth_token}"},
    )
    resp = await client.patch(
        "/api/notes/Keep",
        json={},
        headers={"Authorization": f"Bearer {auth_token}"},
    )
    assert resp.status_code == 200
    note = resp.json()
    assert note["subject"] == "ly"
    assert note["difficulty"] == "tb"


@pytest.mark.asyncio
async def test_notes_no_token_401(client):
    resp = await client.post("/api/notes", json={"title": "X"})
    assert resp.status_code == 401