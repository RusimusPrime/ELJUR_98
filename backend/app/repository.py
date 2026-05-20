from __future__ import annotations

import sqlite3
import uuid
from typing import Any

from fastapi import HTTPException


def uid() -> str:
    return uuid.uuid4().hex


def row(conn: sqlite3.Connection, query: str, params: tuple[Any, ...] = ()) -> dict[str, Any] | None:
    cur = conn.execute(query, params)
    res = cur.fetchone()
    return dict(res) if res else None


def rows(conn: sqlite3.Connection, query: str, params: tuple[Any, ...] = ()) -> list[dict[str, Any]]:
    cur = conn.execute(query, params)
    return [dict(r) for r in cur.fetchall()]


def paginate(conn: sqlite3.Connection, base_query: str, count_query: str, params: tuple[Any, ...], page: int, limit: int):
    total = conn.execute(count_query, params).fetchone()[0]
    offset = (page - 1) * limit
    items = rows(conn, base_query + " LIMIT ? OFFSET ?", params + (limit, offset))
    return {"items": items, "page": page, "limit": limit, "total": total}


def user_public(conn: sqlite3.Connection, user_id: int) -> dict[str, Any]:
    user = row(conn, "SELECT id, full_name, email, role, bio, avatar_url FROM users WHERE id = ?", (user_id,))
    if not user:
        raise HTTPException(404, "Пользователь не найден")
    return user


def group_public(conn: sqlite3.Connection, group_id: str) -> dict[str, Any]:
    g = row(conn, "SELECT * FROM groups WHERE id = ?", (group_id,))
    if not g:
        raise HTTPException(404, "Группа не найдена")
    last = row(conn, "SELECT content, created_at FROM group_messages WHERE group_id = ? ORDER BY created_at DESC LIMIT 1", (group_id,))
    subs = conn.execute("SELECT COUNT(DISTINCT sender_id) FROM group_messages WHERE group_id = ?", (group_id,)).fetchone()[0]
    return {
        "id": g["id"],
        "name": g["name"],
        "description": g["description"],
        "avatar_url": g["avatar_url"],
        "is_private": bool(g["is_private"]),
        "owner_id": int(g["owner_id"]),
        "subscribers_count": subs,
        "last_message_preview": last["content"] if last else None,
        "updated_at": last["created_at"] if last else g["created_at"],
    }


def group_message_public(conn: sqlite3.Connection, msg: dict[str, Any]) -> dict[str, Any]:
    return {
        "id": msg["id"],
        "group_id": msg["group_id"],
        "sender": user_public(conn, int(msg["sender_id"])),
        "content": msg["content"],
        "created_at": msg["created_at"],
    }


def chat_public(conn: sqlite3.Connection, chat: dict[str, Any]) -> dict[str, Any]:
    participants = rows(
        conn,
        """
        SELECT u.id, u.full_name, u.email, u.role, u.bio, u.avatar_url
        FROM chat_participants cp
        JOIN users u ON u.id = cp.user_id
        WHERE cp.chat_id = ?
        ORDER BY u.full_name COLLATE NOCASE
        """,
        (chat["id"],),
    )
    last = row(conn, "SELECT content, created_at FROM chat_messages WHERE chat_id = ? ORDER BY created_at DESC LIMIT 1", (chat["id"],))
    return {
        "id": chat["id"],
        "participants": participants,
        "last_message_preview": last["content"] if last else None,
        "updated_at": chat["updated_at"],
    }


def chat_message_public(conn: sqlite3.Connection, msg: dict[str, Any]) -> dict[str, Any]:
    return {
        "id": msg["id"],
        "chat_id": msg["chat_id"],
        "sender": user_public(conn, int(msg["sender_id"])),
        "content": msg["content"],
        "created_at": msg["created_at"],
    }


def news_public(conn: sqlite3.Connection, news: dict[str, Any]) -> dict[str, Any]:
    return {
        "id": news["id"],
        "title": news["title"],
        "content": news["content"],
        "status": news["status"],
        "group": group_public(conn, news["group_id"]) if news["group_id"] else None,
        "created_by": user_public(conn, int(news["created_by_id"])) if news["created_by_id"] else None,
        "reviewed_by": user_public(conn, int(news["reviewed_by_id"])) if news["reviewed_by_id"] else None,
        "reviewed_at": news["reviewed_at"],
        "created_at": news["created_at"],
    }


def event_public(conn: sqlite3.Connection, event: dict[str, Any]) -> dict[str, Any]:
    return {
        "id": event["id"],
        "title": event["title"],
        "description": event["description"],
        "starts_at": event["starts_at"],
        "ends_at": event["ends_at"],
        "group": group_public(conn, event["group_id"]) if event["group_id"] else None,
        "created_by": user_public(conn, int(event["created_by_id"])) if event["created_by_id"] else None,
        "created_at": event["created_at"],
    }
