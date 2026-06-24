from __future__ import annotations

import uuid
from pathlib import Path
from typing import Annotated

from fastapi import APIRouter, Depends, Form, HTTPException, UploadFile, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.core.deps import get_current_user
from app.db.session import get_db
from app.models.attachment import Attachment
from app.models.note import Note
from app.models.user import User
from app.schemas.attachment import AttachmentOut, AttachmentUrlOut
from app.services.storage import (
    StorageService,
    UploadValidationError,
    build_object_key,
    sanitize_filename,
    validate_upload,
)

router = APIRouter(tags=["attachments"])

NOTE_NOT_FOUND_DETAIL = "The specified note cannot be found."
RISKY_EXTENSIONS = frozenset({".html", ".htm", ".svg"})

EXTENSION_CONTENT_TYPES: dict[str, frozenset[str]] = {
    ".pdf": frozenset({"application/pdf"}),
    ".jpg": frozenset({"image/jpeg"}),
    ".jpeg": frozenset({"image/jpeg"}),
    ".png": frozenset({"image/png"}),
    ".gif": frozenset({"image/gif"}),
    ".webp": frozenset({"image/webp"}),
    ".txt": frozenset({"text/plain"}),
    ".doc": frozenset({"application/msword"}),
    ".docx": frozenset(
        {"application/vnd.openxmlformats-officedocument.wordprocessingml.document"}
    ),
    ".ppt": frozenset({"application/vnd.ms-powerpoint"}),
    ".pptx": frozenset(
        {"application/vnd.openxmlformats-officedocument.presentationml.presentation"}
    ),
    ".xls": frozenset({"application/vnd.ms-excel"}),
    ".xlsx": frozenset(
        {"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"}
    ),
    ".zip": frozenset({"application/zip"}),
}


def get_storage_service() -> StorageService:
    return StorageService()


def normalize_content_type(content_type: str | None) -> str:
    if not content_type:
        return "application/octet-stream"
    return content_type.split(";", 1)[0].strip().lower()


def validate_extension_match(filename: str, content_type: str) -> None:
    ext = Path(sanitize_filename(filename)).suffix.lower()
    if ext in RISKY_EXTENSIONS:
        raise UploadValidationError("Unsupported file extension")
    allowed = EXTENSION_CONTENT_TYPES.get(ext)
    if allowed is None:
        raise UploadValidationError("Unsupported file extension")
    if content_type not in allowed:
        raise UploadValidationError("File extension does not match content type")


async def _read_upload_limited(file: UploadFile, max_bytes: int) -> bytes:
    chunks: list[bytes] = []
    size = 0
    while chunk := await file.read(1024 * 1024):
        size += len(chunk)
        if size > max_bytes:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="File exceeds maximum upload size",
            )
        chunks.append(chunk)
    return b"".join(chunks)


async def _get_owner_attachment(
    db: AsyncSession, attachment_id: uuid.UUID, owner_id: uuid.UUID
) -> Attachment:
    result = await db.execute(
        select(Attachment).where(
            Attachment.id == attachment_id, Attachment.owner_id == owner_id
        )
    )
    attachment = result.scalar_one_or_none()
    if attachment is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Attachment not found."
        )
    return attachment


@router.post("/attachments", response_model=AttachmentOut)
async def upload_attachment(
    file: UploadFile,
    note_id: Annotated[str | None, Form(alias="noteId")] = None,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
    storage: StorageService = Depends(get_storage_service),
) -> AttachmentOut:
    parsed_note_id: uuid.UUID | None = None
    if note_id is not None:
        try:
            parsed_note_id = uuid.UUID(note_id)
        except ValueError as exc:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail=NOTE_NOT_FOUND_DETAIL
            ) from exc
        result = await db.execute(
            select(Note).where(Note.id == parsed_note_id, Note.owner_id == user.id)
        )
        if result.scalar_one_or_none() is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail=NOTE_NOT_FOUND_DETAIL
            )

    data = await _read_upload_limited(file, settings.max_upload_bytes)
    filename = sanitize_filename(file.filename or "upload")
    content_type = normalize_content_type(file.content_type)

    try:
        validate_upload(filename, content_type, len(data))
        validate_extension_match(filename, content_type)
    except UploadValidationError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)
        ) from exc

    key = build_object_key(str(user.id), filename)
    storage.put_bytes(key, data, content_type)

    attachment = Attachment(
        owner_id=user.id,
        note_id=parsed_note_id,
        key=key,
        filename=filename,
        content_type=content_type,
        size_bytes=len(data),
    )
    db.add(attachment)
    await db.commit()
    await db.refresh(attachment)

    return AttachmentOut(
        id=attachment.id,
        url=f"/api/attachments/{attachment.id}",
        filename=attachment.filename,
        content_type=attachment.content_type,
        size_bytes=attachment.size_bytes,
    )


@router.get(
    "/attachments/{attachment_id}/preview-url", response_model=AttachmentUrlOut
)
async def get_attachment_preview_url(
    attachment_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
    storage: StorageService = Depends(get_storage_service),
) -> AttachmentUrlOut:
    attachment = await _get_owner_attachment(db, attachment_id, user.id)
    url = storage.presigned_get_url(
        attachment.key,
        attachment.filename,
        attachment.content_type,
        download=False,
    )
    return AttachmentUrlOut(url=url)


@router.get(
    "/attachments/{attachment_id}/download-url", response_model=AttachmentUrlOut
)
async def get_attachment_download_url(
    attachment_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
    storage: StorageService = Depends(get_storage_service),
) -> AttachmentUrlOut:
    attachment = await _get_owner_attachment(db, attachment_id, user.id)
    url = storage.presigned_get_url(
        attachment.key,
        attachment.filename,
        attachment.content_type,
        download=True,
    )
    return AttachmentUrlOut(url=url)
