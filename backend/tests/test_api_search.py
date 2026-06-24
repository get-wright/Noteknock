import pytest

NOTE_TICH_PHHAN = [
    {
        "type": "paragraph",
        "content": [
            {
                "type": "text",
                "text": "Tích phân từng phần dùng công thức ILATE #toán",
                "styles": {},
            }
        ],
    },
]
NOTE_LY = [
    {
        "type": "paragraph",
        "content": [
            {"type": "text", "text": "Điện tích #lý bài giảng", "styles": {}}
        ],
    },
]


async def _create(client, token, title, content):
    resp = await client.post(
        "/api/notes",
        json={"title": title, "content": content},
        headers={"Authorization": f"Bearer {token}"},
    )
    assert resp.status_code == 200


@pytest.mark.asyncio
async def test_search_star_returns_all_sorted_by_last_modified(client, auth_token):
    await _create(client, auth_token, "Note A", NOTE_TICH_PHHAN)
    await _create(client, auth_token, "Note B", NOTE_LY)
    resp = await client.get(
        "/api/search",
        params={"term": "*"},
        headers={"Authorization": f"Bearer {auth_token}"},
    )
    assert resp.status_code == 200
    results = resp.json()
    assert len(results) == 2
    titles = [r["title"] for r in results]
    assert "Note B" in titles and "Note A" in titles
    assert results[0]["lastModified"] >= results[1]["lastModified"]


@pytest.mark.asyncio
async def test_search_by_tag_unicode(client, auth_token):
    await _create(client, auth_token, "Toan note", NOTE_TICH_PHHAN)
    await _create(client, auth_token, "Ly note", NOTE_LY)
    resp = await client.get(
        "/api/search",
        params={"term": "#toán"},
        headers={"Authorization": f"Bearer {auth_token}"},
    )
    assert resp.status_code == 200
    results = resp.json()
    assert len(results) == 1
    assert results[0]["title"] == "Toan note"
    assert results[0]["tagMatches"] == ["toán"]


@pytest.mark.asyncio
async def test_search_free_text_with_highlights(client, auth_token):
    await _create(client, auth_token, "Tích phân", NOTE_TICH_PHHAN)
    resp = await client.get(
        "/api/search",
        params={"term": "tích"},
        headers={"Authorization": f"Bearer {auth_token}"},
    )
    assert resp.status_code == 200
    results = resp.json()
    assert len(results) >= 1
    found = [r for r in results if r["title"] == "Tích phân"]
    assert len(found) == 1
    assert (found[0]["titleHighlights"] and "<b>" in found[0]["titleHighlights"]) or (
        found[0]["contentHighlights"] and "<b>" in found[0]["contentHighlights"]
    )


@pytest.mark.asyncio
async def test_search_sort_by_title(client, auth_token):
    await _create(client, auth_token, "Zebra", NOTE_LY)
    await _create(client, auth_token, "Apple", NOTE_LY)
    resp = await client.get(
        "/api/search",
        params={"term": "*", "sort": "title", "order": "asc"},
        headers={"Authorization": f"Bearer {auth_token}"},
    )
    results = resp.json()
    titles = [r["title"] for r in results]
    assert titles == sorted(titles)
    resp2 = await client.get(
        "/api/search",
        params={"term": "*", "sort": "title", "order": "desc"},
        headers={"Authorization": f"Bearer {auth_token}"},
    )
    titles2 = [r["title"] for r in resp2.json()]
    assert titles2 == sorted(titles2, reverse=True)


@pytest.mark.asyncio
async def test_search_limit(client, auth_token):
    for i in range(5):
        await _create(client, auth_token, f"Limit{i}", NOTE_LY)
    resp = await client.get(
        "/api/search",
        params={"term": "*", "limit": 2},
        headers={"Authorization": f"Bearer {auth_token}"},
    )
    results = resp.json()
    assert len(results) == 2


@pytest.mark.asyncio
async def test_search_quoted_phrase(client, auth_token):
    await _create(
        client,
        auth_token,
        "Phrase",
        [
            {
                "type": "paragraph",
                "content": [
                    {"type": "text", "text": "tích phân từng phần", "styles": {}}
                ],
            }
        ],
    )
    resp = await client.get(
        "/api/search",
        params={"term": '"tích phân"'},
        headers={"Authorization": f"Bearer {auth_token}"},
    )
    assert resp.status_code == 200
    results = resp.json()
    assert any(r["title"] == "Phrase" for r in results)


@pytest.mark.asyncio
async def test_search_no_token_401(client):
    resp = await client.get("/api/search", params={"term": "*"})
    assert resp.status_code == 401


@pytest.mark.asyncio
async def test_search_malformed_bare_operators(client, auth_token):
    resp = await client.get(
        "/api/search",
        params={"term": "!!! & | ("},
        headers={"Authorization": f"Bearer {auth_token}"},
    )
    assert resp.status_code == 200
    assert isinstance(resp.json(), list)


@pytest.mark.asyncio
async def test_search_empty_term(client, auth_token):
    await _create(client, auth_token, "Exists", NOTE_LY)
    resp = await client.get(
        "/api/search",
        params={"term": ""},
        headers={"Authorization": f"Bearer {auth_token}"},
    )
    assert resp.status_code == 200
    assert isinstance(resp.json(), list)


@pytest.mark.asyncio
async def test_search_trailing_or(client, auth_token):
    await _create(
        client,
        auth_token,
        "A note",
        [
            {
                "type": "paragraph",
                "content": [{"type": "text", "text": "apple", "styles": {}}],
            }
        ],
    )
    resp = await client.get(
        "/api/search",
        params={"term": "apple OR"},
        headers={"Authorization": f"Bearer {auth_token}"},
    )
    assert resp.status_code == 200
    assert isinstance(resp.json(), list)


@pytest.mark.asyncio
async def test_search_diacritics_not(client, auth_token):
    await _create(
        client,
        auth_token,
        "Has tích",
        [
            {
                "type": "paragraph",
                "content": [
                    {"type": "text", "text": "tích phương", "styles": {}}
                ],
            }
        ],
    )
    resp = await client.get(
        "/api/search",
        params={"term": "tích -phương"},
        headers={"Authorization": f"Bearer {auth_token}"},
    )
    assert resp.status_code == 200
    results = resp.json()
    assert all(r["title"] != "Has tích" for r in results)


@pytest.mark.asyncio
async def test_search_parens(client, auth_token):
    resp = await client.get(
        "/api/search",
        params={"term": "()()"},
        headers={"Authorization": f"Bearer {auth_token}"},
    )
    assert resp.status_code == 200
    assert isinstance(resp.json(), list)
