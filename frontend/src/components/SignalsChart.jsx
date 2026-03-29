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

export default function SignalsChart({ signalBreakdown }) {
  const labels = Object.keys(signalBreakdown || {});
  const values = Object.values(signalBreakdown || {});

  const data = {
    labels,
    datasets: [
      {
        label: "Rule hits",
        data: values,
        backgroundColor: "rgba(248, 113, 113, 0.72)",
        borderRadius: 6,
      },
    ],
  };

  const options = {
    indexAxis: "y",
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
      x: { ticks: { color: "#94a3b8" }, grid: { color: "rgba(51,65,85,0.45)" } },
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
      <h3 style={{ margin: "0 0 12px", color: "#e2e8f0", fontSize: 16 }}>Fraud Signals</h3>
      <Bar data={data} options={options} />
    </div>
  );
}
