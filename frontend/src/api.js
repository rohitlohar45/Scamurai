import axios from "axios";

const BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:8000";

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
