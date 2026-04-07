import { FormEvent, useState } from 'react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useApiData } from '../hooks/useApiData';
import { Button, Input, Textarea, Select, Window } from '../components/Win98';

export function ProfilePage() {
  const { token, user, refreshUser } = useAuth();
  const [form, setForm] = useState({ full_name: user?.full_name ?? '', bio: user?.bio ?? '', class_name: user?.class_name ?? '', subject: user?.subject ?? '' });
  const [status, setStatus] = useState<string | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    await api.updateMe(token!, form);
    await refreshUser();
    setStatus('Профиль обновлён');
  }

  return (
    <Window title="Профиль">
      <form onSubmit={onSubmit} className="form-grid">
        <Input value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} />
        <Textarea value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} />
        <Input value={form.class_name} onChange={(e) => setForm({ ...form, class_name: e.target.value })} placeholder="Класс" />
        <Input value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} placeholder="Предмет" />
        <Button type="submit">Сохранить</Button>
      </form>
      {status && <div className="success-box">{status}</div>}
    </Window>
  );
}

export function SearchPage() {
  const { token } = useAuth();
  const [q, setQ] = useState('');
  const [mode, setMode] = useState<'users' | 'groups'>('users');
  const dataHook = useApiData(() => mode === 'users' ? api.searchUsers(token!, q) : api.searchGroups(token!, q), [token, q, mode]);

  return (
    <Window title="Поиск">
      <div className="toolbar">
        <Select value={mode} onChange={(e) => setMode(e.target.value as 'users' | 'groups')}>
          <option value="users">Пользователи</option>
          <option value="groups">Группы</option>
        </Select>
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Поиск" />
        <Button onClick={dataHook.reload}>Найти</Button>
      </div>
      <div className="cards">
        {mode === 'users' && dataHook.data?.items?.map((u) => <div className="card" key={u.id}>{u.full_name} · {u.class_name || u.subject}</div>)}
        {mode === 'groups' && dataHook.data?.items?.map((g) => <div className="card" key={g.id}>{g.name}</div>)}
      </div>
    </Window>
  );
}

export function AdminPage() {
  const { token, user } = useAuth();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [kind, setKind] = useState<'news' | 'event'>('event');
  const [starts_at, setStartsAt] = useState('');
  const [status, setStatus] = useState<string | null>(null);

  async function createItem() {
    if (user?.role !== 'admin') return setStatus('Доступ только для администрации');
    await api.createEvent(token!, { title, description, kind, starts_at: kind === 'event' ? starts_at : null });
    setStatus('Создано');
    setTitle('');
    setDescription('');
    setStartsAt('');
  }

  return (
    <Window title="Админ-панель">
      <div className="form-grid">
        <Select value={kind} onChange={(e) => setKind(e.target.value as 'news' | 'event')}>
          <option value="event">Событие</option>
          <option value="news">Новость</option>
        </Select>
        <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Заголовок" />
        <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Описание" />
        {kind === 'event' && <Input type="datetime-local" value={starts_at} onChange={(e) => setStartsAt(e.target.value)} />}
        <Button onClick={createItem}>Создать</Button>
        {status && <div className="success-box">{status}</div>}
      </div>
    </Window>
  );
}
