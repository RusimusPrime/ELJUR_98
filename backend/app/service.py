from __future__ import annotations

import sqlite3
from typing import Any

from fastapi import HTTPException

from .db import utcnow_iso
from .repository import (
    chat_message_public,
    chat_public,
    event_public,
    group_message_public,
    group_public,
    news_public,
    paginate,
    row,
    rows,
    uid,
    user_public,
)
from .security import create_access_token, hash_password, verify_password


def register_user(conn: sqlite3.Connection, full_name: str, email: str, password: str, role: str):
    if role not in {"student", "teacher", "admin"}:
        raise HTTPException(400, "Некорректная роль")
    if row(conn, "SELECT 1 FROM users WHERE email = ?", (email.lower().strip(),)):
        raise HTTPException(400, "Пользователь уже существует")
    conn.execute(
        """
        INSERT INTO users (full_name, email, password_hash, role, created_at)
        VALUES (?, ?, ?, ?, ?)
        """,
        (full_name.strip(), email.lower().strip(), hash_password(password), role, utcnow_iso()),
    )
    user = row(conn, "SELECT * FROM users WHERE email = ?", (email.lower().strip(),))
    return user_public(conn, int(user["id"])), create_access_token(str(user["id"]), role)


def authenticate_user(conn: sqlite3.Connection, email: str, password: str):
    user = row(conn, "SELECT * FROM users WHERE email = ?", (email.lower().strip(),))
    if not user or not verify_password(password, user["password_hash"]):
        raise HTTPException(401, "Неверный email или пароль")
    return user_public(conn, int(user["id"])), create_access_token(str(user["id"]), user["role"])


def update_me(conn: sqlite3.Connection, user_id: int, data: dict[str, Any]) -> dict[str, Any]:
    fields = []
    values = []
    for key in ("full_name", "bio", "avatar_url"):
        if key in data and data[key] is not None:
            fields.append(f"{key} = ?")
            values.append(data[key])
    if fields:
        values.append(user_id)
        conn.execute(f"UPDATE users SET {', '.join(fields)} WHERE id = ?", tuple(values))
    return user_public(conn, user_id)


def list_users(conn: sqlite3.Connection, query: str, page: int, limit: int):
    q = f"%{query.strip().lower()}%"
    data = paginate(
        conn,
        """
        SELECT id, full_name, email, role, bio, avatar_url
        FROM users
        WHERE LOWER(full_name) LIKE ? OR LOWER(email) LIKE ?
        ORDER BY id DESC
        """,
        """
        SELECT COUNT(*)
        FROM users
        WHERE LOWER(full_name) LIKE ? OR LOWER(email) LIKE ?
        """,
        (q, q),
        page,
        min(limit, 100),
    )
    return data


def update_user_role(conn: sqlite3.Connection, current_user: dict[str, Any], user_id: int, role: str):
    if current_user["role"] != "admin":
        raise HTTPException(403, "Только администратор")
    if role not in {"student", "teacher", "admin"}:
        raise HTTPException(400, "Некорректная роль")
    if not row(conn, "SELECT id FROM users WHERE id = ?", (user_id,)):
        raise HTTPException(404, "Пользователь не найден")
    conn.execute("UPDATE users SET role = ? WHERE id = ?", (role, user_id))
    return user_public(conn, user_id)


def delete_user(conn: sqlite3.Connection, current_user: dict[str, Any], user_id: int):
    if current_user["role"] != "admin":
        raise HTTPException(403, "Только администратор")
    if current_user["id"] == user_id:
        raise HTTPException(400, "Нельзя удалить себя")
    if not row(conn, "SELECT id FROM users WHERE id = ?", (user_id,)):
        raise HTTPException(404, "Пользователь не найден")
    conn.execute("DELETE FROM users WHERE id = ?", (user_id,))
    return {"status": "deleted"}


def create_group(conn: sqlite3.Connection, current_user: dict[str, Any], data: dict[str, Any]):
    group_id = uid()
    conn.execute(
        """
        INSERT INTO groups (id, name, description, avatar_url, is_private, owner_id, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
        """,
        (group_id, data["name"].strip(), data.get("description"), data.get("avatar_url"), int(bool(data.get("is_private", False))), current_user["id"], utcnow_iso()),
    )
    return group_public(conn, group_id)


def update_group(conn: sqlite3.Connection, current_user: dict[str, Any], group_id: str, data: dict[str, Any]):
    g = row(conn, "SELECT * FROM groups WHERE id = ?", (group_id,))
    if not g:
        raise HTTPException(404, "Группа не найдена")
    if current_user["role"] != "admin" and int(g["owner_id"]) != current_user["id"]:
        raise HTTPException(403, "Недостаточно прав")
    fields = []
    values = []
    for key in ("name", "description", "avatar_url", "is_private"):
        if key in data and data[key] is not None:
            fields.append(f"{key} = ?")
            values.append(int(data[key]) if key == "is_private" else data[key])
    if fields:
        values.append(group_id)
        conn.execute(f"UPDATE groups SET {', '.join(fields)} WHERE id = ?", tuple(values))
    return group_public(conn, group_id)


