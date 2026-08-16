import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import StatsRow from './components/StatsRow';
import AlertBanner from './components/AlertBanner';
import Dashboard from './components/Dashboard';
import UploadTab from './components/UploadTab';
import AnalyticsTab from './components/AnalyticsTab';
import LogisticsTab from './components/LogisticsTab';
import { isUrgent } from './utils/helpers';
import { fetchDashboard, fetchHistory, fetchStats, fetchTimeline } from './api';
import './styles.css';

const TABS = [
  { id: "dashboard", label: "Inventory" },
  { id: "upload",    label: "Scan & Predict" },
  { id: "analytics", label: "Shelf-Life Timeline" },
  { id: "logistics", label: "Logistics Dispatch" },
];

export default function App() {
  const [dark, setDark]             = useState(() => window.matchMedia("(prefers-color-scheme: dark)").matches);
  const [tab, setTab]               = useState("dashboard");
  const [products, setProducts]     = useState([]);
  const [history, setHistory]       = useState([]);
  const [timeline, setTimeline]     = useState([]);
  const [stats, setStats]           = useState({ total_products: 0, fresh_count: 0, high_risk_count: 0, spoiled_count: 0, avg_days_remaining: 0 });
  const [selectedId, setSelectedId] = useState(null);
  const [filter, setFilter]         = useState("all");
  const [search, setSearch]         = useState("");

  const selected = products.find(p => p.product_id === selectedId) ?? products[0] ?? null;

  /* Apply theme to document element */
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", dark ? "dark" : "light");
  }, [dark]);

  useEffect(() => {
    refresh();
  }, []);

  useEffect(() => {
    if (selected?.product_id) {
      loadTimeline(selected.product_id);
    }
  }, [selected?.product_id]);

  async function refresh() {
    try {
      const [dData, hData, sData] = await Promise.all([
        fetchDashboard().catch(() => []),
        fetchHistory().catch(() => []),
        fetchStats().catch(() => ({ total_products: 0, fresh_count: 0, high_risk_count: 0, spoiled_count: 0, avg_days_remaining: 0 })),
      ]);
      setProducts(dData);
      setHistory(hData);
      setStats(sData);

      if (!selectedId && dData.length > 0) {
        setSelectedId(dData[0].product_id);
      }
    } catch (e) {
      console.error("Refresh error:", e);
    }
  }

  async function loadTimeline(id) {
    try {
      const data = await fetchTimeline(id);
      setTimeline(data);
    } catch (e) {
      console.error("Timeline error:", e);
    }
  }

  const urgent = products.filter(isUrgent);

  const filtered = products.filter(p => {
    const q = search.toLowerCase();
    const ok = !q || p.display_name?.toLowerCase().includes(q) || p.produce_type?.toLowerCase().includes(q);
    if (!ok) return false;
    if (filter === "all") return true;
    if (filter === "urgent") return isUrgent(p);
    return p.produce_type === filter || p.latest_stage === filter;
  });

  const productHistory = history.filter(h => h.product_id === selected?.product_id);

  return (
    <div className="app-wrap">
      {/* ── Topbar ── */}
      <Header
        tabs={TABS}
        activeTab={tab}
        onTabChange={setTab}
        onRefresh={refresh}
        dark={dark}
        onToggleTheme={() => setDark(d => !d)}
      />

      {/* ── Stats KPI Row ── */}
      <StatsRow stats={stats} />

      {/* ── Action Alert Banner ── */}
      <AlertBanner
        urgentCount={urgent.length}
        onViewUrgent={() => {
          setFilter("urgent");
          setTab("dashboard");
        }}
      />

      {/* ── Tabs View ── */}
      {tab === "dashboard" && (
        <Dashboard
          filteredProducts={filtered}
          selectedId={selected?.product_id}
          search={search}
          filter={filter}
          onSearchChange={setSearch}
          onFilterChange={setFilter}
          onSelectProduct={id => {
            setSelectedId(id);
            setTab("analytics");
          }}
        />
      )}

      {tab === "upload" && (
        <UploadTab
          products={products}
          selected={selected}
          onUploaded={async result => {
            await refresh();
            if (result?.[0]?.product?.product_id) {
              setSelectedId(result[0].product.product_id);
            }
          }}
        />
      )}

      {tab === "analytics" && (
        <AnalyticsTab
          selected={selected}
          timeline={timeline}
          productHistory={productHistory}
        />
      )}

      {tab === "logistics" && (
        <LogisticsTab products={products} />
      )}
    </div>
  );
}
