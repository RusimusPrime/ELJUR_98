
from __future__ import annotations

from pathlib import Path
from typing import Any

from fastapi import Depends, FastAPI, HTTPException, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware

from .config import settings
from .db import connect, get_db, utcnow_iso
from .dependencies import get_current_user
from .repository import group_public, paginate, row
from .schemas import (
    AuthResponse,
    ChatCreate,
    ChatMessagePublic,
    ChatPublic,
    ChatSend,
    EventCreate,
    EventPublic,
    GroupCreate,
    GroupMessageCreate,
    GroupMessagePublic,
    GroupPublic,
    GroupUpdate,
    LoginIn,
    NewsCreate,
    NewsPublic,
    NewsReviewAction,
    Paginated,
    RegisterIn,
    UserPublic,
)
from .service import (
    authenticate_user,
    create_chat,
    create_event,
    create_group,
    create_group_message,
    create_news,
    delete_user,
    list_chat_messages,
    list_chats,
    list_events,
    list_feed,
    list_group_messages,
    list_pending_news,
    list_users,
    register_user,
    review_news,
    send_chat_message,
    update_group,
    update_me,
    update_user_role,
)
from .websocket import ConnectionManager

app = FastAPI(title="ELJUR 98 API", version="3.0.0")
manager = ConnectionManager()

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:4173",
        "http://127.0.0.1:4173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def _needs_schema_reset(conn) -> bool:
    tables = {r[0] for r in conn.execute("SELECT name FROM sqlite_master WHERE type='table'").fetchall()}
    if "users" not in tables:
        return False
    cols = conn.execute("PRAGMA table_info(users)").fetchall()
    id_col = next((c for c in cols if c[1] == "id"), None)
    return bool(id_col and str(id_col[2]).upper() != "INTEGER")


def init_db() -> None:
    schema_path = Path(__file__).resolve().parents[1] / "migrations" / "001_initial.sql"
    db_path = Path(settings.db_path)
    db_path.parent.mkdir(parents=True, exist_ok=True)

    conn = connect()
    try:
        if _needs_schema_reset(conn):
            conn.close()
            try:
                db_path.unlink()
            except FileNotFoundError:
                pass
            conn = connect()

        conn.executescript(schema_path.read_text(encoding="utf-8"))
        conn.commit()
    finally:
        conn.close()


@app.on_event("startup")
def on_startup():
    init_db()


@app.get("/health")
def health():
    return {"ok": True}


@app.post("/auth/register", response_model=AuthResponse)
def register(data: RegisterIn, db=Depends(get_db)):
    user, token = register_user(db, data.full_name, data.email, data.password, data.role)
    return {"access_token": token, "user": user}


@app.post("/auth/login", response_model=AuthResponse)
def login(data: LoginIn, db=Depends(get_db)):
    user, token = authenticate_user(db, data.email, data.password)
    return {"access_token": token, "user": user}


@app.get("/users/me", response_model=UserPublic)
def me(current_user=Depends(get_current_user)):
    return current_user


@app.patch("/users/me", response_model=UserPublic)
def patch_me(data: dict[str, Any], current_user=Depends(get_current_user), db=Depends(get_db)):
    return update_me(db, current_user["id"], data)


@app.get("/users", response_model=Paginated)
def users(query: str = "", page: int = 1, limit: int = 20, db=Depends(get_db), current_user=Depends(get_current_user)):
    return list_users(db, query, page, limit)


@app.get("/admin/users", response_model=Paginated)
def admin_users(query: str = "", page: int = 1, limit: int = 20, db=Depends(get_db), current_user=Depends(get_current_user)):
    if current_user["role"] != "admin":
        raise HTTPException(403, "Только администратор")
    return list_users(db, query, page, limit)


@app.patch("/admin/users/{user_id}", response_model=UserPublic)
def admin_update_user(user_id: int, data: dict[str, Any], current_user=Depends(get_current_user), db=Depends(get_db)):
    role = str(data.get("role", "")).strip()
    return update_user_role(db, current_user, user_id, role)


