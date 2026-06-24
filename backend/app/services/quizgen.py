import json
from typing import Any, TypedDict

from app.services.llm import call_llm


class GeneratedQuestion(TypedDict):
    prompt: str
    options: list[str]
    correct_index: int
    explanation: str | None


def _extract_json_array(text: str) -> list[Any]:
    stripped = text.strip()
    if stripped.startswith("```"):
        lines = stripped.splitlines()
        if lines and lines[0].startswith("```"):
            lines = lines[1:]
        if lines and lines[-1].strip() == "```":
            lines = lines[:-1]
        stripped = "\n".join(lines).strip()
    start = stripped.find("[")
    end = stripped.rfind("]")
    if start == -1 or end == -1 or end < start:
        raise ValueError("LLM response did not contain a JSON array")
    parsed = json.loads(stripped[start : end + 1])
    if not isinstance(parsed, list) or not parsed:
        raise ValueError("LLM response JSON array must be non-empty")
    return parsed


def _normalize_question(raw: Any, index: int) -> GeneratedQuestion:
    if not isinstance(raw, dict):
        raise ValueError(f"Question {index} must be an object")
    prompt = raw.get("prompt")
    if not isinstance(prompt, str) or not prompt.strip():
        raise ValueError(f"Question {index} must have a non-empty prompt")
    options = raw.get("options")
    if (
        not isinstance(options, list)
        or len(options) != 4
        or any(not isinstance(opt, str) or not opt.strip() for opt in options)
    ):
        raise ValueError(f"Question {index} must have exactly 4 non-empty string options")
    correct = raw.get("correctIndex", raw.get("correct_index"))
    if not isinstance(correct, int) or correct < 0 or correct > 3:
        raise ValueError(f"Question {index} must have correctIndex between 0 and 3")
    explanation = raw.get("explanation")
    if explanation is not None and (not isinstance(explanation, str) or not explanation.strip()):
        raise ValueError(f"Question {index} explanation must be a non-empty string when provided")
    return {
        "prompt": prompt.strip(),
        "options": [opt.strip() for opt in options],
        "correct_index": correct,
        "explanation": explanation.strip() if isinstance(explanation, str) else None,
    }


def _parse_questions(text: str) -> list[GeneratedQuestion]:
    items = _extract_json_array(text)
    return [_normalize_question(item, i) for i, item in enumerate(items)]


async def generate_quiz_questions(content_text: str, count: int = 5) -> list[GeneratedQuestion]:
    prompt = (
        f"Create {count} multiple-choice quiz questions from this study note. "
        "Each question must have exactly 4 answer options and one correct answer. "
        "Return a JSON array of objects with keys: prompt (string), options (array of 4 strings), "
        "correctIndex (integer 0-3), explanation (optional string in Vietnamese).\n\n"
        f"Note content:\n{content_text}"
    )
    response = await call_llm(
        prompt,
        system="You write Vietnamese multiple-choice study quiz questions from notes.",
    )
    return _parse_questions(response)