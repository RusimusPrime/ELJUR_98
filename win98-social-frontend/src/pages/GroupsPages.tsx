import { FormEvent, useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api } from '../api/client';
import { API_URL } from '../api/http';
import { Button, Input, Textarea, Window } from '../components/Win98';
import { useAuth } from '../context/AuthContext';
import { useApiData } from '../hooks/useApiData';
import type { Group, GroupMessage } from '../types';

export function GroupsPage() {
  const { token } = useAuth();
  const [q, setQ] = useState('');
  const { data, error, reload } = useApiData(() => api.groups(token!, q), [token, q]);

  return (
    <Window title="Группы" actions={<Link className="topbar-link" to="/groups/new">Новая группа</Link>}>
      <div className="toolbar">
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Поиск по названию" />
        <Button onClick={reload}>Искать</Button>
      </div>
      {error && <div className="error-box">{error}</div>}
      <div className="cards">
        {data?.items?.map((g) => (
          <article className="card" key={g.id}>
            <h3>{g.name}</h3>
            <p>{g.description}</p>
            <small>{g.subscribers_count ?? 0} участников</small>
            <div className="toolbar"><Link to={`/groups/${g.id}`}>Открыть чат</Link></div>
          </article>
        ))}
      </div>
    </Window>
  );
}

export function GroupEditorPage() {
  const { token } = useAuth();
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);
  const [form, setForm] = useState<Partial<Group>>({ name: '', description: '', is_private: false });
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!form.name?.trim()) return setError('Название группы обязательно');
    try {
      if (isEdit && id) await api.updateGroup(token!, id, form);
      else await api.createGroup(token!, form);
      navigate('/groups');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка сохранения');
    }
  }

  return (
    <Window title={isEdit ? 'Редактирование группы' : 'Создание группы'}>
      <form className="form-grid" onSubmit={onSubmit}>
        <Input value={form.name || ''} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Название" />
        <Textarea value={form.description || ''} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Описание" />
        {error && <div className="error-box">{error}</div>}
        <Button type="submit">Сохранить</Button>
      </form>
    </Window>
  );
}

export function GroupDetailPage() {
  const { token } = useAuth();
  const { id } = useParams();
  const { data: group, error, reload } = useApiData(() => api.groupById(token!, id!), [token, id]);
  const { data: messages, reload: reloadMessages } = useApiData(() => api.groupMessages(token!, id!), [token, id]);
  const [draft, setDraft] = useState('');
  const [status, setStatus] = useState<string | null>(null);

  async function sendMessage(e: FormEvent) {
    e.preventDefault();
    if (!draft.trim()) return;
    try {
      await api.sendGroupMessage(token!, id!, draft);
      setDraft('');
      await reloadMessages();
    } catch (err) {
      setStatus(err instanceof Error ? err.message : 'Не удалось отправить сообщение');
    }
  }

  return (
    <Window title={group?.name || 'Группа'} actions={<Button onClick={reload}>Обновить</Button>}>
      {error && <div className="error-box">{error}</div>}
      {status && <div className="success-box">{status}</div>}
      <p>{group?.description}</p>

      <div className="card messenger-thread">
        <h3>Чат группы</h3>
        <form onSubmit={sendMessage} className="message-compose">
          <Textarea value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="Написать сообщение" />
          <Button type="submit">Отправить</Button>
        </form>
      </div>

      <div className="cards message-stack">
        {messages?.items?.map((message: GroupMessage) => (
          <article className="chat-bubble incoming" key={message.id}>
            <div className="chat-meta">{message.sender.full_name} · ID {message.sender.id}</div>
            <div>{message.content}</div>
            <small>{new Date(message.created_at).toLocaleString()}</small>
          </article>
        ))}
      </div>
    </Window>
  );
}
