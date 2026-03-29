import React from "react";

function MetricsCard({ label, value, tone }) {
  const toneBg =
    tone === "danger"
      ? "rgba(185, 28, 28, 0.25)"
      : tone === "warn"
        ? "rgba(180, 83, 9, 0.22)"
        : tone === "good"
          ? "rgba(22, 101, 52, 0.22)"
          : "rgba(30, 41, 59, 0.65)";

  return (
    <div
      style={{
        background: toneBg,
        border: "1px solid rgba(148, 163, 184, 0.28)",
        borderRadius: 14,
        padding: 16,
        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.04)",
      }}
    >
      <div style={{ color: "#cbd5e1", fontSize: 12, letterSpacing: 0.4, textTransform: "uppercase" }}>
        {label}
      </div>
      <div style={{ color: "#f8fafc", fontSize: 28, fontWeight: 800, marginTop: 6 }}>{value}</div>
    </div>
  );
}

export default function MetricsRow({ stats }) {
  const total = stats?.total_count ?? 0;
  const fraud = stats?.fraud_count ?? 0;
  const suspicious = stats?.suspicious_count ?? 0;
  const flaggedAmount = stats?.flagged_amount ?? 0;
  const precision = (stats?.precision ?? 0) * 100;

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
        gap: 12,
      }}
    >
      <MetricsCard label="Total Transactions" value={total.toLocaleString("en-IN")} />
      <MetricsCard label="Fraud Alerts" value={fraud.toLocaleString("en-IN")} tone="danger" />
      <MetricsCard label="Suspicious" value={suspicious.toLocaleString("en-IN")} tone="warn" />
      <MetricsCard
        label="Flagged Amount · Precision"
        tone="good"
        value={`₹${Number(flaggedAmount).toLocaleString("en-IN", {
          maximumFractionDigits: 0,
        })} · ${precision.toFixed(1)}%`}
      />
    </div>
  );
}
