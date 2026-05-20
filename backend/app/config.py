from __future__ import annotations

import os
from dataclasses import dataclass
from pathlib import Path


@dataclass(frozen=True)
class Settings:
    db_path: str = os.getenv("DB_PATH", str(Path(__file__).resolve().parents[1] / "data" / "app.db"))
    jwt_secret: str = os.getenv("JWT_SECRET", "change-me-in-production-use-a-long-random-secret")
    jwt_algorithm: str = os.getenv("JWT_ALGORITHM", "HS256")
    access_token_days: int = int(os.getenv("ACCESS_TOKEN_DAYS", "7"))


settings = Settings()
