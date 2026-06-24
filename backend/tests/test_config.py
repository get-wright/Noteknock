import pytest
from pydantic import ValidationError

from app.config import LLMSettings, Settings


def test_db_settings_do_not_require_llm_values():
    settings = Settings(
        database_url="postgresql+asyncpg://example/test",
        jwt_secret="test-secret",
    )

    assert settings.database_url == "postgresql+asyncpg://example/test"
    assert settings.jwt_secret == "test-secret"


@pytest.mark.parametrize("field", ["llm_base_url", "llm_api_key", "llm_model"])
def test_llm_settings_reject_whitespace_only_values(field: str):
    values = {
        "llm_base_url": "http://llm.invalid/v1",
        "llm_api_key": "test-key",
        "llm_model": "test-model",
    }
    values[field] = "   "

    with pytest.raises(ValidationError):
        LLMSettings(**values)
