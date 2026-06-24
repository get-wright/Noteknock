from app.services.llm import parse_chat_completion


def test_parse_chat_completion_ignores_sse_done_trailer():
    raw = (
        '{"choices":[{"message":{"content":"[\\"Một\\",\\"Hai\\"]"}}]}'
        "\n"
        "data: [DONE]\n"
    )

    assert parse_chat_completion(raw) == '["Một","Hai"]'
