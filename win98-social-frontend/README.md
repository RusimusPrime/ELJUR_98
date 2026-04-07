# ELJUR 98 Frontend

Frontend на React + TypeScript со стилем Windows 98 и подключением к backend через `VITE_API_URL`.

## Запуск

```bash
npm install
npm run dev
```

## Настройка backend

По умолчанию клиент обращается к `http://localhost:8000`.

Переопределение:

```bash
VITE_API_URL=http://localhost:8000 npm run dev
```

## Ожидаемые маршруты backend

- `POST /auth/register`
- `POST /auth/login`
- `GET /users/me`
- `PATCH /users/me`
- `GET /users`
- `GET /groups`
- `POST /groups`
- `GET /groups/{id}`
- `PATCH /groups/{id}`
- `POST /groups/{id}/join`
- `POST /groups/{id}/leave`
- `GET /groups/{id}/posts`
- `POST /groups/{id}/posts`
- `GET /posts/{id}/comments`
- `POST /posts/{id}/comments`
- `POST /posts/{id}/like`
- `GET /feed`
- `GET /events`
- `POST /events`
- `GET /messages/threads`
- `POST /messages/threads`
- `GET /messages/threads/{id}/messages`
- `POST /messages/threads/{id}/messages`

Если ваш backend использует другие пути, достаточно поправить `src/api/client.ts`.
