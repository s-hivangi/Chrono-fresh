import React from 'react';
import { Routes, Route } from 'react-router-dom';
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
  return (
    <AppShell>
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
