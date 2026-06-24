import uuid

import pytest
from sqlalchemy import text

from app.core.security import hash_password
from app.models.note import Note, NoteTag
from app.models.user import User


def test_note_creates_with_required_fields():
    owner = uuid.uuid4()
    n = Note(owner_id=owner, title="Tích phân #toán", content=[], content_text="")
    assert n.title == "Tích phân #toán"
    assert n.content == []
    assert n.content_text == ""
    assert n.id is None
    assert n.subject is None
    assert n.difficulty is None


def test_note_tag_creates():
    note_id = uuid.uuid4()
    t = NoteTag(note_id=note_id, tag="toán")
    assert t.tag == "toán"
    assert t.note_id == note_id


def test_note_defaults_are_immutable_in_model():
    n = Note(owner_id=uuid.uuid4(), title="x")
    assert n.title == "x"


@pytest.mark.asyncio
async def test_note_search_vec_populated_by_trigger(db):
    u = User(name="Tester", email="t@test.com", password_hash=hash_password("secret123"))
    db.add(u)
    await db.commit()
    await db.refresh(u)
    n = Note(owner_id=u.id, title="Tích phân từng phần", content_text="công thức ILATE #toán")
    db.add(n)
    await db.commit()
    result = await db.execute(text("SELECT search_vec FROM notes WHERE id = :id"), {"id": n.id})
    row = result.scalar_one()
    assert row is not None
    s = str(row)
    assert "tích" in s or "tich" in s