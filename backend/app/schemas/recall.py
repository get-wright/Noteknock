import uuid
from typing import Optional

from app.schemas.auth import CamelModel


class RecallItemOut(CamelModel):
    id: uuid.UUID
    content: str
    position: int
    checked: bool
    source: str
    created_at: float


class RecallItemCreate(CamelModel):
    content: str


class RecallItemUpdate(CamelModel):
    content: Optional[str] = None
    checked: Optional[bool] = None
    position: Optional[int] = None
