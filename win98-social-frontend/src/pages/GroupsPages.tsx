import { FormEvent, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useApiData } from '../hooks/useApiData';
import { Button, Input, Textarea, Window } from '../components/Win98';
import type { Group } from '../types';

export function GroupsPage() {
  const { token } = useAuth();
  const [q, setQ] = useState('');
  const { data, error, reload } = useApiData(() => api.groups(token!, q), [token, q]);

  return (
    <Window title="Группы" actions={<Link to="/groups/new">Новая группа</Link>}>
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
            <Link to={`/groups/${g.id}`}>Открыть</Link>
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
  const { token, user } = useAuth();
  const { id } = useParams();
  const { data: group, error, reload } = useApiData(() => api.groupById(token!, id!), [token, id]);
  const { data: posts, reload: reloadPosts } = useApiData(() => api.groupPosts(token!, id!), [token, id]);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');

  async function createPost() {
    if (!title.trim() || !content.trim()) return;
    await api.createPost(token!, id!, { title, content });
    setTitle('');
    setContent('');
    await reloadPosts();
  }

  return (
    <Window title={group?.name || 'Группа'} actions={<Button onClick={reload}>Обновить</Button>}>
      {error && <div className="error-box">{error}</div>}
      <p>{group?.description}</p>
      <div className="toolbar">
        <Button onClick={() => api.joinGroup(token!, id!).then(reload)}>Подписаться</Button>
        <Button onClick={() => api.leaveGroup(token!, id!).then(reload)}>Отписаться</Button>
      </div>
      {user && <div className="card">
        <h3>Создать публикацию</h3>
        <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Заголовок" />
        <Textarea value={content} onChange={(e) => setContent(e.target.value)} placeholder="Текст" />
        <Button onClick={createPost}>Опубликовать</Button>
      </div>}
      <div className="cards">
        {posts?.items?.map((post) => (
          <article className="card" key={post.id}>
            <h3>{post.title}</h3>
            <small>{post.author.full_name}</small>
            <p>{post.content}</p>
            <Link to={`/posts/${post.id}`}>Комментарии ({post.comments_count ?? 0})</Link>
          </article>
        ))}
      </div>
    </Window>
  );
}
