from __future__ import annotations

from collections import defaultdict
from typing import DefaultDict, Set

from fastapi import WebSocket


class ConnectionManager:
    def __init__(self) -> None:
        self.active: DefaultDict[str, Set[WebSocket]] = defaultdict(set)

    async def connect(self, room_id: str, websocket: WebSocket) -> None:
        await websocket.accept()
        self.active[room_id].add(websocket)

    def disconnect(self, room_id: str, websocket: WebSocket) -> None:
        sockets = self.active.get(room_id)
        if not sockets:
            return
        sockets.discard(websocket)
        if not sockets:
            self.active.pop(room_id, None)

    async def broadcast(self, room_id: str, payload: dict) -> None:
        for socket in list(self.active.get(room_id, set())):
            try:
                await socket.send_json(payload)
            except Exception:
                self.disconnect(room_id, socket)
