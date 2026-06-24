import uuid
from datetime import date, datetime, time, timezone

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.deps import get_current_user
from app.db.session import get_db
from app.models.note import Note
from app.models.quiz import Quiz, QuizAttempt, QuizQuestion, ReviewEvent
from app.models.user import User
from app.schemas.quiz import (
    ActivityOut,
    AttemptCreate,
    AttemptOut,
    AttemptAnswerOut,
    HeatmapDay,
    ReviewCreate,
    ReviewDueOut,
    ReviewEventOut,
    StreakOut,
)
from app.services.streak import ActivityDay, compute_streak_stats, merge_activity_rows, review_interval_days

router = APIRouter(tags=["activity"])


def _note_not_found() -> HTTPException:
    return HTTPException(
        status_code=status.HTTP_404_NOT_FOUND,
        detail="The specified note cannot be found.",
    )


def _quiz_not_found() -> HTTPException:
    return HTTPException(
        status_code=status.HTTP_404_NOT_FOUND,
        detail="The specified quiz cannot be found.",
    )


async def _get_owner_note(db: AsyncSession, owner_id: uuid.UUID, title: str) -> Note | None:
    result = await db.execute(
        select(Note).where(Note.owner_id == owner_id, Note.title == title)
    )
    return result.scalar_one_or_none()


async def _get_owner_quiz(db: AsyncSession, owner_id: uuid.UUID, quiz_id: uuid.UUID) -> Quiz | None:
    result = await db.execute(
        select(Quiz).where(Quiz.id == quiz_id, Quiz.owner_id == owner_id)
    )
    return result.scalar_one_or_none()


def _parse_iso_date(value: str | None, default: date | None) -> date | None:
    if value is None:
        return default
    try:
        return date.fromisoformat(value)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail="Invalid date format. Use YYYY-MM-DD.") from exc


@router.post("/quizzes/{quiz_id}/attempts", response_model=AttemptOut)
async def create_quiz_attempt(
    quiz_id: uuid.UUID,
    body: AttemptCreate,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
) -> AttemptOut:
    quiz = await _get_owner_quiz(db, user.id, quiz_id)
    if quiz is None:
        raise _quiz_not_found()

    result = await db.execute(
        select(QuizQuestion).where(QuizQuestion.quiz_id == quiz.id)
    )
    questions = list(result.scalars().all())
    if not questions:
        raise HTTPException(status_code=400, detail="Quiz has no questions.")

    by_id = {q.id: q for q in questions}
    seen: set[uuid.UUID] = set()
    for answer in body.answers:
        if answer.question_id not in by_id:
            raise HTTPException(status_code=400, detail="Invalid question id in answers.")
        if answer.question_id in seen:
            raise HTTPException(status_code=400, detail="Duplicate question id in answers.")
        seen.add(answer.question_id)

    scored: list[AttemptAnswerOut] = []
    score = 0
    for answer in body.answers:
        question = by_id[answer.question_id]
        correct = answer.choice == question.correct_index
        if correct:
            score += 1
        scored.append(
            AttemptAnswerOut(
                question_id=answer.question_id,
                choice=answer.choice,
                correct=correct,
            )
        )

    stored_answers = [
        {
            "questionId": str(a.question_id),
            "choice": a.choice,
            "correct": a.correct,
        }
        for a in scored
    ]
    attempt = QuizAttempt(
        quiz_id=quiz.id,
        owner_id=user.id,
        score=score,
        total=len(questions),
        answers=stored_answers,
    )
    db.add(attempt)
    await db.commit()
    await db.refresh(attempt)
    return AttemptOut(
        id=attempt.id,
        score=attempt.score,
        total=attempt.total,
        answers=scored,
    )


@router.post("/notes/{title}/review", response_model=ReviewEventOut)
async def create_review_event(
    title: str,
    body: ReviewCreate,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
) -> ReviewEventOut:
    note = await _get_owner_note(db, user.id, title)
    if note is None:
        raise _note_not_found()

    event = ReviewEvent(
        note_id=note.id,
        owner_id=user.id,
        strength=body.strength,
    )
    db.add(event)
    await db.commit()
    await db.refresh(event)
    return ReviewEventOut(
        id=event.id,
        note_id=event.note_id,
        strength=event.strength,
        reviewed_at=event.reviewed_at.timestamp(),
    )


