import React, { useState } from "react";
import api from "../api";

export default function InjectButton({ onInjected }) {
  const [loading, setLoading] = useState(false);

  const handleInject = async () => {
    setLoading(true);
    try {
      const result = await api.injectFraud();
      if (onInjected) onInjected(result.tx_id);
    } finally {
      setTimeout(() => setLoading(false), 800);
    }
  };

  return (
    <button
      onClick={handleInject}
      disabled={loading}
      style={{
        border: "1px solid rgba(248, 113, 113, 0.45)",
        padding: "10px 16px",
        borderRadius: 10,
        cursor: loading ? "not-allowed" : "pointer",
        fontWeight: 800,
        fontSize: 13,
        letterSpacing: 0.3,
        background: loading
          ? "linear-gradient(90deg, #64748b 0%, #475569 100%)"
          : "linear-gradient(90deg, #dc2626 0%, #b91c1c 100%)",
        color: "white",
        boxShadow: loading ? "none" : "0 8px 18px rgba(220, 38, 38, 0.25)",
      }}
    >
      {loading ? "Injecting fraud..." : "Inject fraud now"}
    </button>
  );
}
