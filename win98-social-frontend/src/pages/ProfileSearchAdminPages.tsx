import { FormEvent, useState } from 'react';
import { api } from '../api/client';
import { Button, Input, Select, Textarea, Window } from '../components/Win98';
import { useAuth } from '../context/AuthContext';
import { useApiData } from '../hooks/useApiData';
import type { Group, NewsItem, Paginated, User } from '../types';

export function ProfilePage() {
  const { token, user, refreshUser } = useAuth();
  const [form, setForm] = useState({ full_name: user?.full_name ?? '', bio: user?.bio ?? '' });
  const [status, setStatus] = useState<string | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    await api.updateMe(token!, form);
    await refreshUser();
    setStatus('Профиль обновлён');
  }

  return (
    <Window title="Профиль">
      <div className="card" style={{ marginBottom: 12 }}>
        <div className="meta-line">Твой ID: {user?.id}</div>
      </div>
      <form onSubmit={onSubmit} className="form-grid">
        <Input value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} placeholder="Имя" />
        <Textarea value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} placeholder="О себе" />
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
  const usersHook = useApiData<Paginated<User>>(() => api.users(token!, q), [token, q]);
  const groupsHook = useApiData<Paginated<Group>>(() => api.groups(token!, q), [token, q]);

  return (
    <Window title="Поиск">
      <div className="toolbar">
        <Select value={mode} onChange={(e) => setMode(e.target.value as 'users' | 'groups')}>
          <option value="users">Пользователи</option>
          <option value="groups">Группы</option>
        </Select>
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Поиск" />
      </div>
      <div className="cards" style={{ marginTop: 12 }}>
        {mode === 'users' && usersHook.data?.items?.map((u) => (
          <article className="card" key={u.id}>
            <strong>{u.full_name}</strong>
            <div>{u.email}</div>
            <small>ID: {u.id}</small>
          </article>
        ))}
        {mode === 'groups' && groupsHook.data?.items?.map((g) => (
          <article className="card" key={g.id}>
            <strong>{g.name}</strong>
            <div>{g.description}</div>
          </article>
        ))}
      </div>
    </Window>
  );
}

export function AdminPage() {
  const { token, user } = useAuth();
  const [tab, setTab] = useState<'news' | 'events' | 'review' | 'users'>('news');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [startsAt, setStartsAt] = useState('');
  const [note, setNote] = useState('');
  const [status, setStatus] = useState<string | null>(null);
  const [usersQuery, setUsersQuery] = useState('');
  const [roleDrafts, setRoleDrafts] = useState<Record<number, string>>({});
  const newsHook = useApiData<Paginated<NewsItem>>(() => api.pendingNews(token!), [token]);
  const usersHook = useApiData<Paginated<User>>(() => api.adminUsers(token!, usersQuery), [token, usersQuery]);

  if (user?.role !== 'admin') {
    return (
      <Window title="Админ-панель">
        <div className="error-box">Доступ только для администратора</div>
      </Window>
    );
  }

  async function createItem() {
    if (!title.trim() || !content.trim()) return setStatus('Заполни заголовок и текст');
    if (tab === 'news') {
      await api.createNews(token!, { title, content });
      setStatus('Новость отправлена на подтверждение');
    } else {
      await api.createEvent(token!, { title, description: content, starts_at: startsAt });
      setStatus('Мероприятие создано');
    }
    setTitle('');
    setContent('');
    setStartsAt('');
  }

  async function approve(id: string) {
    await api.approveNews(token!, id, note);
    setNote('');
    setStatus('Новость одобрена');
    await newsHook.reload();
  }

  async function reject(id: string) {
    await api.rejectNews(token!, id, note);
    setNote('');
    setStatus('Новость отклонена');
    await newsHook.reload();
  }

  async function saveRole(id: number) {
    const role = roleDrafts[id];
    if (!role) return;
    await api.updateUserRole(token!, id, role);
    setStatus(`Роль пользователя ${id} обновлена`);
    await usersHook.reload();
  }

  async function removeUser(id: number) {
    if (!confirm(`Удалить пользователя ${id}?`)) return;
    await api.deleteUser(token!, id);
    setStatus(`Пользователь ${id} удалён`);
    await usersHook.reload();
  }

  return (
    <Window title="Админ-панель">
      <div className="toolbar">
        <Button onClick={() => setTab('news')}>Создать новость</Button>
        <Button onClick={() => setTab('events')}>Создать мероприятие</Button>
        <Button onClick={() => setTab('review')}>Подтверждение новостей</Button>
        <Button onClick={() => setTab('users')}>Пользователи</Button>
      </div>

      <div className="admin-body">
        {(tab === 'news' || tab === 'events') && (
          <div className="card">
            <div className="form-grid">
              <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Заголовок" />
              <Textarea value={content} onChange={(e) => setContent(e.target.value)} placeholder={tab === 'news' ? 'Текст новости' : 'Описание мероприятия'} />
              {tab === 'events' && (
                <Input type="datetime-local" value={startsAt} onChange={(e) => setStartsAt(e.target.value)} />
              )}
              <Button onClick={createItem}>{tab === 'news' ? 'Отправить на подтверждение' : 'Создать мероприятие'}</Button>
            </div>
          </div>
        )}

        {tab === 'review' && (
          <div className="form-grid">
            <Input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Комментарий к решению" />
            <div className="cards">
              {newsHook.data?.items?.map((n) => (
                <article className="card" key={n.id}>
                  <h3>{n.title}</h3>
                  <p>{n.content}</p>
                  <small>Автор: {n.created_by?.full_name} · ID {n.created_by?.id}</small>
                  <div className="toolbar">
                    <Button onClick={() => approve(n.id)}>Одобрить</Button>
                    <Button onClick={() => reject(n.id)}>Отклонить</Button>
                  </div>
                </article>
              ))}
            </div>
          </div>
        )}

        {tab === 'users' && (
          <div className="form-grid">
            <div className="toolbar">
              <Input value={usersQuery} onChange={(e) => setUsersQuery(e.target.value)} placeholder="Поиск пользователей" />
              <Button onClick={usersHook.reload}>Найти</Button>
            </div>
            <div className="cards">
              {usersHook.data?.items?.map((u) => (
                <article className="card" key={u.id}>
                  <strong>{u.full_name}</strong>
                  <div>{u.email}</div>
                  <small>ID: {u.id}</small>
                  <div className="toolbar" style={{ marginTop: 8 }}>
                    <Select value={roleDrafts[u.id] || u.role} onChange={(e) => setRoleDrafts({ ...roleDrafts, [u.id]: e.target.value })}>
                      <option value="student">student</option>
                      <option value="teacher">teacher</option>
                      <option value="admin">admin</option>
                    </Select>
                    <Button onClick={() => saveRole(u.id)}>Сохранить роль</Button>
                    <Button onClick={() => removeUser(u.id)}>Удалить</Button>
                  </div>
                </article>
              ))}
            </div>
          </div>
        )}

        {status && <div className="success-box">{status}</div>}
      </div>
    </Window>
  );
}
