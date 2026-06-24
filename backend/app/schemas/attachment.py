import uuid

from app.schemas.auth import CamelModel


class AttachmentOut(CamelModel):
    id: uuid.UUID
    url: str
    filename: str
    content_type: str
    size_bytes: int


class AttachmentUrlOut(CamelModel):
    url: str
