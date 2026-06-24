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


class LLMSettings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env", extra="ignore", env_ignore_empty=True
    )
    llm_base_url: RequiredString
    llm_api_key: RequiredString
    llm_model: RequiredString


settings = Settings()
