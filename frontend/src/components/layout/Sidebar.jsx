import React from 'react';
import { NavLink } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import OutlineIcon from '../shared/OutlineIcon.jsx';
import { getMeta } from '../../api/meta.js';

const NAV = [
  { to: '/',          label: 'Dashboard',  icon: 'home' },
  { to: '/produce',   label: 'Your Stash', icon: 'produce' },
  { to: '/scan',      label: 'Scan',       icon: 'camera' },
  { to: '/history',   label: 'History',    icon: 'history' },
  { to: '/analytics', label: 'Analytics',  icon: 'analytics' },
];

export default function Sidebar() {
  const { data: meta } = useQuery({
    queryKey: ['meta'],
    queryFn: getMeta,
    staleTime: 5 * 60 * 1000,
    retry: false,
  });
  const modelLabel = meta?.prediction_provider === 'keras'
    ? 'Keras model'
    : meta?.prediction_provider === 'stub'
      ? 'Stub model'
      : 'Quality engine';

  return (
    <nav className="sidebar">
      {/* ── Brand ── */}
      <div className="sidebar-brand">
        <div className="brand-logo-badge">
          <img src="/logo.png" alt="Chrono-Fresh logo" />
        </div>
        <div className="brand-text">
          <span className="brand-name">Chrono-Fresh</span>
          <span className="brand-tagline">Freshness Tracker</span>
        </div>
      </div>

      {/* ── Navigation ── */}
      <ul className="sidebar-nav">
        {NAV.map(({ to, label, icon }) => (
          <li key={to}>
            <NavLink
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                `sidebar-link${isActive ? ' sidebar-link--active' : ''}`
              }
            >
              <span className="sidebar-icon"><OutlineIcon name={icon} size={19} /></span>
              <span>{label}</span>
            </NavLink>
          </li>
        ))}
      </ul>

      {/* ── Footer ── */}
      <div className="sidebar-footer">
        <span className="sidebar-version">v1.0 · {modelLabel}</span>
      </div>
    </nav>
  );
}
