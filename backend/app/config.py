from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env", extra="ignore", env_ignore_empty=True
    )
    database_url: str
    jwt_secret: str
    jwt_expiry_days: int = 30
    jwt_algorithm: str = "HS256"
    llm_base_url: str
    llm_api_key: str
    llm_model: str


settings = Settings()
