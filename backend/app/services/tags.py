import re

from app.services.content import blocks_to_text

_TAG_RE = re.compile(r"(?:(?<=^#)|(?<=\s#))[\w-]+(?=\s|$)")


def extract_tags(blocks: list) -> list[str]:
    text = blocks_to_text(blocks)
    seen: set[str] = set()
    tags: list[str] = []
    for m in _TAG_RE.finditer(text):
        tag = m.group(0).lower()
        if tag not in seen:
            seen.add(tag)
            tags.append(tag)
    return tags
