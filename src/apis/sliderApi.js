// src/services/sliderService.js
import http from "../apis/http";

/**
 * Slider Management APIs
 */

// Create new slider
export const createSliderAPI = (formData) => {
  return http.post(`/api/sliders`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
};

// Get all sliders (admin)
export const getAllSlidersAPI = () => {
  return http.get(`/api/sliders/admin/list/all`);
};

// Get single slider by ID
export const getSliderByIdAPI = (sliderId) => {
  return http.get(`/api/sliders/${sliderId}`);
};

// Update slider
export const updateSliderAPI = (sliderId, formData) => {
  return http.patch(`/api/sliders/${sliderId}`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
};

// Update slider status (active/inactive)
export const updateSliderStatusAPI = (sliderId, isActive) => {
  return http.patch(`/api/sliders/${sliderId}/status`, { isActive });
};

// Delete slider
export const deleteSliderAPI = (sliderId) => {
  return http.delete(`/api/sliders/${sliderId}`);
};

export default {
  createSliderAPI,
  getAllSlidersAPI,
  getSliderByIdAPI,
  updateSliderAPI,
  updateSliderStatusAPI,
  deleteSliderAPI,
};