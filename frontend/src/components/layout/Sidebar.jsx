import React from 'react';
import { NavLink } from 'react-router-dom';

const NAV = [
  { to: '/',          label: 'Dashboard',  icon: '⬡' },
  { to: '/produce',   label: 'My Produce', icon: '🥦' },
  { to: '/scan',      label: 'Scan',       icon: '📷' },
  { to: '/history',   label: 'History',    icon: '📋' },
  { to: '/analytics', label: 'Analytics',  icon: '📊' },
];

export default function Sidebar() {
  return (
    <nav className="sidebar">
      <div className="sidebar-brand">
        <span className="brand-icon">⏱</span>
        <span className="brand-name">ChronoFresh</span>
      </div>
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
              <span className="sidebar-icon">{icon}</span>
              <span>{label}</span>
            </NavLink>
          </li>
        ))}
      </ul>
      <div className="sidebar-footer">
        <span className="sidebar-version">v1.0 · Stub Model</span>
      </div>
    </nav>
  );
}
