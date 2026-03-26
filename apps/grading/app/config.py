from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    # Primary: OpenAI-compatible (set via env)
    llm_model: str = "openai/gpt-4o"
    llm_account_id: str | None = None
    llm_api_base: str | None = None
    llm_api_key: str | None = None
    # Fallback: Cloudflare Workers AI (free)
    llm_fallback_model: str = "cloudflare/@cf/meta/llama-3.3-70b-instruct-fp8-fast"
    llm_fallback_account_id: str | None = None
    llm_fallback_api_base: str | None = None
    llm_fallback_api_key: str | None = None
    llm_timeout: int = 60
    llm_retries: int = 3

    stt_model: str = "cloudflare/@cf/deepgram/nova-3"
    stt_api_base: str | None = None
    stt_api_key: str | None = None

    redis_url: str = "redis://localhost:6379"

    grading_queue: str = "grading:tasks"
    max_retries: int = 3

    storage_path: str | None = None

    log_level: str = "INFO"


settings = Settings()
