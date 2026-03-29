import React, { useEffect, useMemo, useState } from "react";

import api from "./api";
import InjectButton from "./components/InjectButton";
import LiveFeed from "./components/LiveFeed";
import MetricsRow from "./components/MetricsRow";
import SignalsChart from "./components/SignalsChart";
import SparklineChart from "./components/SparklineChart";

export default function App() {
  const [stats, setStats] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [flashTxId, setFlashTxId] = useState(null);

  useEffect(() => {
    const fetchAll = async () => {
      const [s, t] = await Promise.all([api.getStats(), api.getTransactions()]);
      setStats(s);
      setTransactions(t);
    };

    fetchAll();
    const id = setInterval(fetchAll, 2000);
    return () => clearInterval(id);
  }, []);

  const txPerMinute = useMemo(() => {
    if (!stats?.total_count) return 0;
    return Math.round(stats.total_count);
  }, [stats]);

  const onInjected = (txId) => {
    setFlashTxId(txId);
    setTimeout(() => setFlashTxId(null), 1500);
  };

  return (
    <div style={{ background: "#0b1020", minHeight: "100vh", color: "white", padding: 20 }}>
      <header
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 16,
        }}
      >
        <h1 style={{ margin: 0 }}>Scamurai · Real-time Fraud Detection</h1>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ color: "#86efac" }}>● LIVE</span>
          <span style={{ color: "#9ca3af" }}>{txPerMinute.toLocaleString("en-IN")} tx/min</span>
          <InjectButton onInjected={onInjected} />
        </div>
      </header>

      <div style={{ display: "grid", gap: 12 }}>
        <MetricsRow stats={stats} />
        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 12 }}>
          <LiveFeed transactions={transactions} flashTxId={flashTxId} />
          <div style={{ display: "grid", gap: 12 }}>
            <SignalsChart signalBreakdown={stats?.signal_breakdown || {}} />
            <SparklineChart alertTimeseries={stats?.alert_timeseries || []} />
          </div>
        </div>
      </div>
    </div>
  );
}