def create_group_message(conn: sqlite3.Connection, current_user: dict[str, Any], group_id: str, content: str):
    if not row(conn, "SELECT id FROM groups WHERE id = ?", (group_id,)):
        raise HTTPException(404, "Группа не найдена")
    msg_id = uid()
    conn.execute(
        "INSERT INTO group_messages (id, group_id, sender_id, content, created_at) VALUES (?, ?, ?, ?, ?)",
        (msg_id, group_id, current_user["id"], content.strip(), utcnow_iso()),
    )
    return group_message_public(conn, row(conn, "SELECT * FROM group_messages WHERE id = ?", (msg_id,)))


def list_group_messages(conn: sqlite3.Connection, group_id: str, page: int, limit: int):
    if not row(conn, "SELECT id FROM groups WHERE id = ?", (group_id,)):
        raise HTTPException(404, "Группа не найдена")
    data = paginate(
        conn,
        "SELECT * FROM group_messages WHERE group_id = ? ORDER BY created_at ASC",
        "SELECT COUNT(*) FROM group_messages WHERE group_id = ?",
        (group_id,),
        page,
        min(limit, 200),
    )
    data["items"] = [group_message_public(conn, m) for m in data["items"]]
    return data


def create_chat(conn: sqlite3.Connection, current_user: dict[str, Any], recipient_ids: list[int], content: str):
    participants = [int(pid) for pid in recipient_ids if int(pid) != int(current_user["id"])]
    participants = sorted(set(participants + [int(current_user["id"])]))
    if len(participants) < 2:
        raise HTTPException(400, "Нужен хотя бы один другой участник")
    for pid in participants:
        if not row(conn, "SELECT id FROM users WHERE id = ?", (pid,)):
            raise HTTPException(404, f"Пользователь {pid} не найден")
    chat_id = uid()
    conn.execute("INSERT INTO chats (id, created_at, updated_at) VALUES (?, ?, ?)", (chat_id, utcnow_iso(), utcnow_iso()))
    for pid in participants:
        conn.execute("INSERT INTO chat_participants (chat_id, user_id) VALUES (?, ?)", (chat_id, pid))
    send_chat_message(conn, current_user, chat_id, content)
    return chat_public(conn, row(conn, "SELECT * FROM chats WHERE id = ?", (chat_id,)))


def send_chat_message(conn: sqlite3.Connection, current_user: dict[str, Any], chat_id: str, content: str):
    if not row(conn, "SELECT id FROM chats WHERE id = ?", (chat_id,)):
        raise HTTPException(404, "Диалог не найден")
    if not row(conn, "SELECT 1 FROM chat_participants WHERE chat_id = ? AND user_id = ?", (chat_id, current_user["id"])):
        raise HTTPException(403, "Вы не участник диалога")
    msg_id = uid()
    conn.execute(
        "INSERT INTO chat_messages (id, chat_id, sender_id, content, created_at) VALUES (?, ?, ?, ?, ?)",
        (msg_id, chat_id, current_user["id"], content.strip(), utcnow_iso()),
    )
    conn.execute("UPDATE chats SET updated_at = ? WHERE id = ?", (utcnow_iso(), chat_id))
    return chat_message_public(conn, row(conn, "SELECT * FROM chat_messages WHERE id = ?", (msg_id,)))


def list_chats(conn: sqlite3.Connection, user_id: int, page: int, limit: int):
    data = paginate(
        conn,
        """
        SELECT c.*
        FROM chats c
        JOIN chat_participants cp ON cp.chat_id = c.id
        WHERE cp.user_id = ?
        ORDER BY c.updated_at DESC
        """,
        """
        SELECT COUNT(*)
        FROM chats c
        JOIN chat_participants cp ON cp.chat_id = c.id
        WHERE cp.user_id = ?
        """,
        (user_id,),
        page,
        min(limit, 100),
    )
    data["items"] = [chat_public(conn, c) for c in data["items"]]
    return data


def list_chat_messages(conn: sqlite3.Connection, current_user: dict[str, Any], chat_id: str, page: int, limit: int):
    if not row(conn, "SELECT 1 FROM chat_participants WHERE chat_id = ? AND user_id = ?", (chat_id, current_user["id"])):
        raise HTTPException(403, "Вы не участник диалога")
    data = paginate(
        conn,
        "SELECT * FROM chat_messages WHERE chat_id = ? ORDER BY created_at ASC",
        "SELECT COUNT(*) FROM chat_messages WHERE chat_id = ?",
        (chat_id,),
        page,
        min(limit, 200),
    )
    data["items"] = [chat_message_public(conn, m) for m in data["items"]]
    return data


