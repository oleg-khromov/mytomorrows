from functools import lru_cache
from typing import Literal

from pydantic import AliasChoices, Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    app_name: str = "myTomorrows Trials API"
    environment: Literal["local", "test", "production"] = "local"
    api_prefix: str = "/api/v1"
    allowed_origins: tuple[str, ...] = ("http://localhost:4200",)
    database_url: str = Field(
        default="sqlite+pysqlite:///./trials.db",
        validation_alias=AliasChoices("DATABASE_URL", "POSTGRES_URL", "POSTGRES_PRISMA_URL"),
    )

    @field_validator("database_url")
    @classmethod
    def normalize_database_url(cls, value: str) -> str:
        if value.startswith("postgresql+"):
            return value

        if value.startswith("postgresql://"):
            return value.replace("postgresql://", "postgresql+psycopg://", 1)

        if value.startswith("postgres://"):
            return value.replace("postgres://", "postgresql+psycopg://", 1)

        return value


@lru_cache
def get_settings() -> Settings:
    return Settings()
