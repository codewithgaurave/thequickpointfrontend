// src/apis/orderApi.js
import http from "./http";

/**
 * Orders Management APIs
 */

// Get all orders (admin)
export const getAllOrdersAPI = () => {
  return http.get(`/api/orders`);
};

// Get global orders
export const getGlobalOrdersAPI = () => {
  return http.get(`/api/orders/global`);
};

// Get store orders by store ID
export const getStoreOrdersAPI = (storeId) => {
  return http.get(`/api/orders/store/${storeId}`);
};

// Get single order by ID
export const getOrderByIdAPI = (orderId) => {
  return http.get(`/api/orders/${orderId}`);
};

// Update order status
export const updateOrderStatusAPI = (orderId, status) => {
  return http.patch(`/api/orders/${orderId}/status`, { status });
};

// Update payment status
export const updatePaymentStatusAPI = (orderId, paymentStatus) => {
  return http.patch(`/api/orders/${orderId}/payment-status`, { paymentStatus });
};

// Delete order (soft delete)
export const deleteOrderAPI = (orderId) => {
  return http.delete(`/api/orders/${orderId}`);
};

// Get order statistics
export const getOrderStatsAPI = () => {
  return http.get(`/api/orders/stats`);
};

export default {
  getAllOrdersAPI,
  getGlobalOrdersAPI,
  getStoreOrdersAPI,
  getOrderByIdAPI,
  updateOrderStatusAPI,
  updatePaymentStatusAPI,
  deleteOrderAPI,
  getOrderStatsAPI,
};