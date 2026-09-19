from functools import lru_cache
from pathlib import Path

from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_prefix="LIOS_", env_file=".env", env_file_encoding="utf-8", extra="ignore"
    )

    env: str = "development"
    host: str = "0.0.0.0"
    port: int = 8080
    database_path: Path = Path("./data/lios.sqlite3")
    database_url: str = ""
    rss_feeds: str = ""
    public_url: str = "http://localhost:8080"
    allowed_origins: str = "http://localhost:8080"
    operator_token: str = "development-only-token"
    ai_provider: str = "demo"
    text_model: str = "gpt-5.5"
    image_model: str = "gpt-image-2"
    cache_default_ttl: int = 900
    cache_stale_ttl: int = 3600
    openai_api_key: str = ""

    @field_validator("public_url")
    @classmethod
    def clean_url(cls, value: str) -> str:
        return value.rstrip("/")

    @property
    def is_production(self) -> bool:
        return self.env.lower() == "production"

    @property
    def origins(self) -> list[str]:
        return [item.strip() for item in self.allowed_origins.split(",") if item.strip()]

    def validate_production(self) -> None:
        if self.is_production and len(self.operator_token) < 32:
            raise RuntimeError("LIOS_OPERATOR_TOKEN deve ter ao menos 32 caracteres em produção.")
        if self.is_production and not self.database_url:
            raise RuntimeError("LIOS_DATABASE_URL é obrigatória em produção.")
        if self.ai_provider not in {"demo", "openai"}:
            raise RuntimeError("Provedor de IA desconhecido.")
        if self.ai_provider == "openai" and not self.openai_api_key:
            raise RuntimeError("LIOS_OPENAI_API_KEY é obrigatória para o provedor real.")


@lru_cache
def get_settings() -> Settings:
    settings = Settings()
    settings.validate_production()
    return settings
