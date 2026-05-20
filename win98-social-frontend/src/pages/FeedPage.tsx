import { FormEvent, useState } from 'react';
import { api } from '../api/client';
import { Button, Input, Textarea, Window } from '../components/Win98';
import { useAuth } from '../context/AuthContext';
import { useApiData } from '../hooks/useApiData';

export function FeedPage() {
  const { token } = useAuth();

  const {
    data,
    loading,
    error,
    reload
  } = useApiData(() => api.feed(token!), [token]);

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [status, setStatus] = useState<string | null>(null);

  const items = data?.items ?? [];

  async function submitNews(e: FormEvent) {
    e.preventDefault();

    if (!title.trim() || !content.trim()) {
      return;
    }

    try {
      await api.createNews(token!, {
        title,
        content
      });

      setTitle('');
      setContent('');

      setStatus('Новость отправлена на подтверждение');

      await reload();
    } catch (err) {
      setStatus(
        err instanceof Error
          ? err.message
          : 'Ошибка отправки новости'
      );
    }
  }

  return (
    <Window
      title="Лента"
      actions={
        <Button onClick={reload}>
          Обновить
        </Button>
      }
    >
      {loading && !data && (
        <div className="card">
          Загрузка...
        </div>
      )}

      {error && (
        <div className="error-box">
          {error}
        </div>
      )}

      <form
        onSubmit={submitNews}
        className="card composer-card"
      >
        <h3>Предложить новость</h3>

        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Заголовок"
        />

        <Textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Текст новости"
        />

        <Button type="submit">
          Отправить на подтверждение
        </Button>

        {status && (
          <div className="success-box">
            {status}
          </div>
        )}
      </form>

      <div className="cards">
        {items.length === 0 ? (
          <div className="card">
            Пока нет новостей и мероприятий
          </div>
        ) : (
          items.map((item) => (
            <article
              className="card"
              key={item.id}
            >
              <div className="card-head">
                <strong>
                  {item.kind === 'event'
                    ? 'Событие'
                    : 'Новость'}
                </strong>

                <span>
                  {new Date(
                    item.starts_at ?? item.created_at
                  ).toLocaleString()}
                </span>
              </div>

              <h3>{item.title}</h3>

              <p>
                {item.description || item.content}
              </p>
            </article>
          ))
        )}
      </div>
    </Window>
  );
}