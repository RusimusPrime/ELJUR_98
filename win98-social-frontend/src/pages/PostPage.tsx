import { FormEvent, useState } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useApiData } from '../hooks/useApiData';
import { Button, Textarea, Window } from '../components/Win98';

export function PostPage() {
  const { token } = useAuth();
  const { id } = useParams();
  const [comment, setComment] = useState('');
  const { data: comments, reload } = useApiData(() => api.comments(token!, id!), [token, id]);
  const [status, setStatus] = useState<string | null>(null);

  async function addComment(e: FormEvent) {
    e.preventDefault();
    if (!comment.trim()) return;
    await api.addComment(token!, id!, comment);
    setComment('');
    setStatus('Комментарий добавлен');
    await reload();
  }

  return (
    <Window title="Публикация">
      <form onSubmit={addComment} className="form-grid">
        <Textarea value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Ваш комментарий" />
        <Button type="submit">Отправить комментарий</Button>
      </form>
      {status && <div className="success-box">{status}</div>}
      <div className="cards">
        {comments?.items?.map((c) => (
          <article className="card" key={c.id}>
            <h4>{c.author.full_name}</h4>
            <p>{c.content}</p>
          </article>
        ))}
      </div>
    </Window>
  );
}
