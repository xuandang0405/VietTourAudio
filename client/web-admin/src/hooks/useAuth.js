import { createContext, createElement, useContext, useEffect, useMemo, useState } from 'react';
import { api } from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function bootstrap() {
      const token = localStorage.getItem('adminToken');
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const { data } = await api.get('/auth/me');
        setUser(data.user || data);
      } catch {
        localStorage.removeItem('adminToken');
        setUser(null);
      } finally {
        setLoading(false);
      }
    }
    bootstrap();
  }, []);

  const value = useMemo(() => ({
    user,
    loading,
    async login(payload) {
      const { data } = await api.post('/auth/admin/login', payload);
      localStorage.setItem('adminToken', data.token);
      setUser(data.user);
      return data;
    },
    logout() {
      localStorage.removeItem('adminToken');
      setUser(null);
    }
  }), [user, loading]);

  return createElement(AuthContext.Provider, { value }, children);
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
