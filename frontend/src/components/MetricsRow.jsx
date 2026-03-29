import React from "react";

function MetricsCard({ label, value }) {
  return (
    <div
      style={{
        background: "#121826",
        border: "1px solid #2a3246",
        borderRadius: 8,
        padding: 16,
      }}
    >
      <div style={{ color: "#9ca3af", fontSize: 12 }}>{label}</div>
      <div style={{ color: "#f3f4f6", fontSize: 24, fontWeight: 700 }}>{value}</div>
    </div>
  );
}

export default function MetricsRow({ stats }) {
  const total = stats?.total_count ?? 0;
  const fraud = stats?.fraud_count ?? 0;
  const flaggedAmount = stats?.flagged_amount ?? 0;
  const precision = (stats?.precision ?? 0) * 100;
  const recall = (stats?.recall ?? 0) * 100;

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
        gap: 12,
      }}
    >
      <MetricsCard label="Total Transactions" value={total.toLocaleString("en-IN")} />
      <MetricsCard label="Fraud Alerts" value={fraud.toLocaleString("en-IN")} />
      <MetricsCard
        label="Flagged Amount (₹)"
        value={`₹${Number(flaggedAmount).toLocaleString("en-IN", {
          maximumFractionDigits: 2,
        })}`}
      />
      <MetricsCard
        label="Precision / Recall"
        value={`${precision.toFixed(1)}% / ${recall.toFixed(1)}%`}
      />
    </div>
  );
}
