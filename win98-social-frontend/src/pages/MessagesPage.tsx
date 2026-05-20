import { FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import { api } from '../api/client';
import { API_URL } from '../api/http';
import { Button, Input, Textarea, Window } from '../components/Win98';
import { useAuth } from '../context/AuthContext';
import { useApiData } from '../hooks/useApiData';
import type { Chat, ChatMessage, User } from '../types';

export function MessagesPage() {
  const { token, user } = useAuth();
  const chatsHook = useApiData(() => api.chats(token!), [token]);
  const [search, setSearch] = useState('');
  const usersHook = useApiData(() => api.searchUsers(token!, search), [token, search]);
  const [selectedUsers, setSelectedUsers] = useState<User[]>([]);
  const [content, setContent] = useState('');
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState('');
  const [status, setStatus] = useState<string | null>(null);
  const socketRef = useRef<WebSocket | null>(null);

  const chats = useMemo(() => chatsHook.data?.items ?? [], [chatsHook.data]);
  const activeChat = useMemo(() => chats.find((chat) => chat.id === selectedChatId) ?? null, [chats, selectedChatId]);
  const users = useMemo(() => (usersHook.data?.items ?? []).filter((u) => u.id !== user?.id), [usersHook.data, user?.id]);

  useEffect(() => {
    if (!token || !selectedChatId) {
      setMessages([]);
      return;
    }

    let alive = true;
    api.chatMessages(token, selectedChatId)
      .then((res) => {
        if (alive) setMessages(res.items ?? []);
      })
      .catch(() => {
        if (alive) setMessages([]);
      });

    const wsBase = API_URL.replace(/^http/, 'ws');
    const socket = new WebSocket(`${wsBase}/ws/chats/${selectedChatId}?token=${encodeURIComponent(token)}`);
    socketRef.current = socket;

    socket.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data);
        if (payload.type === 'message' && payload.message) {
          setMessages((prev) => [...prev, payload.message]);
        }
      } catch {
        // ignore
      }
    };

    return () => {
      alive = false;
      socket.close();
      socketRef.current = null;
    };
  }, [token, selectedChatId]);

  async function sendChatMessage(e: FormEvent) {
    e.preventDefault();
    if (!selectedChatId || !draft.trim()) return;
    const socket = socketRef.current;
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({ content: draft }));
      setDraft('');
      return;
    }
    await api.sendChatMessage(token!, selectedChatId, draft);
    setDraft('');
    const res = await api.chatMessages(token!, selectedChatId);
    setMessages(res.items ?? []);
  }

  function toggleUser(u: User) {
    setSelectedUsers((prev) => (prev.some((x) => x.id === u.id) ? prev.filter((x) => x.id !== u.id) : [...prev, u]));
  }

  async function createChat(e: FormEvent) {
    e.preventDefault();
    if (!content.trim() || !selectedUsers.length) {
      setStatus('Выбери хотя бы одного человека и напиши первое сообщение');
      return;
    }
    const created = await api.createChat(token!, { recipient_ids: selectedUsers.map((u) => u.id), content });
    setSelectedUsers([]);
    setContent('');
    setStatus('Чат создан');
    setSelectedChatId(created.id);
    await chatsHook.reload();
  }

  return (
    <Window title="Чаты" actions={<Button onClick={chatsHook.reload}>Обновить</Button>}>
      {chatsHook.error && <div className="error-box">{chatsHook.error}</div>}
      {status && <div className="success-box">{status}</div>}

      <div className="messenger-layout">
        <aside className="messenger-sidebar card">
          <h3>Новый чат</h3>
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Поиск людей" />
          <div className="people-list">
            {users.map((u) => {
              const selected = selectedUsers.some((x) => x.id === u.id);
              return (
                <button
                  type="button"
                  className={`people-pill ${selected ? 'active' : ''}`}
                  key={u.id}
                  onClick={() => toggleUser(u)}
                >
                  <strong>{u.full_name}</strong>
                  <span>ID {u.id}</span>
                </button>
              );
            })}
          </div>
          <form onSubmit={createChat} className="form-grid" style={{ marginTop: 12 }}>
            <div className="selected-line">
              {selectedUsers.map((u) => `${u.full_name} (ID ${u.id})`).join(', ') || 'Никто не выбран'}
            </div>
            <Textarea value={content} onChange={(e) => setContent(e.target.value)} placeholder="Первое сообщение" />
            <Button type="submit">Создать чат</Button>
          </form>
        </aside>

        <section className="messenger-threads card">
          <h3>Диалоги</h3>
          <div className="thread-list">
            {chats.map((chat: Chat) => (
              <button
                type="button"
                key={chat.id}
                className={`thread-item ${chat.id === selectedChatId ? 'active' : ''}`}
                onClick={() => setSelectedChatId(chat.id)}
              >
                <div className="thread-title">Чат #{chat.id}</div>
                <div className="thread-preview">
                  {chat.participants.map((p) => `${p.full_name} (ID ${p.id})`).join(', ')}
                </div>
                <small>{chat.last_message_preview}</small>
              </button>
            ))}
          </div>
        </section>

        <section className="messenger-chat card">
          {activeChat ? (
            <>
              <div className="chat-header">
                <div>
                  <h3>Диалог</h3>
                  <div className="meta-line">
                    {activeChat.participants.map((p) => `${p.full_name} (ID ${p.id})`).join(', ')}
                  </div>
                </div>
              </div>

              <div className="chat-feed">
                {messages.map((message) => (
                  <article className={`chat-message ${message.sender.id === user?.id ? 'outgoing' : 'incoming'}`} key={message.id}>
                    <div className="chat-meta">{message.sender.full_name} · ID {message.sender.id}</div>
                    <div className="chat-bubble-text">{message.content}</div>
                    <small>{new Date(message.created_at).toLocaleString()}</small>
                  </article>
                ))}
              </div>

              <form onSubmit={sendChatMessage} className="chat-compose">
                <Textarea value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="Написать сообщение" />
                <Button type="submit">Отправить</Button>
              </form>
            </>
          ) : (
            <div className="empty-state">Выбери диалог слева или создай новый чат</div>
          )}
        </section>
      </div>
    </Window>
  );
}
