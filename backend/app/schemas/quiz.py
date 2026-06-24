import uuid

from pydantic import field_validator

from app.schemas.auth import CamelModel


class QuizQuestionOut(CamelModel):
    id: uuid.UUID
    position: int
    prompt: str
    options: list[str]
    correct_index: int
    explanation: str | None = None


class QuizOut(CamelModel):
    id: uuid.UUID
    questions: list[QuizQuestionOut]


class AttemptAnswerIn(CamelModel):
    question_id: uuid.UUID
    choice: int

    @field_validator("choice")
    @classmethod
    def validate_choice(cls, v: int) -> int:
        if v < 0 or v > 3:
            raise ValueError("choice must be between 0 and 3")
        return v


class AttemptCreate(CamelModel):
    answers: list[AttemptAnswerIn]


class AttemptAnswerOut(CamelModel):
    question_id: uuid.UUID
    choice: int
    correct: bool


class AttemptOut(CamelModel):
    id: uuid.UUID
    score: int
    total: int
    answers: list[AttemptAnswerOut]


class ReviewCreate(CamelModel):
    strength: int

    @field_validator("strength")
    @classmethod
    def validate_strength(cls, v: int) -> int:
        if v < 0 or v > 3:
            raise ValueError("strength must be between 0 and 3")
        return v


class ReviewEventOut(CamelModel):
    id: uuid.UUID
    note_id: uuid.UUID
    strength: int
    reviewed_at: float


class ReviewDueOut(CamelModel):
    note_id: uuid.UUID
    title: str
    subject: str | None
    strength: int
    last_reviewed: float | None


class ActivityOut(CamelModel):
    date: str
    notes_created: int
    quizzes_taken: int
    reviews_done: int


class HeatmapDay(CamelModel):
    date: str
    count: int


class StreakOut(CamelModel):
    current: int
    longest: int
    total: int
    heatmap: list[HeatmapDay]