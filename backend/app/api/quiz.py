import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.deps import get_current_user
from app.db.session import get_db
from app.models.note import Note
from app.models.quiz import Quiz, QuizQuestion
from app.models.user import User
from app.schemas.quiz import QuizOut, QuizQuestionOut
from app.services import quizgen

router = APIRouter(tags=["quiz"])


async def _get_owner_note(db: AsyncSession, owner_id: uuid.UUID, title: str) -> Note | None:
    result = await db.execute(
        select(Note).where(Note.owner_id == owner_id, Note.title == title)
    )
    return result.scalar_one_or_none()


async def _get_owner_quiz(db: AsyncSession, owner_id: uuid.UUID, note_id: uuid.UUID) -> Quiz | None:
    result = await db.execute(
        select(Quiz).where(Quiz.owner_id == owner_id, Quiz.note_id == note_id)
    )
    return result.scalar_one_or_none()


def _note_not_found() -> HTTPException:
    return HTTPException(
        status_code=status.HTTP_404_NOT_FOUND,
        detail="The specified note cannot be found.",
    )


def _quiz_not_found() -> HTTPException:
    return HTTPException(
        status_code=status.HTTP_404_NOT_FOUND,
        detail="The specified note cannot be found.",
    )


def _generation_failed() -> HTTPException:
    return HTTPException(
        status_code=status.HTTP_502_BAD_GATEWAY,
        detail="Could not generate quiz questions.",
    )


async def _quiz_to_out(db: AsyncSession, quiz: Quiz) -> QuizOut:
    result = await db.execute(
        select(QuizQuestion)
        .where(QuizQuestion.quiz_id == quiz.id)
        .order_by(QuizQuestion.position, QuizQuestion.id)
    )
    questions = [
        QuizQuestionOut(
            id=q.id,
            position=q.position,
            prompt=q.prompt,
            options=q.options,
            correct_index=q.correct_index,
            explanation=q.explanation,
        )
        for q in result.scalars().all()
    ]
    return QuizOut(id=quiz.id, questions=questions)


@router.post("/notes/{title}/quiz", response_model=QuizOut)
async def generate_note_quiz(
    title: str,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
) -> QuizOut:
    note = await _get_owner_note(db, user.id, title)
    if note is None:
        raise _note_not_found()
    try:
        generated = await quizgen.generate_quiz_questions(note.content_text)
    except Exception as exc:
        raise _generation_failed() from exc

    await db.execute(delete(Quiz).where(Quiz.note_id == note.id, Quiz.owner_id == user.id))
    quiz = Quiz(note_id=note.id, owner_id=user.id)
    db.add(quiz)
    await db.flush()
    for position, item in enumerate(generated):
        db.add(
            QuizQuestion(
                quiz_id=quiz.id,
                position=position,
                prompt=item["prompt"],
                options=item["options"],
                correct_index=item["correct_index"],
                explanation=item["explanation"],
            )
        )
    await db.commit()
    await db.refresh(quiz)
    return await _quiz_to_out(db, quiz)


@router.get("/notes/{title}/quiz", response_model=QuizOut)
async def get_note_quiz(
    title: str,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
) -> QuizOut:
    note = await _get_owner_note(db, user.id, title)
    if note is None:
        raise _note_not_found()
    quiz = await _get_owner_quiz(db, user.id, note.id)
    if quiz is None:
        raise _quiz_not_found()
    return await _quiz_to_out(db, quiz)