import React from 'react';
import { useEffect, useState } from 'react';
import Sidebar from './Sidebar.jsx';
import OutlineIcon from '../shared/OutlineIcon.jsx';

export default function AppShell({ children }) {
  const [dark, setDark] = useState(() => localStorage.getItem('chronofresh-theme') !== 'light');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
    localStorage.setItem('chronofresh-theme', dark ? 'dark' : 'light');
  }, [dark]);

  return (
    <div className="app-shell">
      <Sidebar />
      <main className="app-main">
        <div className="app-toolbar">
          <button
            type="button"
            className="theme-toggle"
            onClick={() => setDark((value) => !value)}
            title={dark ? 'Switch to light mode' : 'Switch to dark mode'}
            aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            <OutlineIcon name={dark ? 'sun' : 'moon'} size={19} />
          </button>
        </div>
        {children}
      </main>
    </div>
  );
}
