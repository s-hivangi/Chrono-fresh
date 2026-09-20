import React from 'react';
import { NavLink } from 'react-router-dom';
import OutlineIcon from '../shared/OutlineIcon.jsx';

const NAV = [
  { to: '/',          label: 'Dashboard',  icon: 'home' },
  { to: '/produce',   label: 'Your Stash', icon: 'produce' },
  { to: '/scan',      label: 'Scan',       icon: 'camera' },
  { to: '/history',   label: 'History',    icon: 'history' },
  { to: '/analytics', label: 'Analytics',  icon: 'analytics' },
];

export default function Sidebar() {
  return (
    <nav className="sidebar">
      <div className="sidebar-brand">
        <span className="brand-icon"><OutlineIcon name="history" size={22} /></span>
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
              <span className="sidebar-icon"><OutlineIcon name={icon} size={19} /></span>
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
