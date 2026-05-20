import { request } from './http';
import type {
  AuthResponse,
  Chat,
  ChatMessage,
  EventItem,
  Group,
  GroupMessage,
  NewsItem,
  Paginated,
  User,
} from '../types';

export const api = {
  register: (data: { full_name: string; email: string; password: string; role?: string }) =>
    request<AuthResponse>('/auth/register', { method: 'POST', body: JSON.stringify(data) }),
  login: (data: { email: string; password: string }) =>
    request<AuthResponse>('/auth/login', { method: 'POST', body: JSON.stringify(data) }),
  me: (token: string) => request<User>('/users/me', {}, token),
  updateMe: (token: string, data: Partial<User>) =>
    request<User>('/users/me', { method: 'PATCH', body: JSON.stringify(data) }, token),

  users: (token: string, q = '') => request<Paginated<User>>(`/users?query=${encodeURIComponent(q)}&limit=40`, {}, token),
  adminUsers: (token: string, q = '') => request<Paginated<User>>(`/admin/users?query=${encodeURIComponent(q)}&limit=40`, {}, token),
  updateUserRole: (token: string, id: number, role: string) =>
    request<User>(`/admin/users/${id}`, { method: 'PATCH', body: JSON.stringify({ role }) }, token),
  deleteUser: (token: string, id: number) => request<{ status: string }>(`/admin/users/${id}`, { method: 'DELETE' }, token),

  groups: (token: string, q = '') => request<Paginated<Group>>(`/groups?query=${encodeURIComponent(q)}&limit=40`, {}, token),
  groupById: (token: string, id: string) => request<Group>(`/groups/${id}`, {}, token),
  createGroup: (token: string, data: Partial<Group>) => request<Group>('/groups', { method: 'POST', body: JSON.stringify(data) }, token),
  updateGroup: (token: string, id: string, data: Partial<Group>) => request<Group>(`/groups/${id}`, { method: 'PATCH', body: JSON.stringify(data) }, token),
  groupMessages: (token: string, id: string) => request<Paginated<GroupMessage>>(`/groups/${id}/messages?limit=100`, {}, token),
  sendGroupMessage: (token: string, groupId: string, content: string) =>
    request<GroupMessage>(`/groups/${groupId}/messages`, { method: 'POST', body: JSON.stringify({ content }) }, token),

  chats: (token: string) => request<Paginated<Chat>>('/chats?limit=40', {}, token),
  createChat: (token: string, data: { recipient_ids: number[]; content: string }) =>
    request<Chat>('/chats', { method: 'POST', body: JSON.stringify(data) }, token),
  chatMessages: (token: string, chatId: string) => request<Paginated<ChatMessage>>(`/chats/${chatId}/messages?limit=100`, {}, token),
  sendChatMessage: (token: string, chatId: string, content: string) =>
    request<ChatMessage>(`/chats/${chatId}/messages`, { method: 'POST', body: JSON.stringify({ content }) }, token),

  feed: (token: string) => request<Paginated<EventItem>>('/feed', {}, token),
  events: (token: string) => request<Paginated<EventItem>>('/events?limit=40', {}, token),
  createEvent: (token: string, data: { title: string; description?: string; starts_at: string; ends_at?: string | null }) =>
    request<EventItem>('/events', { method: 'POST', body: JSON.stringify(data) }, token),

  createNews: (token: string, data: { title: string; content: string; group_id?: string | null }) =>
    request<NewsItem>('/news', { method: 'POST', body: JSON.stringify(data) }, token),
  pendingNews: (token: string) => request<Paginated<NewsItem>>('/news/pending?limit=40', {}, token),
  approveNews: (token: string, id: string, note = '') =>
    request<NewsItem>(`/news/${id}/approve`, { method: 'POST', body: JSON.stringify({ note }) }, token),
  rejectNews: (token: string, id: string, note = '') =>
    request<NewsItem>(`/news/${id}/reject`, { method: 'POST', body: JSON.stringify({ note }) }, token),

  searchUsers: (token: string, q = '') => request<Paginated<User>>(`/users?query=${encodeURIComponent(q)}&limit=40`, {}, token),
};
