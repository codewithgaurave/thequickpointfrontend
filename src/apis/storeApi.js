// src/apis/storeApi.js
import http from "./http";

/**
 * Stores Management APIs
 */

// Create new store
export const createStoreAPI = (formData) => {
  return http.post(`/api/stores`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
};

// Get all stores (admin)
export const getAllStoresAPI = () => {
  return http.get(`/api/stores/admin`);
};

// Get single store by ID
export const getStoreByIdAPI = (storeId) => {
  return http.get(`/api/stores/admin/${storeId}`);
};

// Get products for a specific store (public API)
export const getStoreProductsAPI = (storeId) => {
  return http.get(`/api/stores/${storeId}/products`);
};

// Update store
export const updateStoreAPI = (storeId, formData) => {
  return http.patch(`/api/stores/${storeId}`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
};

// Update store status (active/inactive)
export const updateStoreStatusAPI = (storeId, isActive) => {
  return http.patch(`/api/stores/${storeId}/status`, { isActive });
};

// Delete store
export const deleteStoreAPI = (storeId) => {
  return http.delete(`/api/stores/${storeId}`);
};

// Assign product to store
export const assignProductToStoreAPI = (storeId, productId) => {
  return http.patch(`/api/stores/${storeId}/products/${productId}/assign`);
};

// Unassign product from store
export const unassignProductFromStoreAPI = (storeId, productId) => {
  return http.patch(`/api/stores/${storeId}/products/${productId}/unassign`);
};

export default {
  createStoreAPI,
  getAllStoresAPI,
  getStoreByIdAPI,
  getStoreProductsAPI,
  assignProductToStoreAPI,
  unassignProductFromStoreAPI,
  updateStoreAPI,
  updateStoreStatusAPI,
  deleteStoreAPI,
};