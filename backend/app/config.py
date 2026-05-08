from pathlib import Path
from pydantic_settings import BaseSettings, SettingsConfigDict

# Resolve absolute path so the DB is found regardless of where uvicorn is started
_DB_PATH = Path(__file__).resolve().parents[1] / "database" / "vcommerce.db"


class Settings(BaseSettings):
    DATABASE_URL: str = f"sqlite:///{_DB_PATH}"

    # Google AI Studio — obtenha em https://aistudio.google.com/app/apikey
    GEMINI_API_KEY: str = ""

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")

settings = Settings()