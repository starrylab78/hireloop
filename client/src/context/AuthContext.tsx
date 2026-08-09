import { createContext, useContext, useEffect, useState, ReactNode, useCallback, useRef } from 'react';
import { api } from '@/lib/api';
import type { User } from '@/types';

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<User>;
  register: (data: Record<string, unknown>) => Promise<User>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const hasCheckedAuth = useRef(false);

  const refreshUser = useCallback(async () => {
    try {
      const { data } = await api.get('/auth/me');
      setUser(data.user);
    } catch {
      setUser(null);
    }
  }, []);

  useEffect(() => {
    if (hasCheckedAuth.current) return; // avoid duplicate calls from React StrictMode's double-invoke in dev
    hasCheckedAuth.current = true;
    refreshUser().finally(() => setLoading(false));

    const onExpired = () => setUser(null);
    window.addEventListener('hireloop:session-expired', onExpired);
    return () => window.removeEventListener('hireloop:session-expired', onExpired);
  }, [refreshUser]);

  async function login(email: string, password: string) {
    const { data } = await api.post('/auth/login', { email, password });
    setUser(data.user);
    return data.user as User;
  }

  async function register(payload: Record<string, unknown>) {
    const { data } = await api.post('/auth/register', payload);
    setUser(data.user);
    return data.user as User;
  }

  async function logout() {
    await api.post('/auth/logout');
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
