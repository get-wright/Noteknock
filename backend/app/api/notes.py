from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import delete, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.deps import get_current_user
from app.db.session import get_db
from app.models.note import Note, NoteTag
from app.models.user import User
from app.schemas.note import NoteCreate, NoteOut, NoteUpdate
from app.services.content import blocks_to_text
from app.services.tags import extract_tags

router = APIRouter(tags=["notes"])


async def _get_owner_note(db: AsyncSession, owner_id, title: str) -> Note | None:
    result = await db.execute(
        select(Note).where(Note.owner_id == owner_id, Note.title == title)
    )
    return result.scalar_one_or_none()


async def _get_note_tags(db: AsyncSession, note_id) -> list[str]:
    result = await db.execute(
        select(NoteTag.tag).where(NoteTag.note_id == note_id).order_by(NoteTag.tag)
    )
    return [row[0] for row in result.all()]


async def _rewrite_tags(db: AsyncSession, note_id, tags: list[str]) -> None:
    await db.execute(delete(NoteTag).where(NoteTag.note_id == note_id))
    for tag in tags:
        db.add(NoteTag(note_id=note_id, tag=tag))


async def _get_all_owner_tags(db: AsyncSession, owner_id) -> list[str]:
    result = await db.execute(
        select(NoteTag.tag)
        .join(Note, Note.id == NoteTag.note_id)
        .where(Note.owner_id == owner_id)
        .distinct()
        .order_by(NoteTag.tag)
    )
    return [row[0] for row in result.all()]


def _note_to_out(n: Note, tags: list[str]) -> NoteOut:
    return NoteOut(
        title=n.title,
        content=n.content,
        subject=n.subject,
        difficulty=n.difficulty,
        lastModified=n.updated_at.timestamp(),
        tags=tags,
    )


@router.post("/notes", response_model=NoteOut)
async def create_note(
    body: NoteCreate,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
) -> NoteOut:
    content_text = blocks_to_text(body.content)
    tags = extract_tags(body.content)
    note = Note(
        owner_id=user.id,
        title=body.title,
        content=body.content,
        content_text=content_text,
        subject=body.subject,
        difficulty=body.difficulty,
    )
    db.add(note)
    try:
        await db.flush()
    except IntegrityError:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Cannot create note. A note with the same title already exists.",
        )
    await _rewrite_tags(db, note.id, tags)
    await db.commit()
    await db.refresh(note)
    return _note_to_out(note, tags)


@router.get("/notes/{title}", response_model=NoteOut)
async def get_note(
    title: str,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
) -> NoteOut:
    note = await _get_owner_note(db, user.id, title)
    if note is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="The specified note cannot be found.",
        )
    tags = await _get_note_tags(db, note.id)
    return _note_to_out(note, tags)


@router.patch("/notes/{title}", response_model=NoteOut)
async def update_note(
    title: str,
    body: NoteUpdate,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
) -> NoteOut:
    note = await _get_owner_note(db, user.id, title)
    if note is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="The specified note cannot be found.",
        )
    if body.newTitle is not None:
        note.title = body.newTitle
    if body.newContent is not None:
        note.content = body.newContent
        note.content_text = blocks_to_text(body.newContent)
    if body.subject is not None:
        note.subject = body.subject
    if body.difficulty is not None:
        note.difficulty = body.difficulty
    note.updated_at = datetime.now(timezone.utc)
    tags = extract_tags(note.content)
    try:
        await db.flush()
    except IntegrityError:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Cannot create note. A note with the same title already exists.",
        )
    await _rewrite_tags(db, note.id, tags)
    await db.commit()
    await db.refresh(note)
    return _note_to_out(note, tags)


@router.delete("/notes/{title}")
async def delete_note(
    title: str,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
) -> None:
    note = await _get_owner_note(db, user.id, title)
    if note is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="The specified note cannot be found.",
        )
    await db.delete(note)
    await db.commit()
    return None


@router.get("/tags")
async def get_tags(
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
) -> list[str]:
    return await _get_all_owner_tags(db, user.id)