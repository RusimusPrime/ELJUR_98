import { FormEvent, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { useAuth } from '../context/AuthContext';

import {
  Button,
  Input,
  Label,
  Select,
  Window
} from '../components/Win98';

function validateLogin(
  email: string,
  password: string
) {
  if (!email.includes('@')) {
    return 'Введите корректный email';
  }

  if (!password.trim()) {
    return 'Введите пароль';
  }

  return null;
}

function validateRegister(
  full_name: string,
  email: string,
  password: string
) {
  if (full_name.trim().length < 2) {
    return 'Введите имя';
  }

  if (!email.includes('@')) {
    return 'Введите корректный email';
  }

  if (password.length < 6) {
    return 'Пароль должен быть не короче 6 символов';
  }

  return null;
}

export function LoginPage() {
  const { login } = useAuth();

  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [error, setError] =
    useState<string | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();

    const validation = validateLogin(
      email,
      password
    );

    if (validation) {
      return setError(validation);
    }

    try {
      await login(email, password);

      navigate('/');
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Ошибка входа'
      );
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-window">
        <Window title="Вход в систему">
          <form
            onSubmit={onSubmit}
            className="form-grid auth-grid"
          >
            <Label>Email</Label>

            <Input
              value={email}
              onChange={(e) =>
                setEmail(e.target.value)
              }
            />

            <Label>Пароль</Label>

            <Input
              value={password}
              type="password"
              onChange={(e) =>
                setPassword(e.target.value)
              }
            />

            {error && (
              <div className="error-box">
                {error}
              </div>
            )}

            <Button type="submit">
              Войти
            </Button>

            <Button
              type="button"
              onClick={() =>
                navigate('/register')
              }
            >
              Регистрация
            </Button>
          </form>
        </Window>
      </div>
    </div>
  );
}

export function RegisterPage() {
  const { register } = useAuth();

  const navigate = useNavigate();

  const [full_name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [role, setRole] =
    useState('student');

  const [error, setError] =
    useState<string | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();

    const validation = validateRegister(
      full_name,
      email,
      password
    );

    if (validation) {
      return setError(validation);
    }

    try {
      await register({
        full_name,
        email,
        password,
        role
      });

      navigate('/');
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Ошибка регистрации'
      );
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-window">
        <Window title="Регистрация">
          <form
            onSubmit={onSubmit}
            className="form-grid auth-grid"
          >
            <Label>Имя</Label>

            <Input
              value={full_name}
              onChange={(e) =>
                setName(e.target.value)
              }
            />

            <Label>Email</Label>

            <Input
              value={email}
              onChange={(e) =>
                setEmail(e.target.value)
              }
            />

            <Label>Пароль</Label>

            <Input
              value={password}
              type="password"
              onChange={(e) =>
                setPassword(e.target.value)
              }
            />

            <Label>Роль</Label>

            <Select
              value={role}
              onChange={(e) =>
                setRole(e.target.value)
              }
            >
              <option value="student">
                Ученик
              </option>

              <option value="teacher">
                Преподаватель
              </option>

              <option value="admin">
                Администратор
              </option>
            </Select>

            {error && (
              <div className="error-box">
                {error}
              </div>
            )}

            <Button type="submit">
              Создать аккаунт
            </Button>
          </form>
        </Window>
      </div>
    </div>
  );
}