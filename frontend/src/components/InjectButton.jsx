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
      setTimeout(() => setLoading(false), 1000);
    }
  };

  return (
    <button
      onClick={handleInject}
      disabled={loading}
      style={{
        border: 0,
        padding: "10px 14px",
        borderRadius: 8,
        cursor: loading ? "not-allowed" : "pointer",
        fontWeight: 700,
        background: loading ? "#6b7280" : "#dc2626",
        color: "white",
      }}
    >
      {loading ? "Injecting..." : "Inject fraud now"}
    </button>
  );
}
