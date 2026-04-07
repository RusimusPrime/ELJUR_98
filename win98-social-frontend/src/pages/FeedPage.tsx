import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';
import { useApiData } from '../hooks/useApiData';
import { Button, Window } from '../components/Win98';
import { Link } from 'react-router-dom';

export function FeedPage() {
  const { token } = useAuth();
  const { data, loading, error, reload } = useApiData(() => api.feed(token!), [token]);

  return (
    <Window title="Лента публикаций и событий" actions={<Button onClick={reload}>Обновить</Button>}>
      {loading && <div>Загрузка...</div>}
      {error && <div className="error-box">{error}</div>}
      <div className="cards">
        {data?.items?.map((item) => (
          <article className="card" key={item.id}>
            <div className="card-head">
              <strong>{item.kind === 'event' ? 'Событие' : 'Новость'}</strong>
              <span>{new Date(item.starts_at ?? item.created_at ?? Date.now()).toLocaleString()}</span>
            </div>
            <h3>{item.title}</h3>
            <p>{item.description}</p>
            {'post' in item && item.post && <Link to={`/posts/${item.post.id}`}>Открыть публикацию</Link>}
          </article>
        ))}
      </div>
    </Window>
  );
}
