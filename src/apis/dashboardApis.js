// src/services/dashboardService.js
// Small wrapper around your existing axios instance (src/apis/http.js)
import http from "../apis/http";

/**
 * Fetch full admin dashboard payload
 * GET /api/dashboard/admin
 * returns: axios response (response.data expected to contain dashboard object)
 */
export const adminDashboardAPI = () => {
  return http.get("/api/dashboard/admin");
};

/**
 * Fetch quick stats
 * GET /api/dashboard/quick-stats
 */
export const quickStatsAPI = () => {
  return http.get("/api/dashboard/quick-stats");
};

/**
 * Fetch analytics for a period
 * GET /api/dashboard/analytics/period?type=...&startDate=...&endDate=...
 * params: { type = 'month'|'week'|'day'|'year', startDate?: 'YYYY-MM-DD', endDate?: 'YYYY-MM-DD' }
 */
export const analyticsAPI = ({ type = "month", startDate, endDate } = {}) => {
  const params = new URLSearchParams();
  params.set("type", type);
  if (startDate) params.set("startDate", startDate);
  if (endDate) params.set("endDate", endDate);

  return http.get(`/api/dashboard/analytics/period?${params.toString()}`);
};

export default {
  adminDashboardAPI,
  quickStatsAPI,
  analyticsAPI,
};
