import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { api } from '../api/client';

interface User {
  id: number;
  username: string;
  fio: string | null;
  role: number;
  is_active: boolean;
}

interface AuthContextType {
  user: User | null;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (localStorage.getItem('access_token')) {
      api.get<User>('/auth/me').then(setUser).catch(() => {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
      }).finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (username: string, password: string) => {
    const data = await api.post<{ access_token: string; refresh_token: string }>('/auth/login', { username, password });
    localStorage.setItem('access_token', data.access_token);
    localStorage.setItem('refresh_token', data.refresh_token);
    setUser(await api.get<User>('/auth/me'));
  };

  const logout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    setUser(null);
  };

  return <AuthContext.Provider value={{ user, login, logout, loading }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be inside AuthProvider');
  return ctx;
}
