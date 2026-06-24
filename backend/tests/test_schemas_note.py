import pytest
from pydantic import ValidationError
from app.schemas.note import NoteCreate, NoteUpdate, NoteOut, SearchResult


def test_note_create_defaults():
    n = NoteCreate.model_validate({"title": "Tích phân"})
    assert n.title == "Tích phân"
    assert n.content == []
    assert n.subject is None
    assert n.difficulty is None


def test_note_create_full():
    n = NoteCreate.model_validate(
        {
            "title": "Tích phân",
            "content": [{"type": "paragraph"}],
            "subject": "toan",
            "difficulty": "de",
        }
    )
    assert n.title == "Tích phân"
    assert n.content == [{"type": "paragraph"}]
    assert n.subject == "toan"
    assert n.difficulty == "de"


def test_note_create_strips_title_whitespace():
    n = NoteCreate.model_validate({"title": "  Tích phân  "})
    assert n.title == "Tích phân"


def test_note_create_rejects_empty_title():
    with pytest.raises(ValidationError):
        NoteCreate.model_validate({"title": "   "})


def test_note_create_rejects_invalid_title_chars():
    for bad in ["a<b", 'a"b', "a/b", "a:b", "a\\b", "a|b", "a?b", "a*b", "a>b"]:
        with pytest.raises(ValidationError):
            NoteCreate.model_validate({"title": bad})


def test_note_update_all_optional():
    u = NoteUpdate.model_validate({})
    assert u.newTitle is None
    assert u.newContent is None
    assert u.subject is None
    assert u.difficulty is None


def test_note_update_new_title_validation():
    with pytest.raises(ValidationError):
        NoteUpdate.model_validate({"newTitle": "a/b"})
    u = NoteUpdate.model_validate({"newTitle": "  Ok  "})
    assert u.newTitle == "Ok"


def test_note_out_shape():
    n = NoteOut.model_validate(
        {
            "title": "Tích phân",
            "content": [],
            "subject": "toan",
            "difficulty": "de",
            "lastModified": 1719123456.78,
            "tags": ["toán", "lý"],
        }
    )
    assert n.title == "Tích phân"
    assert n.lastModified == 1719123456.78
    assert n.tags == ["toán", "lý"]
    dumped = n.model_dump(by_alias=True)
    assert "lastModified" in dumped
    assert "tags" in dumped


def test_search_result_optional_fields():
    s = SearchResult.model_validate({"title": "X", "lastModified": 1.0})
    assert s.titleHighlights is None
    assert s.contentHighlights is None
    assert s.tagMatches is None


def test_search_result_with_highlights():
    s = SearchResult.model_validate(
        {
            "title": "Tích <b>phân</b>",
            "lastModified": 2.0,
            "titleHighlights": "Tích <b>phân</b>",
            "contentHighlights": None,
            "tagMatches": ["toán"],
        }
    )
    assert s.titleHighlights == "Tích <b>phân</b>"
    assert s.tagMatches == ["toán"]
