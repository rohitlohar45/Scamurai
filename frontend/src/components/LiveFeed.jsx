import React from "react";

function statusStyle(status) {
  if (status === "FRAUD") return { background: "#7f1d1d", color: "#fecaca" };
  if (status === "SUSPICIOUS") return { background: "#78350f", color: "#fde68a" };
  return { background: "#14532d", color: "#bbf7d0" };
}

function timeAgo(timestamp) {
  const ms = Date.now() - new Date(timestamp).getTime();
  const sec = Math.max(0, Math.floor(ms / 1000));
  if (sec < 60) return `${sec}s ago`;
  return `${Math.floor(sec / 60)}m ago`;
}

export default function LiveFeed({ transactions, flashTxId }) {
  return (
    <div style={{ background: "#121826", border: "1px solid #2a3246", borderRadius: 8, padding: 12 }}>
      <h3 style={{ margin: "0 0 12px", color: "#f3f4f6" }}>Live Feed</h3>
      <table style={{ width: "100%", borderCollapse: "collapse", color: "#e5e7eb" }}>
        <thead>
          <tr style={{ color: "#9ca3af", fontSize: 12, textAlign: "left" }}>
            <th>tx_id</th>
            <th>tx_type</th>
            <th style={{ textAlign: "right" }}>amount</th>
            <th>time ago</th>
            <th>status</th>
          </tr>
        </thead>
        <tbody>
          {transactions.map((tx) => (
            <tr
              key={tx.tx_id}
              style={{
                borderTop: "1px solid #1f2937",
                background:
                  tx.tx_id === flashTxId
                    ? "linear-gradient(90deg, rgba(250,204,21,0.25), transparent)"
                    : "transparent",
              }}
            >
              <td>{tx.tx_id}</td>
              <td>{tx.tx_type}</td>
              <td style={{ textAlign: "right" }}>
                ₹{Number(tx.amount || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 })}
              </td>
              <td>{timeAgo(tx.timestamp)}</td>
              <td>
                <span
                  style={{
                    ...statusStyle(tx.status),
                    padding: "2px 8px",
                    borderRadius: 999,
                    fontSize: 12,
                    fontWeight: 700,
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
