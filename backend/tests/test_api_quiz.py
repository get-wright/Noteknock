import asyncio

import pytest


async def _create_note_with_content(
    client,
    token: str,
    title: str = "QuizNote",
    text: str = "Quán tính giữ vật chuyển động.",
) -> None:
    resp = await client.post(
        "/api/notes",
        json={
            "title": title,
            "content": [
                {"type": "paragraph", "content": [{"type": "text", "text": text}]}
            ],
        },
        headers={"Authorization": f"Bearer {token}"},
    )
    assert resp.status_code == 200


def _valid_quiz_json() -> str:
    return """[
      {
        "prompt": "Quán tính là gì?",
        "options": ["A", "B", "C", "D"],
        "correctIndex": 2,
        "explanation": "Định nghĩa cơ bản"
      },
      {
        "prompt": "Định luật I?",
        "options": ["1", "2", "3", "4"],
        "correctIndex": 0
      }
    ]"""


@pytest.mark.asyncio
async def test_quiz_generate_happy_path_persists_and_get(client, auth_token, monkeypatch):
    await _create_note_with_content(client, auth_token, "QuizHappy")

    async def fake_call_llm(prompt: str, system: str = "") -> str:
        assert "Quán tính giữ vật chuyển động." in prompt
        assert "multiple-choice" in prompt.lower() or "quiz" in prompt.lower()
        return _valid_quiz_json()

    monkeypatch.setattr("app.services.quizgen.call_llm", fake_call_llm)

    post = await client.post(
        "/api/notes/QuizHappy/quiz",
        headers={"Authorization": f"Bearer {auth_token}"},
    )
    assert post.status_code == 200
    body = post.json()
    assert "id" in body
    assert len(body["questions"]) == 2
    assert body["questions"][0]["prompt"] == "Quán tính là gì?"
    assert body["questions"][0]["correctIndex"] == 2
    assert "correct_index" not in body["questions"][0]
    assert body["questions"][0]["explanation"] == "Định nghĩa cơ bản"

    get_resp = await client.get(
        "/api/notes/QuizHappy/quiz",
        headers={"Authorization": f"Bearer {auth_token}"},
    )
    assert get_resp.status_code == 200
    assert get_resp.json()["id"] == body["id"]
    assert [q["id"] for q in get_resp.json()["questions"]] == [
        q["id"] for q in body["questions"]
    ]


@pytest.mark.asyncio
async def test_quiz_generate_missing_note_404(client, auth_token, monkeypatch):
    async def fake_call_llm(prompt: str, system: str = "") -> str:
        raise AssertionError("LLM should not be called for missing notes")

    monkeypatch.setattr("app.services.quizgen.call_llm", fake_call_llm)

    resp = await client.post(
        "/api/notes/Missing/quiz",
        headers={"Authorization": f"Bearer {auth_token}"},
    )
    assert resp.status_code == 404


@pytest.mark.asyncio
@pytest.mark.parametrize(
    "llm_response",
    ["not json", "[]", '[{"prompt":"","options":["a"],"correctIndex":0}]'],
)
async def test_quiz_generate_invalid_llm_response_502(
    client, auth_token, monkeypatch, llm_response
):
    await _create_note_with_content(client, auth_token, "QuizBad")

    async def fake_call_llm(prompt: str, system: str = "") -> str:
        return llm_response

    monkeypatch.setattr("app.services.quizgen.call_llm", fake_call_llm)

    resp = await client.post(
        "/api/notes/QuizBad/quiz",
        headers={"Authorization": f"Bearer {auth_token}"},
    )
    assert resp.status_code == 502


@pytest.mark.asyncio
async def test_quiz_generate_llm_error_502(client, auth_token, monkeypatch):
    await _create_note_with_content(client, auth_token, "QuizLLMError")

    async def fake_call_llm(prompt: str, system: str = "") -> str:
        raise RuntimeError("upstream unavailable")

    monkeypatch.setattr("app.services.quizgen.call_llm", fake_call_llm)

    resp = await client.post(
        "/api/notes/QuizLLMError/quiz",
        headers={"Authorization": f"Bearer {auth_token}"},
    )
    assert resp.status_code == 502


