import React, { useEffect, useState } from 'react';
import { Routes, Route } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import client, { clearWebSession, currentWebRefreshToken, onWebAuthLost, setWebSession } from './api/client.js';
import AppShell from './components/layout/AppShell.jsx';
import DashboardPage  from './pages/DashboardPage.jsx';
import ProducePage    from './pages/ProducePage.jsx';
import ScanPage       from './pages/ScanPage.jsx';
import DetailPage     from './pages/DetailPage.jsx';
import HistoryPage    from './pages/HistoryPage.jsx';
import AnalyticsPage  from './pages/AnalyticsPage.jsx';

function NotFoundPage() {
  return (
    <div className="page">
      <div className="panel empty-state">
        <h1>Page not found</h1>
        <a href="/">Return to dashboard</a>
      </div>
    </div>
  );
}

export default function App() {
  const queryClient = useQueryClient();
  const [signedIn, setSignedIn] = useState(false);
  const [mode, setMode] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    onWebAuthLost(() => { queryClient.clear(); setSignedIn(false); });
    return () => onWebAuthLost(null);
  }, [queryClient]);

  async function submit(event) {
    event.preventDefault();
    setError('');
    setBusy(true);
    try {
      const response = await client.post(`/api/v1/auth/${mode}`, { email, password });
      setWebSession(response.data);
      await client.get('/api/v1/auth/me');
      queryClient.clear();
      setSignedIn(true);
      setPassword('');
    } catch (cause) {
      clearWebSession();
      setError(cause.message || 'Could not sign in.');
    } finally {
      setBusy(false);
    }
  }

  async function logout() {
    const token = currentWebRefreshToken();
    clearWebSession();
    await queryClient.cancelQueries();
    queryClient.clear();
    setSignedIn(false);
    if (token) void client.post('/api/v1/auth/logout', { refresh_token: token }).catch(() => undefined);
  }

  if (!signedIn) return (
    <div className="page" style={{ minHeight: '100vh', display: 'grid', placeItems: 'center' }}>
      <form className="panel" onSubmit={submit} style={{ width: 'min(400px, 92vw)', padding: 32 }}>
        <h1>ChronoFresh</h1>
        <p>{mode === 'login' ? 'Sign in to your private produce history.' : 'Create an account to save scans.'}</p>
        <label htmlFor="auth-email">Email</label>
        <input id="auth-email" type="email" required value={email} onChange={(event) => setEmail(event.target.value)} style={{ display: 'block', width: '100%', marginBottom: 16 }} />
        <label htmlFor="auth-password">Password</label>
        <input id="auth-password" type="password" required minLength={8} value={password} onChange={(event) => setPassword(event.target.value)} style={{ display: 'block', width: '100%', marginBottom: 16 }} />
        {error && <p role="alert">{error}</p>}
        <button type="submit" disabled={busy}>{busy ? 'Please wait…' : mode === 'login' ? 'Sign In' : 'Create Account'}</button>
        <button type="button" onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(''); }} style={{ marginLeft: 12 }}>
          {mode === 'login' ? 'Create account' : 'Already have an account?'}
        </button>
      </form>
    </div>
  );
  return (
    <AppShell onLogout={logout}>
      <Routes>
        <Route path="/"              element={<DashboardPage />} />
        <Route path="/produce"       element={<ProducePage />} />
        <Route path="/produce/:id"   element={<DetailPage />} />
        <Route path="/scan"          element={<ScanPage />} />
        <Route path="/history"       element={<HistoryPage />} />
        <Route path="/analytics"     element={<AnalyticsPage />} />
        <Route path="*"              element={<NotFoundPage />} />
      </Routes>
    </AppShell>
  );
}
