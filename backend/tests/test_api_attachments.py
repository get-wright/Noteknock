import uuid

import pytest
from sqlalchemy import select

from app.config import settings
from app.main import app as fastapi_app
from app.models.attachment import Attachment
from app.models.note import Note


class FakeStorage:
    def __init__(self):
        self.puts = []
        self.objects = {}

    def put_bytes(self, key, data, content_type):
        self.puts.append((key, data, content_type))
        self.objects[key] = data

    def get_bytes(self, key):
        return self.objects[key]

    def presigned_get_url(self, key, filename, content_type, download=False):
        suffix = "download" if download else "preview"
        return f"https://storage.invalid/{suffix}/{key}"


@pytest.fixture
def fake_storage():
    storage = FakeStorage()
    from app.api import attachments

    fastapi_app.dependency_overrides[attachments.get_storage_service] = lambda: storage
    yield storage
    fastapi_app.dependency_overrides.pop(attachments.get_storage_service, None)


async def _register_user(client, email: str) -> str:
    resp = await client.post(
        "/api/register",
        json={"name": "Uploader", "email": email, "password": "secret123"},
    )
    assert resp.status_code == 200
    return resp.json()["access_token"]


async def _upload_pdf(client, auth_token, fake_storage, *, note_id=None, filename="notes.pdf"):
    kwargs = {
        "files": {"file": (filename, b"%PDF-1.4 test", "application/pdf")},
        "headers": {"Authorization": f"Bearer {auth_token}"},
    }
    if note_id is not None:
        kwargs["data"] = {"noteId": str(note_id)}
    resp = await client.post("/api/attachments", **kwargs)
    return resp


@pytest.mark.asyncio
async def test_upload_without_auth_returns_401(client, fake_storage):
    resp = await client.post(
        "/api/attachments",
        files={"file": ("notes.pdf", b"%PDF-1.4", "application/pdf")},
    )
    assert resp.status_code == 401


@pytest.mark.asyncio
async def test_authenticated_pdf_upload_returns_metadata(client, auth_token, fake_storage):
    resp = await _upload_pdf(client, auth_token, fake_storage)
    assert resp.status_code == 200
    body = resp.json()
    assert set(body.keys()) == {"id", "url", "filename", "contentType", "sizeBytes"}
    assert body["filename"] == "notes.pdf"
    assert body["contentType"] == "application/pdf"
    assert body["sizeBytes"] == len(b"%PDF-1.4 test")
    assert body["url"] == f"/api/attachments/{body['id']}"
    assert len(fake_storage.puts) == 1
    key, data, content_type = fake_storage.puts[0]
    assert data == b"%PDF-1.4 test"
    assert content_type == "application/pdf"
    assert key.endswith(".pdf")


@pytest.mark.asyncio
async def test_upload_with_valid_note_id(client, auth_token, fake_storage, db):
    note_resp = await client.post(
        "/api/notes",
        json={"title": "Attachment Note"},
        headers={"Authorization": f"Bearer {auth_token}"},
    )
    assert note_resp.status_code == 200
    result = await db.execute(select(Note).where(Note.title == "Attachment Note"))
    note_id = result.scalar_one().id

    resp = await _upload_pdf(client, auth_token, fake_storage, note_id=note_id)
    assert resp.status_code == 200

    result = await db.execute(
        select(Attachment).where(Attachment.id == uuid.UUID(resp.json()["id"]))
    )
    attachment = result.scalar_one()
    assert attachment.note_id == note_id


@pytest.mark.asyncio
async def test_upload_with_missing_note_id_returns_404(client, auth_token, fake_storage):
    resp = await _upload_pdf(
        client, auth_token, fake_storage, note_id=uuid.uuid4()
    )
    assert resp.status_code == 404
    assert resp.json()["detail"] == "The specified note cannot be found."


@pytest.mark.asyncio
async def test_upload_with_other_users_note_id_returns_404(client, fake_storage, db):
    owner_token = await _register_user(client, "owner@test.com")
    other_token = await _register_user(client, "other@test.com")

    note_resp = await client.post(
        "/api/notes",
        json={"title": "Owner Note"},
        headers={"Authorization": f"Bearer {owner_token}"},
    )
    assert note_resp.status_code == 200
    result = await db.execute(select(Note).where(Note.title == "Owner Note"))
    note_id = result.scalar_one().id

    resp = await _upload_pdf(client, other_token, fake_storage, note_id=note_id)
    assert resp.status_code == 404
    assert resp.json()["detail"] == "The specified note cannot be found."


@pytest.mark.asyncio
async def test_cross_user_preview_url_returns_404(client, fake_storage):
    owner_token = await _register_user(client, "preview-owner@test.com")
    other_token = await _register_user(client, "preview-other@test.com")

    upload_resp = await _upload_pdf(client, owner_token, fake_storage)
    attachment_id = upload_resp.json()["id"]

    resp = await client.get(
        f"/api/attachments/{attachment_id}/preview-url",
        headers={"Authorization": f"Bearer {other_token}"},
    )
    assert resp.status_code == 404