@pytest.mark.asyncio
async def test_quiz_regenerate_replaces_prior_questions(client, auth_token, monkeypatch):
    await _create_note_with_content(client, auth_token, "QuizRegen")

    async def first_call_llm(prompt: str, system: str = "") -> str:
        return _valid_quiz_json()

    monkeypatch.setattr("app.services.quizgen.call_llm", first_call_llm)
    first = await client.post(
        "/api/notes/QuizRegen/quiz",
        headers={"Authorization": f"Bearer {auth_token}"},
    )
    assert first.status_code == 200
    old_ids = {q["id"] for q in first.json()["questions"]}

    async def second_call_llm(prompt: str, system: str = "") -> str:
        return """```json
[
  {
    "prompt": "Câu mới?",
    "options": ["x", "y", "z", "w"],
    "correctIndex": 1,
    "explanation": "Giải thích mới"
  }
]
```"""

    monkeypatch.setattr("app.services.quizgen.call_llm", second_call_llm)
    second = await client.post(
        "/api/notes/QuizRegen/quiz",
        headers={"Authorization": f"Bearer {auth_token}"},
    )
    assert second.status_code == 200
    questions = second.json()["questions"]
    assert len(questions) == 1
    assert questions[0]["prompt"] == "Câu mới?"
    assert old_ids.isdisjoint({q["id"] for q in questions})


@pytest.mark.asyncio
async def test_quiz_get_missing_quiz_404(client, auth_token):
    await _create_note_with_content(client, auth_token, "NoQuizYet")

    resp = await client.get(
        "/api/notes/NoQuizYet/quiz",
        headers={"Authorization": f"Bearer {auth_token}"},
    )
    assert resp.status_code == 404


@pytest.mark.asyncio
async def test_quiz_auth_required(client):
    post_resp = await client.post("/api/notes/Any/quiz")
    get_resp = await client.get("/api/notes/Any/quiz")
    assert post_resp.status_code == 401
    assert get_resp.status_code == 401


@pytest.mark.asyncio
async def test_quiz_cross_user_isolation(client, auth_token, monkeypatch):
    await _create_note_with_content(client, auth_token, "PrivateQuiz")

    async def fake_call_llm(prompt: str, system: str = "") -> str:
        return _valid_quiz_json()

    monkeypatch.setattr("app.services.quizgen.call_llm", fake_call_llm)
    owner_post = await client.post(
        "/api/notes/PrivateQuiz/quiz",
        headers={"Authorization": f"Bearer {auth_token}"},
    )
    assert owner_post.status_code == 200

    resp_b = await client.post(
        "/api/register",
        json={"name": "B", "email": "quiz-b@test.com", "password": "secret123"},
    )
    token_b = resp_b.json()["access_token"]
    headers_b = {"Authorization": f"Bearer {token_b}"}

    assert (
        await client.get("/api/notes/PrivateQuiz/quiz", headers=headers_b)
    ).status_code == 404
    assert (
        await client.post("/api/notes/PrivateQuiz/quiz", headers=headers_b)
    ).status_code == 404


@pytest.mark.asyncio
async def test_quiz_concurrent_generate_both_succeed_single_quiz(
    client, auth_token, monkeypatch
):
    await _create_note_with_content(client, auth_token, "QuizConcurrent")

    async def fake_call_llm(prompt: str, system: str = "") -> str:
        await asyncio.sleep(0.05)
        return _valid_quiz_json()

    monkeypatch.setattr("app.services.quizgen.call_llm", fake_call_llm)
    headers = {"Authorization": f"Bearer {auth_token}"}

    resp_a, resp_b = await asyncio.gather(
        client.post("/api/notes/QuizConcurrent/quiz", headers=headers),
        client.post("/api/notes/QuizConcurrent/quiz", headers=headers),
    )

    assert resp_a.status_code == 200
    assert resp_b.status_code == 200
    get_resp = await client.get("/api/notes/QuizConcurrent/quiz", headers=headers)
    assert get_resp.status_code == 200
    assert len(get_resp.json()["questions"]) == 2