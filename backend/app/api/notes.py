from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import delete, select, text as sql_text
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.deps import get_current_user
from app.db.session import get_db
from app.models.note import Note, NoteTag
from app.models.user import User
from app.schemas.note import NoteCreate, NoteOut, NoteUpdate, SearchResult
from app.services.content import blocks_to_text
from app.services.search import parse_search
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


@router.get("/search", response_model=list[SearchResult])
async def search_notes(
    term: str = "",
    sort: str = "score",
    order: str = "desc",
    limit: int | None = None,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
) -> list[SearchResult]:
    parsed = parse_search(term)
    has_fts = not parsed["match_all"] and bool(parsed["text"])
    tag = parsed["tag"]

    if sort not in {"score", "title", "lastModified"}:
        sort = "score"
    if order not in {"asc", "desc"}:
        order = "desc"
    if not has_fts and sort == "score":
        sort = "lastModified"

    params: dict = {"owner_id": str(user.id)}
    sql_parts = [
        "SELECT n.title,",
        " EXTRACT(EPOCH FROM n.updated_at)::float8 AS last_modified",
    ]

    if has_fts:
        params["text"] = parsed["text"]
        sql_parts.append(", ts_rank(n.search_vec, q) AS score")
        sql_parts.append(
            ", ts_headline('simple',"
            " regexp_replace(regexp_replace(regexp_replace(n.title, '&', '&amp;', 'g'),"
            " '<', '&lt;', 'g'), '>', '&gt;', 'g'),"
            " q, 'StartSel=<b>, StopSel=</b>, MaxWords=35, MinWords=10') AS title_hl"
        )
        sql_parts.append(
            ", ts_headline('simple',"
            " regexp_replace(regexp_replace(regexp_replace(n.content_text, '&', '&amp;', 'g'),"
            " '<', '&lt;', 'g'), '>', '&gt;', 'g'),"
            " q, 'StartSel=<b>, StopSel=</b>, MaxWords=35, MinWords=10') AS content_hl"
        )
    else:
        sql_parts.append(", 0::float8 AS score, NULL::text AS title_hl, NULL::text AS content_hl")

    sql_parts.append(" FROM notes n")

    if has_fts:
        sql_parts.append(
            " CROSS JOIN (SELECT COALESCE(NULLIF(websearch_to_tsquery('simple', :text),"
            " ''::tsquery), plainto_tsquery('simple', :text)) AS q) AS q"
        )

    if tag:
        sql_parts.append(" JOIN note_tags nt ON nt.note_id = n.id AND nt.tag = :tag")
        params["tag"] = tag

    sql_parts.append(" WHERE n.owner_id = :owner_id")
    if has_fts:
        sql_parts.append(" AND n.search_vec @@ q")

    sort_col = {"score": "score", "title": "n.title", "lastModified": "n.updated_at"}[sort]
    direction = "ASC" if order == "asc" else "DESC"
    sql_parts.append(f" ORDER BY {sort_col} {direction}")

    if limit is not None and limit > 0:
        params["limit"] = limit
        sql_parts.append(" LIMIT :limit")

    sql = "".join(sql_parts)
    result = await db.execute(sql_text(sql), params)
    rows = result.all()

    tag_matches = [tag] if tag else None
    return [
        SearchResult(
            title=row.title,
            lastModified=row.last_modified,
            titleHighlights=row.title_hl,
            contentHighlights=row.content_hl,
            tagMatches=tag_matches,
        )
        for row in rows
    ]


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
    if "subject" in body.model_fields_set:
        note.subject = body.subject
    if "difficulty" in body.model_fields_set:
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