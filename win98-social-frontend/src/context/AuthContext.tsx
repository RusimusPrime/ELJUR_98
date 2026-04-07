import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { api } from '../api/client';
import { ApiError } from '../api/http';
import type { User } from '../types';

type AuthState = {
  user: User | null;
  token: string | null;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (data: { full_name: string; email: string; password: string; role?: string; class_name?: string; subject?: string }) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  setServerError: (msg: string | null) => void;
};

const STORAGE_KEY = 'eljur98.auth';
const AuthContext = createContext<AuthState | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem(STORAGE_KEY));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }
    api.me(token)
      .then(setUser)
      .catch((e) => {
        if (e instanceof ApiError) setError(e.message);
        localStorage.removeItem(STORAGE_KEY);
        setToken(null);
      })
      .finally(() => setLoading(false));
  }, [token]);

  const persistToken = (nextToken: string | null) => {
    setToken(nextToken);
    if (nextToken) localStorage.setItem(STORAGE_KEY, nextToken);
    else localStorage.removeItem(STORAGE_KEY);
  };

  const login = async (email: string, password: string) => {
    const res = await api.login({ email, password });
    persistToken(res.access_token);
    setUser(res.user);
  };

  const register = async (data: { full_name: string; email: string; password: string; role?: string; class_name?: string; subject?: string }) => {
    const res = await api.register(data);
    persistToken(res.access_token);
    setUser(res.user);
  };

  const logout = () => {
    persistToken(null);
    setUser(null);
  };

  const refreshUser = async () => {
    if (!token) return;
    setUser(await api.me(token));
  };

  const value = useMemo(
    () => ({ user, token, loading, error, login, register, logout, refreshUser, setServerError: setError }),
    [user, token, loading, error],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
