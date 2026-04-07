export type Role = 'student' | 'teacher' | 'admin';

export type User = {
  id: string;
  full_name: string;
  email: string;
  role: Role;
  class_name?: string | null;
  subject?: string | null;
  bio?: string | null;
  avatar_url?: string | null;
};

export type AuthResponse = {
  access_token: string;
  user: User;
};

export type Group = {
  id: string;
  name: string;
  description?: string | null;
  avatar_url?: string | null;
  is_private?: boolean;
  is_member?: boolean;
  owner_id?: string;
  moderator_ids?: string[];
  subscribers_count?: number;
};

export type Post = {
  id: string;
  group_id: string;
  author: User;
  title: string;
  content: string;
  created_at: string;
  likes_count?: number;
  comments_count?: number;
  liked_by_me?: boolean;
};

export type Comment = {
  id: string;
  post_id: string;
  author: User;
  content: string;
  created_at: string;
  parent_id?: string | null;
};

export type MessageThread = {
  id: string;
  subject: string;
  participants: User[];
  last_message_preview?: string;
  updated_at: string;
};

export type Message = {
  id: string;
  thread_id: string;
  sender: User;
  content: string;
  created_at: string;
};

export type EventItem = {
  id: string;
  title: string;
  description?: string | null;
  starts_at?: string | null;
  ends_at?: string | null;
  group?: Group | null;
  created_by?: User | null;
  kind: 'news' | 'event';
  created_at: string;
};

export type Paginated<T> = {
  items: T[];
  page: number;
  limit: number;
  total: number;
};
