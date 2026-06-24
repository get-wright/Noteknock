import uuid

from app.models.quiz import Quiz, QuizAttempt, QuizQuestion, ReviewEvent


def test_quiz_creates_with_required_fields():
    note_id = uuid.uuid4()
    owner_id = uuid.uuid4()
    q = Quiz(note_id=note_id, owner_id=owner_id)
    assert q.note_id == note_id
    assert q.owner_id == owner_id
    assert q.id is None


def test_quiz_question_creates_with_required_fields():
    quiz_id = uuid.uuid4()
    qq = QuizQuestion(
        quiz_id=quiz_id,
        position=0,
        prompt="Câu hỏi?",
        options=["A", "B", "C", "D"],
        correct_index=1,
        explanation="Vì sao",
    )
    assert qq.quiz_id == quiz_id
    assert qq.position == 0
    assert qq.prompt == "Câu hỏi?"
    assert qq.options == ["A", "B", "C", "D"]
    assert qq.correct_index == 1
    assert qq.explanation == "Vì sao"
    assert qq.id is None


def test_quiz_attempt_creates_with_required_fields():
    quiz_id = uuid.uuid4()
    owner_id = uuid.uuid4()
    answers = [{"questionId": str(uuid.uuid4()), "choice": 0, "correct": True}]
    a = QuizAttempt(quiz_id=quiz_id, owner_id=owner_id, score=1, total=1, answers=answers)
    assert a.quiz_id == quiz_id
    assert a.owner_id == owner_id
    assert a.score == 1
    assert a.total == 1
    assert a.answers == answers
    assert a.id is None


def test_review_event_creates_with_required_fields():
    note_id = uuid.uuid4()
    owner_id = uuid.uuid4()
    e = ReviewEvent(note_id=note_id, owner_id=owner_id, strength=2)
    assert e.note_id == note_id
    assert e.owner_id == owner_id
    assert e.strength == 2
    assert e.id is None