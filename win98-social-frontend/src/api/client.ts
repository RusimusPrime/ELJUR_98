import { request } from './http';
import type {
  AuthResponse,
  Comment,
  EventItem,
  Group,
  Message,
  MessageThread,
  Paginated,
  Post,
  User,
} from '../types';

export const api = {
  register: (data: { full_name: string; email: string; password: string; role?: string; class_name?: string; subject?: string }) =>
    request<AuthResponse>('/auth/register', { method: 'POST', body: JSON.stringify(data) }),
  login: (data: { email: string; password: string }) =>
    request<AuthResponse>('/auth/login', { method: 'POST', body: JSON.stringify(data) }),
  me: (token: string) => request<User>('/users/me', {}, token),
  updateMe: (token: string, data: Partial<User>) =>
    request<User>('/users/me', { method: 'PATCH', body: JSON.stringify(data) }, token),

  feed: (token: string) => request<Paginated<EventItem & { post?: Post }>>('/feed', {}, token),
  events: (token: string, page = 1) => request<Paginated<EventItem>>(`/events?page=${page}&limit=20`, {}, token),
  createEvent: (token: string, data: Partial<EventItem>) => request<EventItem>('/events', { method: 'POST', body: JSON.stringify(data) }, token),

  groups: (token: string, q = '') => request<Paginated<Group>>(`/groups?query=${encodeURIComponent(q)}&limit=20`, {}, token),
  groupById: (token: string, id: string) => request<Group>(`/groups/${id}`, {}, token),
  createGroup: (token: string, data: Partial<Group>) => request<Group>('/groups', { method: 'POST', body: JSON.stringify(data) }, token),
  updateGroup: (token: string, id: string, data: Partial<Group>) => request<Group>(`/groups/${id}`, { method: 'PATCH', body: JSON.stringify(data) }, token),
  joinGroup: (token: string, id: string) => request<Group>(`/groups/${id}/join`, { method: 'POST' }, token),
  leaveGroup: (token: string, id: string) => request<Group>(`/groups/${id}/leave`, { method: 'POST' }, token),
  groupPosts: (token: string, id: string, page = 1) => request<Paginated<Post>>(`/groups/${id}/posts?page=${page}&limit=20`, {}, token),
  createPost: (token: string, groupId: string, data: Partial<Post>) =>
    request<Post>(`/groups/${groupId}/posts`, { method: 'POST', body: JSON.stringify(data) }, token),
  comments: (token: string, postId: string) => request<Paginated<Comment>>(`/posts/${postId}/comments`, {}, token),
  addComment: (token: string, postId: string, content: string, parent_id?: string | null) =>
    request<Comment>(`/posts/${postId}/comments`, { method: 'POST', body: JSON.stringify({ content, parent_id }) }, token),
  likePost: (token: string, postId: string) => request<Post>(`/posts/${postId}/like`, { method: 'POST' }, token),
  deletePost: (token: string, postId: string) => request<void>(`/posts/${postId}`, { method: 'DELETE' }, token),

  threads: (token: string) => request<Paginated<MessageThread>>('/messages/threads', {}, token),
  createThread: (token: string, data: { subject: string; recipient_ids: string[]; content: string }) =>
    request<MessageThread>('/messages/threads', { method: 'POST', body: JSON.stringify(data) }, token),
  threadMessages: (token: string, threadId: string) => request<Paginated<Message>>(`/messages/threads/${threadId}/messages`, {}, token),
  sendMessage: (token: string, threadId: string, content: string) =>
    request<Message>(`/messages/threads/${threadId}/messages`, { method: 'POST', body: JSON.stringify({ content }) }, token),

  searchUsers: (token: string, q = '') => request<Paginated<User>>(`/users?query=${encodeURIComponent(q)}&limit=20`, {}, token),
  searchGroups: (token: string, q = '') => request<Paginated<Group>>(`/groups?query=${encodeURIComponent(q)}&limit=20`, {}, token),
};
