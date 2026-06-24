from typing import Optional

from pydantic import field_validator

from app.schemas.auth import CamelModel

_INVALID_TITLE_CHARS = set('<>:"/\\|?*')


class NoteCreate(CamelModel):
    title: str
    content: list = []
    subject: Optional[str] = None
    difficulty: Optional[str] = None

    @field_validator("title")
    @classmethod
    def validate_title(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError("Title cannot be empty.")
        if any(c in _INVALID_TITLE_CHARS for c in v):
            raise ValueError("The specified note title contains invalid characters.")
        return v


class NoteUpdate(CamelModel):
    newTitle: Optional[str] = None
    newContent: Optional[list] = None
    subject: Optional[str] = None
    difficulty: Optional[str] = None

    @field_validator("newTitle")
    @classmethod
    def validate_new_title(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return v
        v = v.strip()
        if not v:
            raise ValueError("Title cannot be empty.")
        if any(c in _INVALID_TITLE_CHARS for c in v):
            raise ValueError("The specified note title contains invalid characters.")
        return v


class NoteOut(CamelModel):
    title: str
    content: list
    subject: Optional[str] = None
    difficulty: Optional[str] = None
    lastModified: float
    tags: list[str]


class SearchResult(CamelModel):
    title: str
    lastModified: float
    titleHighlights: Optional[str] = None
    contentHighlights: Optional[str] = None
    tagMatches: Optional[list[str]] = None
