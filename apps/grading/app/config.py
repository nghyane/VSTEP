"""
Application Configuration
"""
from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    """Application settings loaded from environment"""
    
    # Redis
    redis_url: str = "redis://localhost:6379/0"
    
    # AI Providers
    openai_api_key: str = ""
    google_api_key: str = ""
    
    # Whisper
    whisper_model: str = "base"
    
    # Grading
    confidence_threshold: float = 85.0
    max_retries: int = 3
    
    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


@lru_cache()
def get_settings() -> Settings:
    """Get cached settings instance"""
    return Settings()


settings = get_settings()
