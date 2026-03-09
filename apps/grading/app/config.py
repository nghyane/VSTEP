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

    stt_model: str = "cloudflare/@cf/openai/whisper"
    stt_api_base: str | None = None
    stt_api_key: str | None = None

    redis_url: str = "redis://localhost:6379"

    grading_queue: str = "grading:tasks"
    max_retries: int = 3

    log_level: str = "INFO"


settings = Settings()
