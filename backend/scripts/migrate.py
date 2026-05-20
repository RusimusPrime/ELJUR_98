from __future__ import annotations

import sqlite3
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DB_PATH = ROOT / "data" / "app.db"
MIGRATION = ROOT / "migrations" / "001_initial.sql"

DB_PATH.parent.mkdir(parents=True, exist_ok=True)
conn = sqlite3.connect(DB_PATH)
conn.execute("PRAGMA foreign_keys = ON")
conn.executescript(MIGRATION.read_text(encoding="utf-8"))
conn.commit()
conn.close()
print(f"Applied migration to {DB_PATH}")
