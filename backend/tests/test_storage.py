import pytest

import app.services.storage as storage_module
from app.services.storage import (
    StorageService,
    UploadValidationError,
    build_object_key,
    classify_content_disposition,
    sanitize_filename,
    validate_upload,
)


def test_sanitize_filename_removes_path_and_header_risks():
    assert sanitize_filename("../../evil\r\n.pdf") == "evil.pdf"
    assert sanitize_filename("") == "upload"


def test_build_object_key_is_owner_scoped_and_unpredictable():
    key = build_object_key("owner-id", "notes.pdf")
    assert key.startswith("owner-id/")
    assert key.endswith(".pdf")
    assert key != "owner-id/notes.pdf"


def test_validate_upload_allows_common_study_materials():
    validate_upload("slides.pdf", "application/pdf", 1024)
    validate_upload(
        "notes.docx",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        1024,
    )


def test_validate_upload_rejects_oversized_file():
    with pytest.raises(UploadValidationError):
        validate_upload("huge.pdf", "application/pdf", 26 * 1024 * 1024)


def test_validate_upload_rejects_negative_size():
    with pytest.raises(UploadValidationError):
        validate_upload("negative.pdf", "application/pdf", -1)


def test_validate_upload_rejects_unsupported_mime_type():
    with pytest.raises(UploadValidationError):
        validate_upload("script.html", "text/html", 1024)


def test_risky_types_force_attachment():
    assert classify_content_disposition("image/png") == "inline"
    assert classify_content_disposition("application/pdf") == "inline"
    assert classify_content_disposition("image/svg+xml") == "attachment"
    assert classify_content_disposition("text/html") == "attachment"


class FakeMinioClient:
    def __init__(self):
        self.response_headers = None

    def presigned_get_object(self, *_args, response_headers=None, **_kwargs):
        self.response_headers = response_headers
        return "https://storage.invalid/presigned"


def test_presigned_get_url_sanitizes_content_disposition_filename():
    service = StorageService()
    client = FakeMinioClient()
    service._presign_client = client

    service.presigned_get_url(
        "owner-id/key",
        'notes"; filename="evil.exe',
        "application/pdf",
    )

    header = client.response_headers["response-content-disposition"]
    assert header.startswith("inline; ")
    assert 'filename="notes filename=evil.exe"' in header
    assert '; filename="evil.exe"' not in header
    assert header.count('filename="') == 1


def test_presigned_get_url_download_forces_attachment_for_inline_type():
    service = StorageService()
    client = FakeMinioClient()
    service._presign_client = client

    service.presigned_get_url(
        "owner-id/key",
        "image.png",
        "image/png",
        download=True,
    )

    header = client.response_headers["response-content-disposition"]
    assert header.startswith("attachment; ")


def test_storage_service_uses_default_region_to_avoid_presign_lookup(monkeypatch):
    init_kwargs = []

    class FakeMinio:
        def __init__(self, *_args, **kwargs):
            init_kwargs.append(kwargs)

    monkeypatch.setattr(storage_module, "Minio", FakeMinio)

    StorageService()

    assert init_kwargs[0]["region"] == "us-east-1"
    assert init_kwargs[1]["region"] == "us-east-1"


def test_storage_service_uses_public_endpoint_for_presigned_urls(monkeypatch):
    endpoints = []

    class FakeMinio:
        def __init__(self, endpoint, *_args, **_kwargs):
            endpoints.append(endpoint)

    monkeypatch.setattr(storage_module.settings, "storage_endpoint", "minio:9000")
    monkeypatch.setattr(
        storage_module.settings, "storage_public_endpoint", "localhost:9000"
    )
    monkeypatch.setattr(storage_module, "Minio", FakeMinio)

    StorageService()

    assert endpoints == ["minio:9000", "localhost:9000"]


def test_app_startup_ensures_bucket_when_enabled(monkeypatch):
    from app import main as main_module

    calls = []

    class FakeStorageService:
        def ensure_bucket(self):
            calls.append("ensure_bucket")

    monkeypatch.setattr(main_module.settings, "storage_ensure_bucket_on_startup", True)
    monkeypatch.setattr(main_module, "StorageService", lambda: FakeStorageService())

    main_module.ensure_attachment_bucket()

    assert calls == ["ensure_bucket"]
