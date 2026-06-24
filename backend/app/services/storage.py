from __future__ import annotations

import io
import uuid
from datetime import timedelta
from pathlib import Path, PurePosixPath, PureWindowsPath
from typing import Literal
from urllib.parse import quote

from minio import Minio

from app.config import settings

DEFAULT_STORAGE_REGION = "us-east-1"
HEADER_UNSAFE_FILENAME_CHARS = frozenset({'"', "\\", ";"})

ALLOWED_CONTENT_TYPES = frozenset(
    {
        "image/jpeg",
        "image/png",
        "image/gif",
        "image/webp",
        "application/pdf",
        "text/plain",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "application/vnd.ms-powerpoint",
        "application/vnd.openxmlformats-officedocument.presentationml.presentation",
        "application/vnd.ms-excel",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "application/zip",
    }
)

INLINE_CONTENT_TYPES = frozenset(
    {
        "image/jpeg",
        "image/png",
        "image/gif",
        "image/webp",
        "application/pdf",
    }
)


class UploadValidationError(ValueError):
    pass


def sanitize_filename(filename: str) -> str:
    name = PureWindowsPath(PurePosixPath(filename).name).name
    cleaned = "".join(
        ch
        for ch in name
        if ch not in HEADER_UNSAFE_FILENAME_CHARS
        and ch not in "\r\n\x00"
        and ord(ch) >= 32
    )
    cleaned = cleaned.strip()
    return cleaned or "upload"


def build_object_key(owner_id: str, filename: str) -> str:
    safe_name = sanitize_filename(filename)
    ext = Path(safe_name).suffix.lower()
    if ext and not all(ch.isalnum() or ch == "." for ch in ext):
        ext = ""
    return f"{owner_id}/{uuid.uuid4()}{ext}"


def validate_upload(filename: str, content_type: str, size_bytes: int) -> None:
    del filename
    if size_bytes < 0:
        raise UploadValidationError("File size cannot be negative")
    if size_bytes > settings.max_upload_bytes:
        raise UploadValidationError("File exceeds maximum upload size")
    if content_type not in ALLOWED_CONTENT_TYPES:
        raise UploadValidationError("Unsupported content type")


def classify_content_disposition(content_type: str) -> Literal["inline", "attachment"]:
    if content_type in INLINE_CONTENT_TYPES:
        return "inline"
    return "attachment"


def _content_disposition_header(
    disposition: Literal["inline", "attachment"], filename: str
) -> str:
    safe_name = sanitize_filename(filename)
    ascii_name = safe_name.encode("ascii", "ignore").decode().strip() or "upload"
    encoded_name = quote(safe_name, safe="")
    return f'{disposition}; filename="{ascii_name}"; filename*=UTF-8\'\'{encoded_name}'


class StorageService:
    def __init__(self) -> None:
        self._client = Minio(
            settings.storage_endpoint,
            access_key=settings.storage_access_key,
            secret_key=settings.storage_secret_key,
            secure=settings.storage_secure,
            region=DEFAULT_STORAGE_REGION,
        )
        self._presign_client = Minio(
            settings.storage_public_endpoint or settings.storage_endpoint,
            access_key=settings.storage_access_key,
            secret_key=settings.storage_secret_key,
            secure=settings.storage_secure,
            region=DEFAULT_STORAGE_REGION,
        )
        self._bucket = settings.storage_bucket

    def ensure_bucket(self) -> None:
        if not self._client.bucket_exists(self._bucket):
            self._client.make_bucket(self._bucket)

    def put_bytes(self, key: str, data: bytes, content_type: str) -> None:
        stream = io.BytesIO(data)
        self._client.put_object(
            self._bucket,
            key,
            stream,
            length=len(data),
            content_type=content_type,
        )

    def get_bytes(self, key: str) -> bytes:
        response = self._client.get_object(self._bucket, key)
        try:
            return response.read()
        finally:
            response.close()
            response.release_conn()

    def presigned_get_url(
        self,
        key: str,
        filename: str,
        content_type: str,
        download: bool = False,
    ) -> str:
        disposition = classify_content_disposition(content_type)
        if download or disposition == "attachment":
            content_disposition = _content_disposition_header("attachment", filename)
        else:
            content_disposition = _content_disposition_header("inline", filename)

        return self._presign_client.presigned_get_object(
            self._bucket,
            key,
            expires=timedelta(seconds=settings.storage_presigned_expiry_seconds),
            response_headers={
                "response-content-type": content_type,
                "response-content-disposition": content_disposition,
            },
        )
