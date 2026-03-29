import axios from "axios";

const getBaseUrl = () => {
  if (
    typeof window !== "undefined" &&
    window.__CONFIG__ &&
    typeof window.__CONFIG__.API_URL === "string" &&
    window.__CONFIG__.API_URL.trim() !== ""
  ) {
    return window.__CONFIG__.API_URL;
  }
  return process.env.REACT_APP_API_URL || "http://localhost:8000";
};

const BASE_URL = getBaseUrl();

const client = axios.create({
  baseURL: BASE_URL,
  timeout: 5000,
});

const api = {
  async getStats() {
    const response = await client.get("/stats");
    return response.data;
  },
  async getTransactions() {
    const response = await client.get("/transactions/recent");
    return response.data.transactions || [];
  },
  async injectFraud() {
    const response = await client.post("/inject-fraud");
    return response.data;
  },
};

export default api;
