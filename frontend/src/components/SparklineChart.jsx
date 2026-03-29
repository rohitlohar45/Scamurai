import React from "react";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

export default function SparklineChart({ alertTimeseries }) {
  const values = alertTimeseries || Array.from({ length: 20 }, () => 0);
  const labels = values.map((_, idx) => `${idx * 3}s`);

  const data = {
    labels,
    datasets: [
      {
        label: "Alerts",
        data: values,
        backgroundColor: "rgba(251, 191, 36, 0.75)",
        borderRadius: 4,
      },
    ],
  };

  const options = {
    responsive: true,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: "rgba(15, 23, 42, 0.95)",
        borderColor: "rgba(148, 163, 184, 0.5)",
        borderWidth: 1,
      },
    },
    scales: {
      x: { ticks: { color: "#94a3b8", maxTicksLimit: 8 }, grid: { color: "rgba(51,65,85,0.45)" } },
      y: { ticks: { color: "#94a3b8" }, grid: { color: "rgba(51,65,85,0.35)" } },
    },
  };

  return (
    <div
      style={{
        background: "rgba(15, 23, 42, 0.78)",
        border: "1px solid rgba(71, 85, 105, 0.45)",
        borderRadius: 14,
        padding: 14,
      }}
    >
      <h3 style={{ margin: "0 0 12px", color: "#e2e8f0", fontSize: 16 }}>Alerts Last 60s</h3>
      <Bar data={data} options={options} />
    </div>
  );
}
