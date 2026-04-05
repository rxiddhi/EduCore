import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { apiFetch } from '../api/client';
import type { AuthUser, Role } from '../types/auth';

interface LoginResponse {
  session?: {
    access_token: string;
  };
}

interface AuthContextValue {
  user: AuthUser | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<AuthUser>;
  logout: () => void;
  register: (payload: {
    fullName: string;
    email: string;
    password: string;
    role: Exclude<Role, 'ADMIN'>;
  }) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const TOKEN_KEY = 'access_token';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) {
      setIsLoading(false);
      return;
    }

    apiFetch<AuthUser>('/api/users/me')
      .then((me) => setUser(me))
      .catch(() => {
        localStorage.removeItem(TOKEN_KEY);
        setUser(null);
      })
      .finally(() => setIsLoading(false));
  }, []);

  async function login(email: string, password: string): Promise<AuthUser> {
    const data = await apiFetch<LoginResponse>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });

    if (!data.session?.access_token) {
      throw new Error('No access token returned from server');
    }

    localStorage.setItem(TOKEN_KEY, data.session.access_token);

    const me = await apiFetch<AuthUser>('/api/users/me');
    setUser(me);
    return me;
  }

  async function register(payload: {
    fullName: string;
    email: string;
    password: string;
    role: Exclude<Role, 'ADMIN'>;
  }): Promise<void> {
    await apiFetch('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  }

  function logout() {
    localStorage.removeItem(TOKEN_KEY);
    setUser(null);
  }

  const value = useMemo(
    () => ({
      user,
      isLoading,
      login,
      logout,
      register
    }),
    [user, isLoading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