@app.delete("/admin/users/{user_id}")
def admin_delete_user(user_id: int, current_user=Depends(get_current_user), db=Depends(get_db)):
    return delete_user(db, current_user, user_id)


@app.get("/groups", response_model=Paginated)
def groups(query: str = "", page: int = 1, limit: int = 20, db=Depends(get_db), current_user=Depends(get_current_user)):
    q = f"%{query.strip().lower()}%"
    data = paginate(
        db,
        """
        SELECT * FROM groups
        WHERE LOWER(name) LIKE ? OR LOWER(COALESCE(description, '')) LIKE ?
        ORDER BY created_at DESC
        """,
        """
        SELECT COUNT(*) FROM groups
        WHERE LOWER(name) LIKE ? OR LOWER(COALESCE(description, '')) LIKE ?
        """,
        (q, q),
        page,
        min(limit, 100),
    )
    data["items"] = [group_public(db, g["id"]) for g in data["items"]]
    return data


@app.post("/groups", response_model=GroupPublic)
def new_group(data: GroupCreate, current_user=Depends(get_current_user), db=Depends(get_db)):
    return create_group(db, current_user, data.model_dump())


@app.get("/groups/{group_id}", response_model=GroupPublic)
def group_detail(group_id: str, current_user=Depends(get_current_user), db=Depends(get_db)):
    return group_public(db, group_id)


@app.patch("/groups/{group_id}", response_model=GroupPublic)
def edit_group(group_id: str, data: GroupUpdate, current_user=Depends(get_current_user), db=Depends(get_db)):
    return update_group(db, current_user, group_id, data.model_dump(exclude_none=True))


@app.get("/groups/{group_id}/messages", response_model=Paginated)
def group_messages(group_id: str, page: int = 1, limit: int = 50, current_user=Depends(get_current_user), db=Depends(get_db)):
    return list_group_messages(db, group_id, page, limit)


@app.post("/groups/{group_id}/messages", response_model=GroupMessagePublic)
def post_group_message(group_id: str, data: GroupMessageCreate, current_user=Depends(get_current_user), db=Depends(get_db)):
    return create_group_message(db, current_user, group_id, data.content)


@app.get("/chats", response_model=Paginated)
def chats(page: int = 1, limit: int = 20, current_user=Depends(get_current_user), db=Depends(get_db)):
    return list_chats(db, current_user["id"], page, limit)


@app.post("/chats", response_model=ChatPublic)
def create_new_chat(data: ChatCreate, current_user=Depends(get_current_user), db=Depends(get_db)):
    return create_chat(db, current_user, data.recipient_ids, data.content)


@app.get("/chats/{chat_id}/messages", response_model=Paginated)
def chat_messages(chat_id: str, page: int = 1, limit: int = 100, current_user=Depends(get_current_user), db=Depends(get_db)):
    return list_chat_messages(db, current_user, chat_id, page, limit)


@app.post("/chats/{chat_id}/messages", response_model=ChatMessagePublic)
def post_chat_message(chat_id: str, data: ChatSend, current_user=Depends(get_current_user), db=Depends(get_db)):
    return send_chat_message(db, current_user, chat_id, data.content)


@app.get("/messages/threads", response_model=Paginated)
def threads(page: int = 1, limit: int = 20, current_user=Depends(get_current_user), db=Depends(get_db)):
    return list_chats(db, current_user["id"], page, limit)


@app.post("/messages/threads", response_model=ChatPublic)
def start_thread(data: ChatCreate, current_user=Depends(get_current_user), db=Depends(get_db)):
    return create_chat(db, current_user, data.recipient_ids, data.content)


@app.get("/messages/threads/{thread_id}/messages", response_model=Paginated)
def thread_messages(thread_id: str, page: int = 1, limit: int = 100, current_user=Depends(get_current_user), db=Depends(get_db)):
    return list_chat_messages(db, current_user, thread_id, page, limit)


