import React, { createContext, useContext, useMemo, useState } from 'react';

export type AuthState =
  | { mode: 'loading' }
  | { mode: 'guest' }
  | { mode: 'user'; email: string };

type AuthContextType = {
  auth: AuthState;
  continueAsGuest: () => void;
  signIn: (email: string) => void;
  signOut: () => void;
  isGuest: boolean;
  isLoggedIn: boolean;
  userEmail: string | null;
};

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [auth, setAuth] = useState<AuthState>({ mode: 'guest' });

  const value = useMemo<AuthContextType>(() => ({
    auth,
    continueAsGuest: () => setAuth({ mode: 'guest' }),
    signIn: (email: string) => setAuth({ mode: 'user', email }),
    signOut: () => setAuth({ mode: 'guest' }),
    isGuest: auth.mode === 'guest',
    isLoggedIn: auth.mode === 'user',
    userEmail: auth.mode === 'user' ? auth.email : null,
  }), [auth]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
