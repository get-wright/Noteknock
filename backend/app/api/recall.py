import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.deps import get_current_user
from app.db.session import get_db
from app.models.note import Note, RecallItem
from app.models.user import User
from app.schemas.recall import RecallItemCreate, RecallItemOut, RecallItemUpdate

router = APIRouter(tags=["recall"])


async def _get_owner_note(db: AsyncSession, owner_id: uuid.UUID, title: str) -> Note | None:
    result = await db.execute(
        select(Note).where(Note.owner_id == owner_id, Note.title == title)
    )
    return result.scalar_one_or_none()


async def _get_owner_recall_item(
    db: AsyncSession, owner_id: uuid.UUID, note_id: uuid.UUID, item_id: uuid.UUID
) -> RecallItem | None:
    result = await db.execute(
        select(RecallItem).where(
            RecallItem.id == item_id,
            RecallItem.note_id == note_id,
            RecallItem.owner_id == owner_id,
        )
    )
    return result.scalar_one_or_none()


def _not_found() -> HTTPException:
    return HTTPException(
        status_code=status.HTTP_404_NOT_FOUND,
        detail="The specified note or recall item cannot be found.",
    )


def _recall_item_to_out(item: RecallItem) -> RecallItemOut:
    return RecallItemOut(
        id=item.id,
        content=item.content,
        position=item.position,
        checked=item.checked,
        source=item.source,
        created_at=item.created_at.timestamp(),
    )


@router.get("/notes/{title}/recall", response_model=list[RecallItemOut])
async def list_recall_items(
    title: str,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
) -> list[RecallItemOut]:
    note = await _get_owner_note(db, user.id, title)
    if note is None:
        raise _not_found()
    result = await db.execute(
        select(RecallItem)
        .where(RecallItem.note_id == note.id, RecallItem.owner_id == user.id)
        .order_by(RecallItem.position, RecallItem.created_at, RecallItem.id)
    )
    return [_recall_item_to_out(item) for item in result.scalars().all()]


@router.post("/notes/{title}/recall", response_model=RecallItemOut)
async def create_recall_item(
    title: str,
    body: RecallItemCreate,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
) -> RecallItemOut:
    note = await _get_owner_note(db, user.id, title)
    if note is None:
        raise _not_found()
    result = await db.execute(
        select(func.coalesce(func.max(RecallItem.position), -1)).where(
            RecallItem.note_id == note.id,
            RecallItem.owner_id == user.id,
        )
    )
    position = result.scalar_one() + 1
    item = RecallItem(
        note_id=note.id,
        owner_id=user.id,
        content=body.content,
        position=position,
        source="manual",
    )
    db.add(item)
    await db.commit()
    await db.refresh(item)
    return _recall_item_to_out(item)


@router.patch("/notes/{title}/recall/{item_id}", response_model=RecallItemOut)
async def update_recall_item(
    title: str,
    item_id: uuid.UUID,
    body: RecallItemUpdate,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
) -> RecallItemOut:
    note = await _get_owner_note(db, user.id, title)
    if note is None:
        raise _not_found()
    item = await _get_owner_recall_item(db, user.id, note.id, item_id)
    if item is None:
        raise _not_found()
    if "content" in body.model_fields_set:
        item.content = body.content
    if "checked" in body.model_fields_set:
        item.checked = body.checked
    if "position" in body.model_fields_set:
        item.position = body.position
    await db.commit()
    await db.refresh(item)
    return _recall_item_to_out(item)


@router.delete("/notes/{title}/recall/{item_id}")
async def delete_recall_item(
    title: str,
    item_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
) -> None:
    note = await _get_owner_note(db, user.id, title)
    if note is None:
        raise _not_found()
    item = await _get_owner_recall_item(db, user.id, note.id, item_id)
    if item is None:
        raise _not_found()
    await db.delete(item)
    await db.commit()
