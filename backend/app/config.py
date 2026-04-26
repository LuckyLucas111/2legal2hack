from pydantic_settings import BaseSettings
from pathlib import Path


class Settings(BaseSettings):
    openai_api_key: str = ""
    openai_model: str = "gpt-5.5"
    database_url: str = "sqlite+aiosqlite:///./data/app.db"
    hf_api_key: str = ""
    embedding_model: str = "paraphrase-multilingual-MiniLM-L12-v2"
    chroma_persist_dir: str = "./data/chroma"
    upload_dir: str = "./app/uploads"
    cors_origins: list[str] = ["http://localhost:5173"]

    model_config = {"env_file": ".env", "extra": "ignore"}


settings = Settings()

BASE_DIR = Path(__file__).resolve().parent.parent
UPLOAD_DIR = BASE_DIR / settings.upload_dir
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
