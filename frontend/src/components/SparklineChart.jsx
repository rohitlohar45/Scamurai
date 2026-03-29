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
        backgroundColor: "rgba(251,191,36,0.7)",
      },
    ],
  };

  const options = {
    responsive: true,
    plugins: { legend: { display: false } },
    scales: {
      x: { ticks: { color: "#9ca3af", maxTicksLimit: 8 }, grid: { color: "#1f2937" } },
      y: { ticks: { color: "#9ca3af" }, grid: { color: "#1f2937" } },
    },
  };

  return (
    <div style={{ background: "#121826", border: "1px solid #2a3246", borderRadius: 8, padding: 12 }}>
      <h3 style={{ margin: "0 0 12px", color: "#f3f4f6" }}>Alerts Last 60s</h3>
      <Bar data={data} options={options} />
    </div>
  );
}
