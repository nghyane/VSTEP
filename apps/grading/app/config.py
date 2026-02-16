from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    llm_model: str = "groq/llama-3.3-70b-versatile"
    llm_api_base: str | None = None
    llm_api_key: str | None = None
    llm_fallback_model: str | None = None
    llm_fallback_api_key: str | None = None
    llm_timeout: int = 60
    llm_retries: int = 3

    stt_model: str = "groq/whisper-large-v3-turbo"

    redis_url: str = "redis://localhost:6379"
    database_url: str = Field(alias="DATABASE_URL")

    grading_queue: str = "grading:tasks"
    dead_letter_queue: str = "grading:dlq"
    max_retries: int = 3

    log_level: str = "INFO"


settings = Settings()