@router.get("/review/due", response_model=list[ReviewDueOut])
async def list_due_reviews(
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
) -> list[ReviewDueOut]:
    now = datetime.now(timezone.utc)

    notes_result = await db.execute(select(Note).where(Note.owner_id == user.id))
    notes = list(notes_result.scalars().all())
    if not notes:
        return []

    note_ids = [n.id for n in notes]

    latest_subq = (
        select(
            ReviewEvent.note_id,
            func.max(ReviewEvent.reviewed_at).label("max_reviewed_at"),
        )
        .where(ReviewEvent.owner_id == user.id, ReviewEvent.note_id.in_(note_ids))
        .group_by(ReviewEvent.note_id)
        .subquery()
    )
    events_result = await db.execute(
        select(ReviewEvent)
        .join(
            latest_subq,
            (ReviewEvent.note_id == latest_subq.c.note_id)
            & (ReviewEvent.reviewed_at == latest_subq.c.max_reviewed_at),
        )
        .where(ReviewEvent.owner_id == user.id)
    )
    latest_by_note = {e.note_id: e for e in events_result.scalars().all()}

    due: list[ReviewDueOut] = []
    for note in notes:
        latest = latest_by_note.get(note.id)
        if latest is None:
            due.append(
                ReviewDueOut(
                    note_id=note.id,
                    title=note.title,
                    subject=note.subject,
                    strength=0,
                    last_reviewed=None,
                )
            )
            continue
        interval_days = review_interval_days(latest.strength)
        elapsed = now - latest.reviewed_at
        if elapsed.total_seconds() >= interval_days * 86400:
            due.append(
                ReviewDueOut(
                    note_id=note.id,
                    title=note.title,
                    subject=note.subject,
                    strength=latest.strength,
                    last_reviewed=latest.reviewed_at.timestamp(),
                )
            )
    due.sort(key=lambda item: (item.last_reviewed is not None, item.title))
    return due


async def _collect_activity(
    db: AsyncSession,
    owner_id: uuid.UUID,
    from_day: date | None,
    to_day: date | None,
) -> list[ActivityDay]:
    rows: list[ActivityDay] = []

    note_day = func.date_trunc("day", Note.created_at).label("day")
    notes_q = select(note_day, func.count().label("cnt")).where(Note.owner_id == owner_id)
    if from_day is not None:
        notes_q = notes_q.where(Note.created_at >= datetime.combine(from_day, time.min, tzinfo=timezone.utc))
    if to_day is not None:
        end = datetime.combine(to_day, time.max, tzinfo=timezone.utc)
        notes_q = notes_q.where(Note.created_at <= end)
    notes_q = notes_q.group_by(note_day)
    for day, cnt in (await db.execute(notes_q)).all():
        rows.append(
            ActivityDay(
                day=day.date() if hasattr(day, "date") else day,
                notes_created=int(cnt),
            )
        )

    attempt_day = func.date_trunc("day", QuizAttempt.taken_at).label("day")
    attempts_q = select(attempt_day, func.count().label("cnt")).where(
        QuizAttempt.owner_id == owner_id
    )
    if from_day is not None:
        attempts_q = attempts_q.where(
            QuizAttempt.taken_at >= datetime.combine(from_day, time.min, tzinfo=timezone.utc)
        )
    if to_day is not None:
        attempts_q = attempts_q.where(
            QuizAttempt.taken_at <= datetime.combine(to_day, time.max, tzinfo=timezone.utc)
        )
    attempts_q = attempts_q.group_by(attempt_day)
    for day, cnt in (await db.execute(attempts_q)).all():
        rows.append(
            ActivityDay(
                day=day.date() if hasattr(day, "date") else day,
                quizzes_taken=int(cnt),
            )
        )

    review_day = func.date_trunc("day", ReviewEvent.reviewed_at).label("day")
    reviews_q = select(review_day, func.count().label("cnt")).where(
        ReviewEvent.owner_id == owner_id
    )
    if from_day is not None:
        reviews_q = reviews_q.where(
            ReviewEvent.reviewed_at >= datetime.combine(from_day, time.min, tzinfo=timezone.utc)
        )
    if to_day is not None:
        reviews_q = reviews_q.where(
            ReviewEvent.reviewed_at <= datetime.combine(to_day, time.max, tzinfo=timezone.utc)
        )
    reviews_q = reviews_q.group_by(review_day)
    for day, cnt in (await db.execute(reviews_q)).all():
        rows.append(
            ActivityDay(
                day=day.date() if hasattr(day, "date") else day,
                reviews_done=int(cnt),
            )
        )

    return merge_activity_rows(rows)


@router.get("/activity", response_model=list[ActivityOut])
async def get_activity(
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
    from_date: str | None = Query(default=None, alias="from"),
    to_date: str | None = Query(default=None, alias="to"),
) -> list[ActivityOut]:
    from_day = _parse_iso_date(from_date, None)
    to_day = _parse_iso_date(to_date, None)
    merged = await _collect_activity(db, user.id, from_day, to_day)
    return [
        ActivityOut(
            date=r.day.isoformat(),
            notes_created=r.notes_created,
            quizzes_taken=r.quizzes_taken,
            reviews_done=r.reviews_done,
        )
        for r in merged
    ]


@router.get("/streak", response_model=StreakOut)
async def get_streak(
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
) -> StreakOut:
    merged = await _collect_activity(db, user.id, None, None)
    today = datetime.now(timezone.utc).date()
    current, longest, total, heatmap = compute_streak_stats(merged, today)
    return StreakOut(
        current=current,
        longest=longest,
        total=total,
        heatmap=[HeatmapDay(date=d.isoformat(), count=c) for d, c in heatmap],
    )