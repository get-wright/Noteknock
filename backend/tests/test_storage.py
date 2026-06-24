import pytest

from app.services.storage import (
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


def test_risky_types_force_attachment():
    assert classify_content_disposition("image/png") == "inline"
    assert classify_content_disposition("application/pdf") == "inline"
    assert classify_content_disposition("image/svg+xml") == "attachment"
    assert classify_content_disposition("text/html") == "attachment"
