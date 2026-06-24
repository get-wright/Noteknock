import pytest

from app.services.quizgen import _parse_questions


def test_parse_questions_accepts_correct_index_snake_case():
    raw = '[{"prompt": "Q?", "options": ["a", "b", "c", "d"], "correct_index": 3}]'
    out = _parse_questions(raw)
    assert out[0]["correct_index"] == 3


@pytest.mark.parametrize("bad", ["{}", "not array", '[{"options":["a"],"correctIndex":0}]'])
def test_parse_questions_rejects_invalid(bad: str):
    with pytest.raises(ValueError):
        _parse_questions(bad)