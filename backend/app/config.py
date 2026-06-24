from typing import Annotated

from pydantic import StringConstraints
from pydantic_settings import BaseSettings, SettingsConfigDict

RequiredString = Annotated[str, StringConstraints(strip_whitespace=True, min_length=1)]


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env", extra="ignore", env_ignore_empty=True
    )
    database_url: str
    jwt_secret: str
    jwt_expiry_days: int = 30
    jwt_algorithm: str = "HS256"
    google_client_id: str = ""
    google_client_secret: str = ""
    google_redirect_uri: str = ""


def google_oauth_configured() -> bool:
    return bool(
        settings.google_client_id.strip()
        and settings.google_client_secret.strip()
        and settings.google_redirect_uri.strip()
    )


class LLMSettings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env", extra="ignore", env_ignore_empty=True
    )
    llm_base_url: RequiredString
    llm_api_key: RequiredString
    llm_model: RequiredString


settings = Settings()
