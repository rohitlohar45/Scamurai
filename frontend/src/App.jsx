import React, { useEffect, useMemo, useRef, useState } from "react";

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
  const [rateSamples, setRateSamples] = useState([]);
  const [liveNow, setLiveNow] = useState(Date.now());
  const isFetchingRef = useRef(false);
  const isCancelledRef = useRef(false);

  useEffect(() => {
    isCancelledRef.current = false;

    const fetchAll = async () => {
      if (isFetchingRef.current || isCancelledRef.current) return;
      isFetchingRef.current = true;
      try {
        const [s, t] = await Promise.all([api.getStats(), api.getTransactions()]);
        if (isCancelledRef.current) return;
        setStats(s);
        setTransactions(t);
        setRateSamples((prev) => {
          const next = [...prev, { ts: Date.now(), total: s?.total_count ?? 0 }];
          return next.slice(-30);
        });
      } catch (error) {
        console.error("Failed to fetch stats or transactions", error);
      } finally {
        isFetchingRef.current = false;
      }
    };

    fetchAll();
    const id = setInterval(fetchAll, 1000);
    return () => {
      isCancelledRef.current = true;
      clearInterval(id);
    };
  }, []);

  useEffect(() => {
    const id = setInterval(() => setLiveNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const txPerMinute = useMemo(() => {
    if (rateSamples.length < 2) return 0;
    const first = rateSamples[0];
    const last = rateSamples[rateSamples.length - 1];
    const dtSec = (last.ts - first.ts) / 1000;
    if (dtSec <= 0) return 0;
    const dTx = Math.max(0, last.total - first.total);
    return Math.round((dTx / dtSec) * 60);
  }, [rateSamples]);

  const onInjected = (txId) => {
    setFlashTxId(txId);
    setTimeout(() => setFlashTxId(null), 1500);
  };

  return (
    <div
      style={{
        background:
          "radial-gradient(circle at 20% 0%, #172554 0%, #0b1020 45%, #080c17 100%)",
        minHeight: "100vh",
        color: "white",
        padding: 20,
        fontFamily:
          "Inter, ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial",
      }}
    >
      <header
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 18,
          padding: 14,
          borderRadius: 14,
          background: "rgba(15, 23, 42, 0.7)",
          border: "1px solid rgba(71, 85, 105, 0.45)",
          backdropFilter: "blur(6px)",
        }}
      >
        <div>
          <h1 style={{ margin: 0, fontSize: 26 }}>Scamurai · Real-time Fraud Detection</h1>
          <div style={{ color: "#94a3b8", fontSize: 13, marginTop: 2 }}>
            Streaming intelligence for payment anomaly detection
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span
            style={{
              color: "#86efac",
              fontWeight: 700,
              padding: "4px 10px",
              borderRadius: 999,
              background: "rgba(20, 83, 45, 0.35)",
              border: "1px solid rgba(34, 197, 94, 0.4)",
            }}
          >
            ● LIVE
          </span>
          <span style={{ color: "#cbd5e1", fontWeight: 600 }}>
            {txPerMinute.toLocaleString("en-IN")} tx/min
          </span>
          <InjectButton onInjected={onInjected} />
        </div>
      </header>

      <div style={{ display: "grid", gap: 14 }}>
        <MetricsRow stats={stats} />
        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 14 }}>
          <LiveFeed transactions={transactions} flashTxId={flashTxId} liveNow={liveNow} />
          <div style={{ display: "grid", gap: 12 }}>
            <SignalsChart signalBreakdown={stats?.signal_breakdown || {}} />
            <SparklineChart alertTimeseries={stats?.alert_timeseries || []} />
          </div>
        </div>
      </div>
    </div>
  );
}
