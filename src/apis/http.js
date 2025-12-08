import axios from "axios";

// Fallback baseURL if env var not provided (replace with your production API)
const FALLBACK_BASE_URL = "{{baseUrl}}".replace(/\/+$/, ""); // remove trailing slash

const http = axios.create({
  baseURL: import.meta.env?.VITE_API_BASE_URL || FALLBACK_BASE_URL,
  headers: { "Content-Type": "application/json" },
});

// Attach Admin token for every request
http.interceptors.request.use(
  (config) => {
    try {
      // 🔥 Sirf ADMIN ka token (admin-token) use karenge
      const adminToken = localStorage.getItem("admin-token");
      if (adminToken) {
        // ensure headers object exists
        config.headers = config.headers || {};
        config.headers.Authorization = `Bearer ${adminToken}`;
      } else if (config.headers) {
        // Optional: agar token hi nahi hai to header hata do
        delete config.headers.Authorization;
      }
    } catch (err) {
      // non-blocking: if localStorage is unavailable, continue without token
      // console.warn("http interceptor error:", err);
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export default http;
