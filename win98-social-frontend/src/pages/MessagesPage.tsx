import { FormEvent, useMemo, useState } from 'react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useApiData } from '../hooks/useApiData';
import { Button, Input, Textarea, Window } from '../components/Win98';

export function MessagesPage() {
  const { token } = useAuth();
  const { data, error, reload } = useApiData(() => api.threads(token!), [token]);
  const [subject, setSubject] = useState('');
  const [recipient_ids, setRecipients] = useState('');
  const [content, setContent] = useState('');
  const [status, setStatus] = useState<string | null>(null);

  const threads = useMemo(() => data?.items ?? [], [data]);

  async function sendMessage(e: FormEvent) {
    e.preventDefault();
    const ids = recipient_ids.split(',').map((s) => s.trim()).filter(Boolean);
    if (!subject.trim() || !content.trim() || !ids.length) return setStatus('Заполните тему, текст и получателей');
    await api.createThread(token!, { subject, recipient_ids: ids, content });
    setSubject('');
    setRecipients('');
    setContent('');
    setStatus('Сообщение отправлено');
    await reload();
  }

  return (
    <Window title="Сообщения" actions={<Button onClick={reload}>Обновить</Button>}>
      {error && <div className="error-box">{error}</div>}
      {status && <div className="success-box">{status}</div>}
      <form onSubmit={sendMessage} className="form-grid message-form">
        <Input value={recipient_ids} onChange={(e) => setRecipients(e.target.value)} placeholder="ID получателей через запятую" />
        <Input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Тема" />
        <Textarea value={content} onChange={(e) => setContent(e.target.value)} placeholder="Текст сообщения" />
        <Button type="submit">Отправить</Button>
      </form>
      <div className="cards">
        {threads.map((thread) => (
          <article className="card" key={thread.id}>
            <h3>{thread.subject}</h3>
            <div>{thread.participants.map((p) => p.full_name).join(', ')}</div>
            <small>{thread.last_message_preview}</small>
          </article>
        ))}
      </div>
    </Window>
  );
}
