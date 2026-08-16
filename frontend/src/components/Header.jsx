import React from 'react';
import FruitIcon from './FruitIcon';

export default function Header({ tabs, activeTab, onTabChange, onRefresh, dark, onToggleTheme }) {
  return (
    <header className="topbar">
      <div className="brand">
        <span className="brand-name">Chronofresh</span>
        <span className="brand-sub">Produce Quality &amp; Shelf-Life Intelligence</span>
      </div>

      <nav className="nav-tabs">
        {tabs.map(t => (
          <button
            key={t.id}
            className={`tab-btn ${activeTab === t.id ? "active" : ""}`}
            onClick={() => onTabChange(t.id)}
          >
            {t.label}
          </button>
        ))}
      </nav>

      <div className="topbar-actions">
        <button className="btn-ghost" onClick={onRefresh}>Refresh</button>
        <button
          className="theme-toggle"
          onClick={onToggleTheme}
          title={dark ? "Switch to light mode" : "Switch to dark mode"}
          aria-label="Toggle colour theme"
        >
          <FruitIcon dark={dark} />
        </button>
      </div>
    </header>
  );
}
