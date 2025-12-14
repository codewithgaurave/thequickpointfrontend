import axios from "axios";

// Fallback baseURL (remove trailing slash if any)
const FALLBACK_BASE_URL = "{{baseUrl}}".replace(/\/+$/, "");

const http = axios.create({
  baseURL: import.meta.env?.VITE_API_BASE_URL || FALLBACK_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

/**
 * ===============================
 * REQUEST INTERCEPTOR
 * - Attach ADMIN token
 * ===============================
 */
http.interceptors.request.use(
  (config) => {
    try {
      const adminToken = localStorage.getItem("admin-token");

      if (adminToken) {
        config.headers = config.headers || {};
        config.headers.Authorization = `Bearer ${adminToken}`;
      } else if (config.headers?.Authorization) {
        delete config.headers.Authorization;
      }
    } catch (err) {
      // silently fail (do not block request)
    }

    return config;
  },
  (error) => Promise.reject(error)
);

/**
 * ===============================
 * RESPONSE INTERCEPTOR
 * - Auto logout on token expiry / 401
 * ===============================
 */
http.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status;

    if (status === 401 || status === 403) {
      try {
        // 🔥 Clear ADMIN auth data
        localStorage.removeItem("admin-data");
        localStorage.removeItem("admin-token");
      } catch (err) {
        // ignore
      }

      // 🔁 Force redirect to admin login
      // (use window.location to reset app state fully)
      if (!window.location.pathname.includes("/admin/login")) {
        window.location.href = "/admin/login";
      }
    }

    return Promise.reject(error);
  }
);

export default http;