def create_news(conn: sqlite3.Connection, current_user: dict[str, Any], data: dict[str, Any]):
    news_id = uid()
    conn.execute(
        """
        INSERT INTO news_items (id, title, content, group_id, created_by_id, status, created_at, reviewed_by_id, reviewed_at, review_note)
        VALUES (?, ?, ?, ?, ?, 'pending', ?, NULL, NULL, NULL)
        """,
        (news_id, data["title"].strip(), data["content"].strip(), data.get("group_id"), current_user["id"], utcnow_iso()),
    )
    return news_public(conn, row(conn, "SELECT * FROM news_items WHERE id = ?", (news_id,)))


def list_pending_news(conn: sqlite3.Connection, current_user: dict[str, Any], page: int, limit: int):
    if current_user["role"] != "admin":
        raise HTTPException(403, "Только администратор")
    data = paginate(
        conn,
        "SELECT * FROM news_items WHERE status = 'pending' ORDER BY created_at DESC",
        "SELECT COUNT(*) FROM news_items WHERE status = 'pending'",
        (),
        page,
        min(limit, 100),
    )
    data["items"] = [news_public(conn, n) for n in data["items"]]
    return data


def review_news(conn: sqlite3.Connection, current_user: dict[str, Any], news_id: str, status: str, note: str | None = None):
    if current_user["role"] != "admin":
        raise HTTPException(403, "Только администратор")
    if status not in {"approved", "rejected"}:
        raise HTTPException(400, "Некорректный статус")
    item = row(conn, "SELECT * FROM news_items WHERE id = ?", (news_id,))
    if not item:
        raise HTTPException(404, "Новость не найдена")
    if item["status"] != "pending":
        raise HTTPException(400, "Новость уже рассмотрена")
    conn.execute(
        """
        UPDATE news_items
        SET status = ?, reviewed_by_id = ?, reviewed_at = ?, review_note = ?
        WHERE id = ?
        """,
        (status, current_user["id"], utcnow_iso(), note, news_id),
    )
    return news_public(conn, row(conn, "SELECT * FROM news_items WHERE id = ?", (news_id,)))


def create_event(conn: sqlite3.Connection, current_user: dict[str, Any], data: dict[str, Any]):
    if current_user["role"] != "admin":
        raise HTTPException(403, "Только администратор")
    if not data.get("starts_at"):
        raise HTTPException(400, "Укажите дату и время")
    event_id = uid()
    conn.execute(
        """
        INSERT INTO events (id, title, description, starts_at, ends_at, group_id, created_by_id, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """,
        (
            event_id,
            data["title"].strip(),
            data.get("description"),
            data.get("starts_at"),
            data.get("ends_at"),
            data.get("group_id"),
            current_user["id"],
            utcnow_iso(),
        ),
    )
    return event_public(conn, row(conn, "SELECT * FROM events WHERE id = ?", (event_id,)))


def list_events(conn: sqlite3.Connection, page: int, limit: int):
    data = paginate(
        conn,
        "SELECT * FROM events ORDER BY created_at DESC",
        "SELECT COUNT(*) FROM events",
        (),
        page,
        min(limit, 100),
    )
    data["items"] = [event_public(conn, e) for e in data["items"]]
    return data


def list_feed(conn: sqlite3.Connection):
    items: list[dict[str, Any]] = []
    for n in rows(conn, "SELECT * FROM news_items WHERE status = 'approved' ORDER BY created_at DESC LIMIT 20"):
        items.append({
            "id": n["id"],
            "kind": "news",
            "title": n["title"],
            "description": n["content"],
            "starts_at": None,
            "ends_at": None,
            "group": group_public(conn, n["group_id"]) if n["group_id"] else None,
            "created_by": user_public(conn, int(n["created_by_id"])) if n["created_by_id"] else None,
            "created_at": n["created_at"],
            "status": n["status"],
        })
    for e in rows(conn, "SELECT * FROM events ORDER BY created_at DESC LIMIT 20"):
        items.append({
            "id": e["id"],
            "kind": "event",
            "title": e["title"],
            "description": e["description"],
            "starts_at": e["starts_at"],
            "ends_at": e["ends_at"],
            "group": group_public(conn, e["group_id"]) if e["group_id"] else None,
            "created_by": user_public(conn, int(e["created_by_id"])) if e["created_by_id"] else None,
            "created_at": e["created_at"],
            "status": None,
        })
    items.sort(key=lambda x: x["created_at"], reverse=True)
    return items[:20]
