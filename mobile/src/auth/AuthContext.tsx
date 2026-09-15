import { useCallback, useEffect, useMemo, useState } from 'react';

import { authApi } from '../api/authApi';
import { tokenStorage, TOKEN_KEYS } from '../api/client';
import { AuthContext, type AuthContextValue } from './context';
import type { LoginPayload, RegisterPayload, User } from '../types/auth';

const USER_KEY = 'agri_user';

async function readStoredUser(): Promise<User | null> {
  try {
    const raw = await tokenStorage.get(USER_KEY);
    return raw ? (JSON.parse(raw) as User) : null;
  } catch {
    return null;
  }
}

async function persistSession(
  user: User,
  access: string,
  refresh: string,
): Promise<void> {
  await tokenStorage.set(TOKEN_KEYS.access, access);
  await tokenStorage.set(TOKEN_KEYS.refresh, refresh);
  await tokenStorage.set(USER_KEY, JSON.stringify(user));
}

async function clearSession(): Promise<void> {
  await tokenStorage.clear();
  await tokenStorage.remove(USER_KEY);
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const initialize = async () => {
      const access = await tokenStorage.get(TOKEN_KEYS.access);
      if (!access) {
        return;
      }
      try {
        const current = await authApi.me();
        setUser(current);
      } catch {
        await clearSession();
        setUser(null);
      }
    };
    void initialize();
  }, []);

  const login = useCallback(async (payload: LoginPayload) => {
    setLoading(true);
    try {
      const session = await authApi.login(payload);
      await persistSession(session.user, session.access, session.refresh);
      setUser(session.user);
    } finally {
      setLoading(false);
    }
  }, []);

  const register = useCallback(async (payload: RegisterPayload) => {
    setLoading(true);
    try {
      const session = await authApi.register(payload);
      await persistSession(session.user, session.access, session.refresh);
      setUser(session.user);
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    const refresh = await tokenStorage.get(TOKEN_KEYS.refresh);
    if (refresh) {
      try {
        await authApi.logout(refresh);
      } catch {
        // Ignore network/blacklist errors; the local session is cleared anyway.
      }
    }
    await clearSession();
    setUser(null);
  }, []);

  const value: AuthContextValue = useMemo(
    () => ({ user, loading, login, register, logout }),
    [user, loading, login, register, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}