import os
from pathlib import Path
from pydantic_settings import BaseSettings, SettingsConfigDict

BACKEND_DIR = Path(__file__).resolve().parent.parent
WORKSPACE_DIR = BACKEND_DIR.parent
ENV_PATH_BACKEND = str(BACKEND_DIR / ".env")
ENV_PATH_WORKSPACE = str(WORKSPACE_DIR / ".env")


class Settings(BaseSettings):
    app_name: str = "HealthMate AI"
    app_version: str = "1.0.0"
    database_url: str = "sqlite:///./healthmate.db"
    jwt_secret_key: str = "healthmate-production-quality-secret-key-2026-auth"
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 60 * 24 * 7  # 7 days
    frontend_url: str = "http://localhost:5173"
    upload_dir: str = "uploads"
    max_upload_size_mb: int = 15

    # AI Gateway settings
    ai_provider: str = "openrouter"  # openrouter, gemini, openai, local
    ai_api_key: str = ""
    openrouter_api_key: str = ""
    ai_model: str = "google/gemini-2.5-flash"
    openrouter_model: str = ""
    ai_fallback_model: str = "meta-llama/llama-3.3-70b-instruct"
    ai_base_url: str = "https://openrouter.ai/api/v1"
    ai_max_tokens: int = 800
    ai_history_limit: int = 10

    @property
    def effective_api_key(self) -> str:
        return (self.ai_api_key or self.openrouter_api_key or "").strip()

    @property
    def effective_model(self) -> str:
        model = (self.ai_model or self.openrouter_model or "").strip()
        # Automatically migrate retired OpenRouter models
        if not model or model == "google/gemini-2.0-flash-exp:free":
            return "google/gemini-2.5-flash"
        return model

    model_config = SettingsConfigDict(
        env_file=(ENV_PATH_BACKEND, ENV_PATH_WORKSPACE, ".env"),
        env_file_encoding="utf-8",
        extra="ignore",
    )


settings = Settings()

# Ensure uploads directory exists
os.makedirs(settings.upload_dir, exist_ok=True)
