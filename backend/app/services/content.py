def blocks_to_text(blocks: list) -> str:
    if not isinstance(blocks, list):
        return ""
    block_texts: list[str] = []
    for block in blocks:
        if not isinstance(block, dict):
            continue
        if block.get("type") == "code":
            continue
        content = block.get("content")
        inline_text = _inline_to_text(content)
        if inline_text:
            block_texts.append(inline_text)
        children = block.get("children")
        if isinstance(children, list):
            child_text = blocks_to_text(children)
            if child_text:
                block_texts.append(child_text)
    return " ".join(block_texts)


def _inline_to_text(content) -> str:
    if not isinstance(content, list):
        return ""
    parts: list[str] = []
    for item in content:
        if not isinstance(item, dict):
            continue
        itype = item.get("type")
        if itype == "text":
            parts.append(str(item.get("text", "")))
        elif itype == "tag":
            parts.append("#" + str(item.get("tag", "")))
        elif isinstance(item.get("content"), list):
            parts.append(_inline_to_text(item["content"]))
    return "".join(parts)
