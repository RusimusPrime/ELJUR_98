import { FormEvent, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button, Input, Label, Select, Window } from '../components/Win98';

function getValidationError(data: Record<string, string>) {
  if (!data.email.includes('@')) return 'Введите корректный email';
  if (data.password.length < 6) return 'Пароль должен быть не короче 6 символов';
  if ((data.full_name || '').trim().length < 2) return 'Введите имя';
  return null;
}

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const v = getValidationError({ email, password, full_name: 'ok' });
    if (v) return setError(v);
    try {
      await login(email, password);
      navigate('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка входа');
    }
  }

  return (
    <Window title="Вход в систему">
      <form onSubmit={onSubmit} className="form-grid">
        <Label>Email</Label>
        <Input value={email} onChange={(e) => setEmail(e.target.value)} />
        <Label>Пароль</Label>
        <Input value={password} type="password" onChange={(e) => setPassword(e.target.value)} />
        {error && <div className="error-box">{error}</div>}
        <Button type="submit">Войти</Button>
        <Button type="button" onClick={() => navigate('/register')}>Регистрация</Button>
      </form>
    </Window>
  );
}

export function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [full_name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('student');
  const [class_name, setClassName] = useState('');
  const [subject, setSubject] = useState('');
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const v = getValidationError({ email, password, full_name });
    if (v) return setError(v);
    try {
      await register({ full_name, email, password, role, class_name, subject });
      navigate('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка регистрации');
    }
  }

  return (
    <Window title="Регистрация">
      <form onSubmit={onSubmit} className="form-grid">
        <Label>ФИО</Label>
        <Input value={full_name} onChange={(e) => setName(e.target.value)} />
        <Label>Email</Label>
        <Input value={email} onChange={(e) => setEmail(e.target.value)} />
        <Label>Пароль</Label>
        <Input value={password} type="password" onChange={(e) => setPassword(e.target.value)} />
        <Label>Роль</Label>
        <Select value={role} onChange={(e) => setRole(e.target.value)}>
          <option value="student">Ученик</option>
          <option value="teacher">Преподаватель</option>
          <option value="admin">Администратор</option>
        </Select>
        <Label>Класс</Label>
        <Input value={class_name} onChange={(e) => setClassName(e.target.value)} placeholder="10A" />
        <Label>Предмет</Label>
        <Input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Математика" />
        {error && <div className="error-box">{error}</div>}
        <Button type="submit">Создать аккаунт</Button>
      </form>
    </Window>
  );
}
