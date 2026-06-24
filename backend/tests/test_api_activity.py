from datetime import datetime, time, timedelta, timezone

import pytest
from sqlalchemy import select, update

from app.models.note import Note
from app.models.quiz import ReviewEvent


async def _register(client, email: str) -> str:
    resp = await client.post(
        "/api/register",
        json={"name": "U", "email": email, "password": "secret123"},
    )
    assert resp.status_code == 200
    return resp.json()["access_token"]


async def _create_note(client, token: str, title: str) -> None:
    resp = await client.post(
        "/api/notes",
        json={
            "title": title,
            "content": [
                {"type": "paragraph", "content": [{"type": "text", "text": "Nội dung học."}]}
            ],
        },
        headers={"Authorization": f"Bearer {token}"},
    )
    assert resp.status_code == 200


def _quiz_json() -> str:
    return """[
      {"prompt": "Q1?", "options": ["a","b","c","d"], "correctIndex": 1},
      {"prompt": "Q2?", "options": ["a","b","c","d"], "correctIndex": 0}
    ]"""


async def _quiz_for_note(client, token: str, title: str, monkeypatch) -> dict:
    async def fake_llm(prompt: str, system: str = "") -> str:
        return _quiz_json()

    monkeypatch.setattr("app.services.quizgen.call_llm", fake_llm)
    resp = await client.post(
        f"/api/notes/{title}/quiz",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert resp.status_code == 200
    return resp.json()


@pytest.mark.asyncio
async def test_attempt_happy_path(client, auth_token, monkeypatch):
    await _create_note(client, auth_token, "AttemptNote")
    quiz = await _quiz_for_note(client, auth_token, "AttemptNote", monkeypatch)
    q0, q1 = quiz["questions"][0]["id"], quiz["questions"][1]["id"]

    resp = await client.post(
        f"/api/quizzes/{quiz['id']}/attempts",
        json={
            "answers": [
                {"questionId": q0, "choice": 1},
                {"questionId": q1, "choice": 0},
            ]
        },
        headers={"Authorization": f"Bearer {auth_token}"},
    )
    assert resp.status_code == 200
    body = resp.json()
    assert body["score"] == 2
    assert body["total"] == 2
    assert len(body["answers"]) == 2
    assert all(a["correct"] for a in body["answers"])


@pytest.mark.asyncio
async def test_attempt_quiz_not_found_404(client, auth_token):
    import uuid

    resp = await client.post(
        f"/api/quizzes/{uuid.uuid4()}/attempts",
        json={"answers": []},
        headers={"Authorization": f"Bearer {auth_token}"},
    )
    assert resp.status_code == 404


@pytest.mark.asyncio
async def test_attempt_invalid_question_400(client, auth_token, monkeypatch):
    await _create_note(client, auth_token, "BadAttempt")
    quiz = await _quiz_for_note(client, auth_token, "BadAttempt", monkeypatch)
    import uuid

    resp = await client.post(
        f"/api/quizzes/{quiz['id']}/attempts",
        json={"answers": [{"questionId": str(uuid.uuid4()), "choice": 0}]},
        headers={"Authorization": f"Bearer {auth_token}"},
    )
    assert resp.status_code == 400


@pytest.mark.asyncio
async def test_review_create_and_note_missing_404(client, auth_token):
    ok = await client.post(
        "/api/notes/ReviewNote/review",
        json={"strength": 2},
        headers={"Authorization": f"Bearer {auth_token}"},
    )
    assert ok.status_code == 404

    await _create_note(client, auth_token, "ReviewNote")
    ok = await client.post(
        "/api/notes/ReviewNote/review",
        json={"strength": 2},
        headers={"Authorization": f"Bearer {auth_token}"},
    )
    assert ok.status_code == 200
    body = ok.json()
    assert body["strength"] == 2
    assert "reviewedAt" in body
    assert "noteId" in body


@pytest.mark.asyncio
async def test_review_due_never_reviewed_and_overdue(client, auth_token, db):
    await _create_note(client, auth_token, "DueFresh")
    await _create_note(client, auth_token, "DueOld")

    note_old = (
        await db.execute(select(Note).where(Note.title == "DueOld"))
    ).scalar_one()

    event = ReviewEvent(
        note_id=note_old.id,
        owner_id=note_old.owner_id,
        strength=1,
        reviewed_at=datetime.now(timezone.utc) - timedelta(days=2),
    )
    db.add(event)
    await db.commit()

    resp = await client.get(
        "/api/review/due",
        headers={"Authorization": f"Bearer {auth_token}"},
    )
    assert resp.status_code == 200
    titles = {row["title"] for row in resp.json()}
    assert "DueFresh" in titles
    assert "DueOld" in titles


@pytest.mark.asyncio
async def test_review_due_not_listed_when_recently_reviewed(client, auth_token):
    await _create_note(client, auth_token, "NotDue")
    await client.post(
        "/api/notes/NotDue/review",
        json={"strength": 3},
        headers={"Authorization": f"Bearer {auth_token}"},
    )
    resp = await client.get(
        "/api/review/due",
        headers={"Authorization": f"Bearer {auth_token}"},
    )
    titles = {row["title"] for row in resp.json()}
    assert "NotDue" not in titles


@pytest.mark.asyncio
async def test_activity_aggregates_three_sources(client, auth_token, monkeypatch, db):
    await _create_note(client, auth_token, "ActNote")
    quiz = await _quiz_for_note(client, auth_token, "ActNote", monkeypatch)
    qid = quiz["questions"][0]["id"]
    await client.post(
        f"/api/quizzes/{quiz['id']}/attempts",
        json={"answers": [{"questionId": qid, "choice": 1}]},
        headers={"Authorization": f"Bearer {auth_token}"},
    )
    await client.post(
        "/api/notes/ActNote/review",
        json={"strength": 1},
        headers={"Authorization": f"Bearer {auth_token}"},
    )

    resp = await client.get(
        "/api/activity",
        headers={"Authorization": f"Bearer {auth_token}"},
    )
    assert resp.status_code == 200
    rows = resp.json()
    assert len(rows) >= 1
    day = rows[-1]
    assert day["notesCreated"] >= 1
    assert day["quizzesTaken"] >= 1
    assert day["reviewsDone"] >= 1


@pytest.mark.asyncio
async def test_streak_consecutive_and_gap_resets_current(client, auth_token, db):
    await _create_note(client, auth_token, "StreakA")
    note = (await db.execute(select(Note).where(Note.title == "StreakA"))).scalar_one()
    today = datetime.now(timezone.utc).date()
    d0 = today - timedelta(days=4)
    d1 = today - timedelta(days=3)
    d_gap = today - timedelta(days=1)

    await db.execute(
        update(Note)
        .where(Note.id == note.id)
        .values(created_at=datetime.combine(d0, time.min, tzinfo=timezone.utc))
    )
    db.add(
        ReviewEvent(
            note_id=note.id,
            owner_id=note.owner_id,
            strength=1,
            reviewed_at=datetime.combine(d1, time.min, tzinfo=timezone.utc),
        )
    )
    db.add(
        ReviewEvent(
            note_id=note.id,
            owner_id=note.owner_id,
            strength=1,
            reviewed_at=datetime.combine(d_gap, time.min, tzinfo=timezone.utc),
        )
    )
    await db.commit()

    resp = await client.get(
        "/api/streak",
        headers={"Authorization": f"Bearer {auth_token}"},
    )
    assert resp.status_code == 200
    body = resp.json()
    assert body["longest"] >= 2
    assert body["total"] >= 3
    assert body["current"] in (0, 1)


@pytest.mark.asyncio
async def test_attempt_cross_user_isolation(client, auth_token, monkeypatch):
    await _create_note(client, auth_token, "IsoQuiz")
    quiz = await _quiz_for_note(client, auth_token, "IsoQuiz", monkeypatch)
    other = await _register(client, "other-attempt@test.com")
    qid = quiz["questions"][0]["id"]
    resp = await client.post(
        f"/api/quizzes/{quiz['id']}/attempts",
        json={"answers": [{"questionId": qid, "choice": 0}]},
        headers={"Authorization": f"Bearer {other}"},
    )
    assert resp.status_code == 404


@pytest.mark.asyncio
async def test_activity_auth_required(client):
    assert (await client.get("/api/activity")).status_code == 401
    assert (await client.get("/api/streak")).status_code == 401