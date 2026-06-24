import pytest


async def _create_note(client, token: str, title: str = "Recall") -> None:
    resp = await client.post(
        "/api/notes",
        json={"title": title},
        headers={"Authorization": f"Bearer {token}"},
    )
    assert resp.status_code == 200


async def _create_recall_item(client, token: str, title: str, content: str):
    return await client.post(
        f"/api/notes/{title}/recall",
        json={"content": content},
        headers={"Authorization": f"Bearer {token}"},
    )


async def _create_note_with_content(
    client,
    token: str,
    title: str = "RecallAI",
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


@pytest.mark.asyncio
async def test_recall_crud_happy_path_returns_camel_case_and_manual_source(client, auth_token):
    await _create_note(client, auth_token)

    create = await _create_recall_item(client, auth_token, "Recall", "Define inertia")

    assert create.status_code == 200
    item = create.json()
    assert item["content"] == "Define inertia"
    assert item["position"] == 0
    assert item["checked"] is False
    assert item["source"] == "manual"
    assert isinstance(item["createdAt"], float)
    assert "created_at" not in item

    list_resp = await client.get(
        "/api/notes/Recall/recall",
        headers={"Authorization": f"Bearer {auth_token}"},
    )
    assert list_resp.status_code == 200
    assert list_resp.json() == [item]

    patch = await client.patch(
        f"/api/notes/Recall/recall/{item['id']}",
        json={"content": "Define Newton's first law", "checked": True, "position": 4},
        headers={"Authorization": f"Bearer {auth_token}"},
    )
    assert patch.status_code == 200
    patched = patch.json()
    assert patched["content"] == "Define Newton's first law"
    assert patched["checked"] is True
    assert patched["position"] == 4
    assert patched["source"] == "manual"

    delete = await client.delete(
        f"/api/notes/Recall/recall/{item['id']}",
        headers={"Authorization": f"Bearer {auth_token}"},
    )
    assert delete.status_code == 200
    assert delete.json() is None

    list_after_delete = await client.get(
        "/api/notes/Recall/recall",
        headers={"Authorization": f"Bearer {auth_token}"},
    )
    assert list_after_delete.status_code == 200
    assert list_after_delete.json() == []


@pytest.mark.asyncio
async def test_recall_items_order_by_position_then_creation(client, auth_token):
    await _create_note(client, auth_token, "Ordering")
    first = await _create_recall_item(client, auth_token, "Ordering", "first")
    second = await _create_recall_item(client, auth_token, "Ordering", "second")
    third = await _create_recall_item(client, auth_token, "Ordering", "third")
    assert first.status_code == 200
    assert second.status_code == 200
    assert third.status_code == 200

    third_patch = await client.patch(
        f"/api/notes/Ordering/recall/{third.json()['id']}",
        json={"position": 0},
        headers={"Authorization": f"Bearer {auth_token}"},
    )
    second_patch = await client.patch(
        f"/api/notes/Ordering/recall/{second.json()['id']}",
        json={"position": 2},
        headers={"Authorization": f"Bearer {auth_token}"},
    )
    assert third_patch.status_code == 200
    assert second_patch.status_code == 200

    resp = await client.get(
        "/api/notes/Ordering/recall",
        headers={"Authorization": f"Bearer {auth_token}"},
    )
    assert resp.status_code == 200
    assert [item["content"] for item in resp.json()] == ["first", "third", "second"]


@pytest.mark.asyncio
async def test_recall_patch_partial_update_preserves_unspecified_fields(client, auth_token):
    await _create_note(client, auth_token, "Partial")
    create = await _create_recall_item(client, auth_token, "Partial", "Original")
    item = create.json()

    resp = await client.patch(
        f"/api/notes/Partial/recall/{item['id']}",
        json={"checked": True},
        headers={"Authorization": f"Bearer {auth_token}"},
    )

    assert resp.status_code == 200
    patched = resp.json()
    assert patched["content"] == "Original"
    assert patched["position"] == 0
    assert patched["checked"] is True


@pytest.mark.asyncio
async def test_recall_patch_rejects_explicit_null_fields(client, auth_token):
    await _create_note(client, auth_token, "NullPatch")
    create = await _create_recall_item(client, auth_token, "NullPatch", "Original")
    item = create.json()
    headers = {"Authorization": f"Bearer {auth_token}"}

    for field in ["content", "checked", "position"]:
        resp = await client.patch(
            f"/api/notes/NullPatch/recall/{item['id']}",
            json={field: None},
            headers=headers,
        )
        assert resp.status_code == 400

    unchanged = await client.get("/api/notes/NullPatch/recall", headers=headers)
    assert unchanged.status_code == 200
    assert unchanged.json()[0]["content"] == "Original"
    assert unchanged.json()[0]["checked"] is False
    assert unchanged.json()[0]["position"] == 0


@pytest.mark.asyncio
async def test_recall_missing_note_404(client, auth_token):
    headers = {"Authorization": f"Bearer {auth_token}"}

    get_resp = await client.get("/api/notes/Missing/recall", headers=headers)
    post_resp = await client.post(
        "/api/notes/Missing/recall", json={"content": "x"}, headers=headers
    )
    patch_resp = await client.patch(
        "/api/notes/Missing/recall/00000000-0000-0000-0000-000000000000",
        json={"checked": True},
        headers=headers,
    )
    delete_resp = await client.delete(
        "/api/notes/Missing/recall/00000000-0000-0000-0000-000000000000",
        headers=headers,
    )

    assert get_resp.status_code == 404
    assert post_resp.status_code == 404
    assert patch_resp.status_code == 404
    assert delete_resp.status_code == 404


@pytest.mark.asyncio
async def test_recall_cross_user_isolation_for_get_patch_delete(client, auth_token):
    await _create_note(client, auth_token, "Private")
    item_resp = await _create_recall_item(client, auth_token, "Private", "secret")
    item_id = item_resp.json()["id"]

    resp_b = await client.post(
        "/api/register",
        json={"name": "B", "email": "recall-b@test.com", "password": "secret123"},
    )
    token_b = resp_b.json()["access_token"]
    headers_b = {"Authorization": f"Bearer {token_b}"}

    get_resp = await client.get("/api/notes/Private/recall", headers=headers_b)
    patch_resp = await client.patch(
        f"/api/notes/Private/recall/{item_id}", json={"checked": True}, headers=headers_b
    )
    delete_resp = await client.delete(f"/api/notes/Private/recall/{item_id}", headers=headers_b)

    assert get_resp.status_code == 404
    assert patch_resp.status_code == 404
    assert delete_resp.status_code == 404

    owner_get = await client.get(
        "/api/notes/Private/recall",
        headers={"Authorization": f"Bearer {auth_token}"},
    )
    assert owner_get.status_code == 200
    assert owner_get.json()[0]["checked"] is False


@pytest.mark.asyncio
async def test_recall_item_id_must_be_under_note(client, auth_token):
    await _create_note(client, auth_token, "A")
    await _create_note(client, auth_token, "B")
    item_resp = await _create_recall_item(client, auth_token, "A", "belongs to A")
    item_id = item_resp.json()["id"]
    headers = {"Authorization": f"Bearer {auth_token}"}

    patch_resp = await client.patch(
        f"/api/notes/B/recall/{item_id}", json={"checked": True}, headers=headers
    )
    delete_resp = await client.delete(f"/api/notes/B/recall/{item_id}", headers=headers)

    assert patch_resp.status_code == 404
    assert delete_resp.status_code == 404


@pytest.mark.asyncio
async def test_recall_auth_required(client):
    get_resp = await client.get("/api/notes/Any/recall")
    post_resp = await client.post("/api/notes/Any/recall", json={"content": "x"})
    patch_resp = await client.patch(
        "/api/notes/Any/recall/00000000-0000-0000-0000-000000000000",
        json={"checked": True},
    )
    delete_resp = await client.delete(
        "/api/notes/Any/recall/00000000-0000-0000-0000-000000000000"
    )

    assert get_resp.status_code == 401
    assert post_resp.status_code == 401
    assert patch_resp.status_code == 401
    assert delete_resp.status_code == 401


@pytest.mark.asyncio
async def test_recall_generate_happy_path_appends_ai_after_manual(
    client, auth_token, monkeypatch
):
    await _create_note_with_content(client, auth_token, "RecallAI")
    manual = await _create_recall_item(client, auth_token, "RecallAI", "Manual first")

    async def fake_call_llm(prompt: str, system: str = "") -> str:
        assert "Quán tính giữ vật chuyển động." in prompt
        assert "Extract 3-5 key points" in prompt
        assert "Vietnamese" in system or "Việt" in system
        return '["Nhớ khái niệm quán tính", "Liên hệ định luật I Newton"]'

    monkeypatch.setattr("app.api.recall.call_llm", fake_call_llm)

    resp = await client.post(
        "/api/notes/RecallAI/recall/generate",
        headers={"Authorization": f"Bearer {auth_token}"},
    )

    assert resp.status_code == 200
    items = resp.json()
    assert [item["content"] for item in items] == [
        "Manual first",
        "Nhớ khái niệm quán tính",
        "Liên hệ định luật I Newton",
    ]
    assert [item["source"] for item in items] == ["manual", "ai", "ai"]
    assert [item["position"] for item in items] == [0, 1, 2]
    assert items[0]["id"] == manual.json()["id"]


@pytest.mark.asyncio
async def test_recall_generate_replaces_prior_ai_preserving_manual(
    client, auth_token, monkeypatch
):
    await _create_note_with_content(client, auth_token, "ReplaceAI")
    manual = await _create_recall_item(client, auth_token, "ReplaceAI", "Manual stable")

    async def first_call_llm(prompt: str, system: str = "") -> str:
        return '["Old AI"]'

    monkeypatch.setattr("app.api.recall.call_llm", first_call_llm)
    first = await client.post(
        "/api/notes/ReplaceAI/recall/generate",
        headers={"Authorization": f"Bearer {auth_token}"},
    )
    assert first.status_code == 200
    old_ai_id = first.json()[1]["id"]

    async def second_call_llm(prompt: str, system: str = "") -> str:
        return "```json\n[\"New AI 1\", \"New AI 2\"]\n```"

    monkeypatch.setattr("app.api.recall.call_llm", second_call_llm)
    second = await client.post(
        "/api/notes/ReplaceAI/recall/generate",
        headers={"Authorization": f"Bearer {auth_token}"},
    )

    assert second.status_code == 200
    items = second.json()
    assert [item["content"] for item in items] == [
        "Manual stable",
        "New AI 1",
        "New AI 2",
    ]
    assert items[0]["id"] == manual.json()["id"]
    assert old_ai_id not in {item["id"] for item in items}


@pytest.mark.asyncio
async def test_recall_generate_missing_note_404(client, auth_token, monkeypatch):
    async def fake_call_llm(prompt: str, system: str = "") -> str:
        raise AssertionError("LLM should not be called for missing notes")

    monkeypatch.setattr("app.api.recall.call_llm", fake_call_llm)

    resp = await client.post(
        "/api/notes/Missing/recall/generate",
        headers={"Authorization": f"Bearer {auth_token}"},
    )

    assert resp.status_code == 404


@pytest.mark.asyncio
@pytest.mark.parametrize("llm_response", ["not json", "[]", '["", 42]'])
async def test_recall_generate_invalid_llm_response_502(
    client, auth_token, monkeypatch, llm_response
):
    await _create_note_with_content(client, auth_token, "BadAI")

    async def fake_call_llm(prompt: str, system: str = "") -> str:
        return llm_response

    monkeypatch.setattr("app.api.recall.call_llm", fake_call_llm)

    resp = await client.post(
        "/api/notes/BadAI/recall/generate",
        headers={"Authorization": f"Bearer {auth_token}"},
    )

    assert resp.status_code == 502


@pytest.mark.asyncio
async def test_recall_generate_llm_error_502(client, auth_token, monkeypatch):
    await _create_note_with_content(client, auth_token, "LLMError")

    async def fake_call_llm(prompt: str, system: str = "") -> str:
        raise RuntimeError("upstream unavailable")

    monkeypatch.setattr("app.api.recall.call_llm", fake_call_llm)

    resp = await client.post(
        "/api/notes/LLMError/recall/generate",
        headers={"Authorization": f"Bearer {auth_token}"},
    )

    assert resp.status_code == 502


@pytest.mark.asyncio
async def test_recall_generate_cross_user_isolation_and_auth(
    client, auth_token, monkeypatch
):
    await _create_note_with_content(client, auth_token, "PrivateAI")

    async def fake_call_llm(prompt: str, system: str = "") -> str:
        return '["Private point"]'

    monkeypatch.setattr("app.api.recall.call_llm", fake_call_llm)

    unauthorized = await client.post("/api/notes/PrivateAI/recall/generate")
    assert unauthorized.status_code == 401

    resp_b = await client.post(
        "/api/register",
        json={"name": "B", "email": "recall-ai-b@test.com", "password": "secret123"},
    )
    token_b = resp_b.json()["access_token"]
    isolated = await client.post(
        "/api/notes/PrivateAI/recall/generate",
        headers={"Authorization": f"Bearer {token_b}"},
    )
    assert isolated.status_code == 404

    owner = await client.post(
        "/api/notes/PrivateAI/recall/generate",
        headers={"Authorization": f"Bearer {auth_token}"},
    )
    assert owner.status_code == 200
