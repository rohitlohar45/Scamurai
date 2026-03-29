import React from "react";

function statusStyle(status) {
  if (status === "FRAUD") {
    return {
      border: "1px solid rgba(248, 113, 113, 0.45)",
      background: "rgba(127, 29, 29, 0.55)",
      color: "#fecaca",
    };
  }
  if (status === "SUSPICIOUS") {
    return {
      border: "1px solid rgba(251, 191, 36, 0.45)",
      background: "rgba(146, 64, 14, 0.45)",
      color: "#fde68a",
    };
  }
  return {
    border: "1px solid rgba(74, 222, 128, 0.35)",
    background: "rgba(21, 128, 61, 0.35)",
    color: "#bbf7d0",
  };
}

function timeAgo(timestamp, liveNow) {
  const ms = liveNow - new Date(timestamp).getTime();
  const sec = Math.max(0, Math.floor(ms / 1000));
  if (sec < 60) return `${sec}s ago`;
  return `${Math.floor(sec / 60)}m ago`;
}

export default function LiveFeed({ transactions, flashTxId, liveNow }) {
  return (
    <div
      style={{
        background: "rgba(15, 23, 42, 0.78)",
        border: "1px solid rgba(71, 85, 105, 0.45)",
        borderRadius: 14,
        padding: 14,
      }}
    >
      <h3 style={{ margin: "0 0 12px", color: "#e2e8f0", fontSize: 18 }}>Live Transaction Feed</h3>
      <table style={{ width: "100%", borderCollapse: "collapse", color: "#e5e7eb", fontSize: 14 }}>
        <thead>
          <tr style={{ color: "#94a3b8", fontSize: 12, textAlign: "left" }}>
            <th style={{ paddingBottom: 8 }}>tx_id</th>
            <th style={{ paddingBottom: 8 }}>tx_type</th>
            <th style={{ textAlign: "right", paddingBottom: 8 }}>amount</th>
            <th style={{ paddingBottom: 8 }}>time ago</th>
            <th style={{ paddingBottom: 8 }}>status</th>
          </tr>
        </thead>
        <tbody>
          {transactions.map((tx) => (
            <tr
              key={tx.tx_id}
              style={{
                borderTop: "1px solid rgba(51, 65, 85, 0.55)",
                background:
                  tx.tx_id === flashTxId
                    ? "linear-gradient(90deg, rgba(250,204,21,0.24), rgba(250,204,21,0.04))"
                    : "transparent",
                transition: "background 0.35s ease",
              }}
            >
              <td style={{ padding: "10px 0", fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace" }}>
                {tx.tx_id}
              </td>
              <td style={{ padding: "10px 0" }}>{tx.tx_type}</td>
              <td style={{ textAlign: "right", padding: "10px 0", fontWeight: 600 }}>
                ₹{Number(tx.amount || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 })}
              </td>
              <td style={{ padding: "10px 0", color: "#cbd5e1" }}>{timeAgo(tx.timestamp, liveNow)}</td>
              <td style={{ padding: "10px 0" }}>
                <span
                  style={{
                    ...statusStyle(tx.status),
                    padding: "3px 9px",
                    borderRadius: 999,
                    fontSize: 11,
                    fontWeight: 800,
                    letterSpacing: 0.45,
                  }}
                >
                  {tx.status}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
