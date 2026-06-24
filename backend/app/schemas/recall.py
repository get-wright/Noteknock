import uuid
from typing import Optional

from pydantic import field_validator

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

    @field_validator("content", "checked", "position")
    @classmethod
    def reject_null_update_fields(cls, v):
        if v is None:
            raise ValueError("Recall item update fields cannot be null.")
        return v
