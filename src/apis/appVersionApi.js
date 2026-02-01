// src/apis/appVersionApi.js
import http from "./http";

/**
 * App Version Management APIs
 */

// Create new version (Admin)
export const createVersionAPI = (versionData) => {
  return http.post(`/api/app-version`, versionData);
};

// Get all versions (Admin)
export const getAllVersionsAPI = (params = {}) => {
  const queryString = new URLSearchParams(params).toString();
  return http.get(`/api/app-version/all${queryString ? `?${queryString}` : ''}`);
};

// Get latest version (Public)
export const getLatestVersionAPI = (platform) => {
  return http.get(`/api/app-version/latest${platform ? `?platform=${platform}` : ''}`);
};

// Check update required (Public)
export const checkUpdateAPI = (updateData) => {
  return http.post(`/api/app-version/check-update`, updateData);
};

// Update version (Admin)
export const updateVersionAPI = (versionId, versionData) => {
  return http.put(`/api/app-version/${versionId}`, versionData);
};

// Delete version (Admin)
export const deleteVersionAPI = (versionId) => {
  return http.delete(`/api/app-version/${versionId}`);
};

// Get latest save info (Public)
export const getLatestSaveInfoAPI = (type = 'all') => {
  return http.get(`/api/app-version/latest-save${type ? `?type=${type}` : ''}`);
};

export default {
  createVersionAPI,
  getAllVersionsAPI,
  getLatestVersionAPI,
  checkUpdateAPI,
  updateVersionAPI,
  deleteVersionAPI,
  getLatestSaveInfoAPI,
};