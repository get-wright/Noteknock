import uuid

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