@app.post("/messages/threads/{thread_id}/messages", response_model=ChatMessagePublic)
def post_thread_message(thread_id: str, data: ChatSend, current_user=Depends(get_current_user), db=Depends(get_db)):
    return send_chat_message(db, current_user, thread_id, data.content)


@app.post("/news", response_model=NewsPublic)
def submit_news(data: NewsCreate, current_user=Depends(get_current_user), db=Depends(get_db)):
    return create_news(db, current_user, data.model_dump())


@app.get("/news/pending", response_model=Paginated)
def pending_news(page: int = 1, limit: int = 20, current_user=Depends(get_current_user), db=Depends(get_db)):
    return list_pending_news(db, current_user, page, limit)


@app.post("/news/{news_id}/approve", response_model=NewsPublic)
def approve_news(news_id: str, action: NewsReviewAction, current_user=Depends(get_current_user), db=Depends(get_db)):
    return review_news(db, current_user, news_id, "approved", action.note)


@app.post("/news/{news_id}/reject", response_model=NewsPublic)
def reject_news(news_id: str, action: NewsReviewAction, current_user=Depends(get_current_user), db=Depends(get_db)):
    return review_news(db, current_user, news_id, "rejected", action.note)


@app.get("/events", response_model=Paginated)
def events(page: int = 1, limit: int = 20, current_user=Depends(get_current_user), db=Depends(get_db)):
    return list_events(db, page, limit)


@app.post("/events", response_model=EventPublic)
def new_event(data: EventCreate, current_user=Depends(get_current_user), db=Depends(get_db)):
    return create_event(db, current_user, data.model_dump())


@app.get("/feed", response_model=Paginated)
def feed(current_user=Depends(get_current_user), db=Depends(get_db)):
    items = list_feed(db)
    return {"items": items, "page": 1, "limit": 20, "total": len(items)}


@app.websocket("/ws/chats/{chat_id}")
async def ws_chat(websocket: WebSocket, chat_id: str):
    token = websocket.query_params.get("token")
    if not token:
        await websocket.close(code=4401)
        return

    from .security import decode_token

    try:
        payload = decode_token(token)
        user_id = int(payload.get("sub"))
    except Exception as e:
        print("TOKEN ERROR:", e)
        await websocket.close(code=4401)
        return

    # Проверка пользователя и доступа к чату
    with connect() as db:
        user = row(
            db,
            "SELECT id, full_name, email, role, bio, avatar_url FROM users WHERE id = ?",
            (user_id,)
        )

        if not user:
            await websocket.close(code=4401)
            return

        allowed = row(
            db,
            "SELECT 1 FROM chat_participants WHERE chat_id = ? AND user_id = ?",
            (chat_id, user_id)
        )

        if not allowed:
            await websocket.close(code=4403)
            return

    room = f"chat:{chat_id}"
    await manager.connect(room, websocket)

    try:
        while True:
            # -------- RECEIVE --------
            try:
                data = await websocket.receive_json()
            except WebSocketDisconnect:
                print("WS DISCONNECT (receive loop)")
                break

            if not isinstance(data, dict):
                continue

            content = str(data.get("content", "")).strip()

            if not content:
                await websocket.send_json({
                    "type": "error",
                    "message": "Пустое сообщение"
                })
                continue

            # -------- SAVE + BROADCAST --------
            try:
                with connect() as db:
                    message = send_chat_message(db, user, chat_id, content)

                await manager.broadcast(room, {
                    "type": "message",
                    "message": message
                })

            except Exception as e:
                print("SEND MESSAGE ERROR:", e)
                await websocket.send_json({
                    "type": "error",
                    "message": str(e)
                })

    except WebSocketDisconnect:
        print("WS DISCONNECT:", chat_id)

    except Exception as e:
        print("WS FATAL ERROR:", e)

    finally:
        manager.disconnect(room, websocket)
        try:
            await websocket.close()
        except Exception:
            pass