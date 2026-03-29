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
        backgroundColor: "rgba(239,68,68,0.7)",
      },
    ],
  };

  const options = {
    indexAxis: "y",
    responsive: true,
    plugins: { legend: { display: false } },
    scales: {
      x: { ticks: { color: "#9ca3af" }, grid: { color: "#1f2937" } },
      y: { ticks: { color: "#9ca3af" }, grid: { color: "#1f2937" } },
    },
  };

  return (
    <div style={{ background: "#121826", border: "1px solid #2a3246", borderRadius: 8, padding: 12 }}>
      <h3 style={{ margin: "0 0 12px", color: "#f3f4f6" }}>Fraud Signals</h3>
      <Bar data={data} options={options} />
    </div>
  );
}
