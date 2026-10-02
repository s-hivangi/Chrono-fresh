import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import axios from 'axios';
import { useQueryClient } from '@tanstack/react-query';
import client, { API_BASE_URL } from '../api/client';
import { clearProduceReminders } from '../utils/notifications';
import {
  acceptTokens, clearSession, currentRefreshToken, refreshAccessToken,
  setSessionLostHandler, storedRefreshToken, type AuthTokens,
} from '../api/authSession';

export type AuthUser = { id: number; email: string; is_active: boolean };
export type AuthState =
  | { mode: 'loading' }
  | { mode: 'guest' }
  | { mode: 'user'; user: AuthUser };

type AuthContextType = {
  auth: AuthState;
  user: AuthUser | null;
  isLoading: boolean;
  isGuest: boolean;
  isLoggedIn: boolean;
  userEmail: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  signOut: () => Promise<void>;
  continueAsGuest: () => void;
  restoreSession: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();
  const [auth, setAuth] = useState<AuthState>({ mode: 'loading' });
  const authOperation = useRef(0);

  async function clearUserData() {
    await queryClient.cancelQueries();
    queryClient.clear();
  }

  async function restoreSession() {
    const operation = ++authOperation.current;
    setAuth({ mode: 'loading' });
    try {
      if (!(await storedRefreshToken())) {
        if (operation === authOperation.current) setAuth({ mode: 'guest' });
        return;
      }
      if (!(await refreshAccessToken())) throw new Error('Session expired');
      const response = await client.get<AuthUser>('/api/v1/auth/me');
      if (operation !== authOperation.current) return;
      await clearUserData();
      setAuth({ mode: 'user', user: response.data });
    } catch {
      // The refresh helper clears revoked credentials. Keep a valid credential
      // when the backend is merely offline, so a later launch can retry.
      if (operation !== authOperation.current) return;
      await clearUserData();
      setAuth({ mode: 'guest' });
    }
  }

  useEffect(() => {
    setSessionLostHandler(() => {
      ++authOperation.current;
      setAuth({ mode: 'guest' });
      void clearUserData();
    });
    void restoreSession();
    return () => setSessionLostHandler(null);
    // Session restore and handler registration run once per provider instance.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function authenticate(path: 'login' | 'register', email: string, password: string) {
    const operation = ++authOperation.current;
    setAuth({ mode: 'guest' });
    await clearUserData();
    await clearSession();
    const response = await client.post<AuthTokens>(`/api/v1/auth/${path}`, { email, password });
    try {
      if (!(await acceptTokens(response.data))) throw new Error('Could not securely save the session.');
      const me = await client.get<AuthUser>('/api/v1/auth/me');
      if (operation !== authOperation.current) return;
      setAuth({ mode: 'user', user: me.data });
      void queryClient.prefetchQuery({
        queryKey: ['history', me.data.id],
        queryFn: () => client.get('/history').then((result) => result.data),
        staleTime: 0,
      }).catch(() => undefined);
    } catch (error) {
      if (operation !== authOperation.current) return;
      await clearSession();
      setAuth({ mode: 'guest' });
      throw error;
    }
  }

  async function logout() {
    ++authOperation.current;
    const refresh = currentRefreshToken();
    setAuth({ mode: 'guest' });
    await clearUserData();
    await clearSession();
    await clearProduceReminders();
    if (refresh && API_BASE_URL) {
      await axios.post(`${API_BASE_URL}/api/v1/auth/logout`,
        { refresh_token: refresh }, { timeout: 10_000 }).catch(() => undefined);
    }
  }

  function continueAsGuest() {
    ++authOperation.current;
    setAuth({ mode: 'guest' });
    queryClient.clear();
    void clearSession();
    void clearProduceReminders();
  }

  const user = auth.mode === 'user' ? auth.user : null;
  const value = useMemo<AuthContextType>(() => ({
    auth, user,
    isLoading: auth.mode === 'loading',
    isGuest: auth.mode === 'guest',
    isLoggedIn: auth.mode === 'user',
    userEmail: user?.email ?? null,
    login: (email, password) => authenticate('login', email, password),
    register: (email, password) => authenticate('register', email, password),
    logout, signOut: logout, continueAsGuest, restoreSession,
    // Functions are recreated with the provider state; consumers receive the latest session.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [auth, user, queryClient]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
