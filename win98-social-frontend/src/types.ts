export type Role = 'student' | 'teacher' | 'admin';

export type User = {
  id: number;
  full_name: string;
  email: string;
  role: Role;
  bio?: string | null;
  avatar_url?: string | null;
  created_at?: string;
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
  owner_id?: number;
  subscribers_count?: number;
  last_message_preview?: string | null;
  updated_at?: string | null;
};

export type GroupMessage = {
  id: string;
  group_id: string;
  sender: User;
  content: string;
  created_at: string;
};

export type Chat = {
  id: string;
  participants: User[];
  last_message_preview?: string | null;
  updated_at: string;
};

export type ChatMessage = {
  id: string;
  chat_id: string;
  sender: User;
  content: string;
  created_at: string;
};

export type NewsItem = {
  id: string;
  title: string;
  content: string;
  status: 'pending' | 'approved' | 'rejected';
  group?: Group | null;
  created_by?: User | null;
  reviewed_by?: User | null;
  reviewed_at?: string | null;
  created_at: string;
};

export type EventItem = {
  id: string;
  kind: 'news' | 'event';
  title: string;
  description?: string | null;
  starts_at?: string | null;
  ends_at?: string | null;
  group?: Group | null;
  created_by?: User | null;
  created_at: string;
  status?: 'pending' | 'approved' | 'rejected' | null;
};

export type Paginated<T> = {
  items: T[];
  page: number;
  limit: number;
  total: number;
};
