import json

import httpx

from app.config import LLMSettings

llm_settings = LLMSettings()


def parse_chat_completion(raw: str) -> str:
    decoder = json.JSONDecoder()
    data, _ = decoder.raw_decode(raw.strip())
    return data["choices"][0]["message"]["content"]


async def call_llm(prompt: str, system: str = "") -> str:
    messages = []
    if system:
        messages.append({"role": "system", "content": system})
    messages.append({"role": "user", "content": prompt})

    base_url = llm_settings.llm_base_url.rstrip("/")
    async with httpx.AsyncClient(timeout=30) as client:
        response = await client.post(
            f"{base_url}/chat/completions",
            headers={"Authorization": f"Bearer {llm_settings.llm_api_key}"},
            json={"model": llm_settings.llm_model, "messages": messages},
        )
        response.raise_for_status()
        return parse_chat_completion(response.text)
