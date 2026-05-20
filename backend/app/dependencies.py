from __future__ import annotations

from fastapi import Depends, Header, HTTPException

from .db import get_db
from .repository import row
from .security import decode_token


def get_current_user(authorization: str | None = Header(default=None), db=Depends(get_db)) -> dict:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(401, "Требуется авторизация")
    token = authorization.split(" ", 1)[1]
    try:
        payload = decode_token(token)
        user_id = int(payload.get("sub"))
    except Exception:
        raise HTTPException(401, "Недействительный токен")
    user = row(db, "SELECT id, full_name, email, role, bio, avatar_url FROM users WHERE id = ?", (user_id,))
    if not user:
        raise HTTPException(401, "Пользователь не найден")
    return user
