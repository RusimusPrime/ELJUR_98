import { http, HttpResponse } from 'msw'

export const handlers = [
  http.post('http://localhost:8000/auth/login', async ({ request }) => {
    const { email, password } = await request.json()
    if (email === 'qwerty@gmail.com' && password === 'qwerty') {
      return HttpResponse.json({
        access_token: 'mock-jwt-token',
        user: { email, name: 'Руслан' }
      })
    }
    return new HttpResponse('Invalid credentials', { status: 401 })
  }),

  http.get('http://localhost:8000/users/me', () => {
    return HttpResponse.json({
      id: 1,
      email: 'ruslankosov9@gmail.com',
      name: 'Руслан',
      avatar: 'https://via.placeholder.com/40'
    })
  }),

  http.get('http://localhost:8000/feed', () => {
    return HttpResponse.json([
      { id: 1, text: 'Первый пост', author: 'Иван', createdAt: new Date().toISOString() },
      { id: 2, text: 'Второй пост', author: 'Руслан', createdAt: new Date().toISOString() }
    ])
  })
]