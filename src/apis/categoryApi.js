// src/apis/categoryApi.js
import http from "./http";

/**
 * Categories Management APIs
 */

// Create new category
export const createCategoryAPI = (formData) => {
  return http.post(`/api/categories`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
};

// Get all categories (admin)
export const getAllCategoriesAPI = () => {
  return http.get(`/api/categories/admin`);
};

// Get single category by ID
export const getCategoryByIdAPI = (categoryId) => {
  return http.get(`/api/categories/${categoryId}`);
};

// Update category
export const updateCategoryAPI = (categoryId, formData) => {
  return http.patch(`/api/categories/${categoryId}`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
};

// Update category status (active/inactive)
export const updateCategoryStatusAPI = (categoryId, isActive) => {
  return http.patch(`/api/categories/${categoryId}/status`, { isActive });
};

// Delete category
export const deleteCategoryAPI = (categoryId) => {
  return http.delete(`/api/categories/${categoryId}`);
};

export default {
  createCategoryAPI,
  getAllCategoriesAPI,
  getCategoryByIdAPI,
  updateCategoryAPI,
  updateCategoryStatusAPI,
  deleteCategoryAPI,
};