@pytest.mark.asyncio
async def test_preview_url_returns_presigned_preview(client, auth_token, fake_storage):
    upload_resp = await _upload_pdf(client, auth_token, fake_storage)
    attachment_id = upload_resp.json()["id"]

    resp = await client.get(
        f"/api/attachments/{attachment_id}/preview-url",
        headers={"Authorization": f"Bearer {auth_token}"},
    )
    assert resp.status_code == 200
    assert resp.json()["url"] == f"https://storage.invalid/preview/{fake_storage.puts[0][0]}"


@pytest.mark.asyncio
async def test_download_url_is_marked_for_attachment(client, auth_token, fake_storage):
    upload_resp = await _upload_pdf(client, auth_token, fake_storage)
    attachment_id = upload_resp.json()["id"]

    resp = await client.get(
        f"/api/attachments/{attachment_id}/download-url",
        headers={"Authorization": f"Bearer {auth_token}"},
    )
    assert resp.status_code == 200
    assert "/download/" in resp.json()["url"]


@pytest.mark.asyncio
async def test_content_returns_owner_scoped_attachment_bytes(
    client, auth_token, fake_storage
):
    upload_resp = await _upload_pdf(client, auth_token, fake_storage)
    attachment_id = upload_resp.json()["id"]

    resp = await client.get(
        f"/api/attachments/{attachment_id}/content",
        headers={"Authorization": f"Bearer {auth_token}"},
    )

    assert resp.status_code == 200
    assert resp.content == b"%PDF-1.4 test"
    assert resp.headers["content-type"] == "application/pdf"
    assert resp.headers.get("content-disposition", "").lower().startswith("inline")
    assert resp.headers.get("cache-control") == "private, max-age=300"


@pytest.mark.asyncio
async def test_cross_user_content_returns_404(client, fake_storage):
    owner_token = await _register_user(client, "content-owner@test.com")
    other_token = await _register_user(client, "content-other@test.com")
    upload_resp = await _upload_pdf(client, owner_token, fake_storage)
    attachment_id = upload_resp.json()["id"]

    resp = await client.get(
        f"/api/attachments/{attachment_id}/content",
        headers={"Authorization": f"Bearer {other_token}"},
    )

    assert resp.status_code == 404


@pytest.mark.asyncio
async def test_oversized_file_returns_400(client, auth_token, fake_storage, monkeypatch):
    monkeypatch.setattr(settings, "max_upload_bytes", 16)
    resp = await client.post(
        "/api/attachments",
        files={"file": ("big.pdf", b"x" * 32, "application/pdf")},
        headers={"Authorization": f"Bearer {auth_token}"},
    )
    assert resp.status_code == 400
    assert "size" in resp.json()["detail"].lower()


@pytest.mark.asyncio
async def test_content_type_with_parameters_is_normalized(client, auth_token, fake_storage):
    resp = await client.post(
        "/api/attachments",
        files={
            "file": (
                "notes.pdf",
                b"%PDF-1.4 test",
                "Application/PDF; charset=utf-8",
            )
        },
        headers={"Authorization": f"Bearer {auth_token}"},
    )
    assert resp.status_code == 200
    assert resp.json()["contentType"] == "application/pdf"
    assert fake_storage.puts[0][2] == "application/pdf"


@pytest.mark.asyncio
async def test_html_extension_rejected_even_with_allowed_content_type(
    client, auth_token, fake_storage
):
    resp = await client.post(
        "/api/attachments",
        files={"file": ("page.html", b"<html></html>", "application/pdf")},
        headers={"Authorization": f"Bearer {auth_token}"},
    )
    assert resp.status_code == 400


@pytest.mark.asyncio
async def test_unknown_extension_rejected_even_with_allowed_content_type(
    client, auth_token, fake_storage
):
    resp = await client.post(
        "/api/attachments",
        files={"file": ("malware.exe", b"%PDF-1.4", "application/pdf")},
        headers={"Authorization": f"Bearer {auth_token}"},
    )
    assert resp.status_code == 400
    assert resp.json()["detail"] == "Unsupported file extension"


@pytest.mark.asyncio
async def test_missing_extension_rejected_even_with_allowed_content_type(
    client, auth_token, fake_storage
):
    resp = await client.post(
        "/api/attachments",
        files={"file": ("upload", b"%PDF-1.4", "application/pdf")},
        headers={"Authorization": f"Bearer {auth_token}"},
    )
    assert resp.status_code == 400
    assert resp.json()["detail"] == "Unsupported file extension"


@pytest.mark.asyncio
async def test_extension_content_type_mismatch_rejected(client, auth_token, fake_storage):
    resp = await client.post(
        "/api/attachments",
        files={"file": ("notes.pdf", b"not a jpeg", "image/jpeg")},
        headers={"Authorization": f"Bearer {auth_token}"},
    )
    assert resp.status_code == 400
    assert resp.json()["detail"] == "File extension does not match content type"
