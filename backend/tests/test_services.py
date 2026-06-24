from app.services.content import blocks_to_text
from app.services.search import parse_search
from app.services.tags import extract_tags

BLOCKS = [
    {"type": "paragraph", "content": [{"type": "text", "text": "Tích phân #toán từng phần", "styles": {}}]},
    {"type": "code", "content": [{"type": "text", "text": "#notatag inside code"}]},
    {"type": "paragraph", "content": [{"type": "text", "text": "ILATE #lý helps", "styles": {}}]},
]


def test_blocks_to_text_skips_code():
    assert blocks_to_text(BLOCKS) == "Tích phân #toán từng phần ILATE #lý helps"


def test_extract_tags_unicode():
    assert extract_tags(BLOCKS) == ["toán", "lý"]


def test_empty_blocks():
    assert blocks_to_text([]) == ""
    assert extract_tags([]) == []


def test_blocks_to_text_handles_link_inline_content():
    blocks = [
        {
            "type": "paragraph",
            "content": [
                {"type": "text", "text": "Xem ", "styles": {}},
                {
                    "type": "link",
                    "href": "https://x",
                    "content": [{"type": "text", "text": "tài liệu #vật-lý", "styles": {}}],
                },
                {"type": "text", "text": " ở đây", "styles": {}},
            ],
        },
    ]
    assert blocks_to_text(blocks) == "Xem tài liệu #vật-lý ở đây"
    assert extract_tags(blocks) == ["vật-lý"]


def test_blocks_to_text_recurses_into_children():
    blocks = [
        {
            "type": "paragraph",
            "content": [{"type": "text", "text": "Cha #cha", "styles": {}}],
            "children": [
                {"type": "paragraph", "content": [{"type": "text", "text": "Con #con", "styles": {}}]}
            ],
        },
    ]
    assert blocks_to_text(blocks) == "Cha #cha Con #con"
    assert extract_tags(blocks) == ["cha", "con"]


def test_blocks_to_text_handles_native_tag_inline_content():
    blocks = [
        {
            "type": "paragraph",
            "content": [
                {"type": "text", "text": "Gắn thẻ ", "styles": {}},
                {"type": "tag", "tag": "hoá"},
                {"type": "text", "text": " nhé", "styles": {}},
            ],
        },
    ]
    assert blocks_to_text(blocks) == "Gắn thẻ #hoá nhé"
    assert extract_tags(blocks) == ["hoá"]


def test_blocks_to_text_skips_blocks_without_content():
    blocks = [
        {"type": "image", "props": {"url": "https://x/1.png"}, "content": []},
        {"type": "paragraph", "content": [{"type": "text", "text": "Sau ảnh #ghi", "styles": {}}]},
    ]
    assert blocks_to_text(blocks) == "Sau ảnh #ghi"
    assert extract_tags(blocks) == ["ghi"]


def test_extract_tags_dedupes_preserving_order():
    blocks = [
        {"type": "paragraph", "content": [{"type": "text", "text": "#toán #lý #toán #lý", "styles": {}}]},
    ]
    assert extract_tags(blocks) == ["toán", "lý"]


def test_extract_tags_lowercase():
    blocks = [
        {"type": "paragraph", "content": [{"type": "text", "text": "#ToÁn #LÝ", "styles": {}}]},
    ]
    assert extract_tags(blocks) == ["toán", "lý"]


def test_extract_tags_followed_by_punctuation():
    blocks = [
        {
            "type": "paragraph",
            "content": [
                {
                    "type": "text",
                    "text": "Ôn #toán, #lý. #hoá! (#vật-lý?)",
                    "styles": {},
                }
            ],
        },
    ]
    assert extract_tags(blocks) == ["toán", "lý", "hoá", "vật-lý"]


def test_extract_tags_ignores_url_fragments():
    blocks = [
        {
            "type": "paragraph",
            "content": [
                {
                    "type": "text",
                    "text": "Xem https://example.test/#section và #toán.",
                    "styles": {},
                }
            ],
        },
    ]
    assert extract_tags(blocks) == ["toán"]


def test_parse_search_not_attaches_dash_to_next_term():
    assert parse_search("tích NOT phương") == {
        "match_all": False,
        "tag": None,
        "text": "tích -phương",
    }


def test_blocks_to_text_non_list_input_returns_empty():
    assert blocks_to_text(None) == ""
    assert blocks_to_text("not a list") == ""
