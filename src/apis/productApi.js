// src/apis/productApi.js
import http from "./http";

/**
 * Products Management APIs
 */

// Create new product
export const createProductAPI = (formData) => {
  return http.post(`/api/products`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
};

// Get all products (admin)
export const getAllProductsAPI = () => {
  return http.get(`/api/products/admin/list/all`);
};

// Get products by category
export const getProductsByCategoryAPI = (categoryId) => {
  return http.get(`/api/products/admin/list/all?categoryId=${categoryId}`);
};

// Get single product by ID
export const getProductByIdAPI = (productId) => {
  return http.get(`/api/products/${productId}`);
};

// Update product
export const updateProductAPI = (productId, formData) => {
  return http.patch(`/api/products/${productId}`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
};

// Update product status (active/inactive)
export const updateProductStatusAPI = (productId, isActive) => {
  return http.patch(`/api/products/${productId}/status`, { isActive });
};

// Delete product
export const deleteProductAPI = (productId) => {
  return http.delete(`/api/products/${productId}`);
};

export default {
  createProductAPI,
  getAllProductsAPI,
  getProductsByCategoryAPI,
  getProductByIdAPI,
  updateProductAPI,
  updateProductStatusAPI,
  deleteProductAPI,
};