import re


def parse_search(term: str) -> dict:
    term = (term or "").strip()
    if term == "*" or term == "":
        return {"match_all": True, "tag": None, "text": ""}

    tag = None
    rest = term

    m = re.match(r"#([\w-]+)\s*(.*)$", term)
    if m:
        tag = m.group(1).lower()
        rest = m.group(2)

    m = re.match(r"tags:\s*([\w-]+)\s*(.*)$", rest, re.IGNORECASE)
    if m and not tag:
        tag = m.group(1).lower()
        rest = m.group(2)

    text = rest
    text = re.sub(r"\bAND\b", " ", text, flags=re.IGNORECASE)
    text = re.sub(r"\bNOT\b\s*", "-", text, flags=re.IGNORECASE)
    text = re.sub(r"\btitle:\s*", "", text, flags=re.IGNORECASE)
    text = re.sub(r"\bcontent:\s*", "", text, flags=re.IGNORECASE)
    text = text.strip()

    return {"match_all": False, "tag": tag, "text": text}
