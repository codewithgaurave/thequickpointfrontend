// src/services/userService.js
import http from "../apis/http";

/**
 * Admin-only user APIs
 */

// List all users
export const listUsersAPI = (params = {}) => {
  // optionally allow query params (page, limit, search)
  const query = new URLSearchParams(params).toString();
  const url = query ? `/api/users?${query}` : "/api/users";
  return http.get(url);
};

// Get single user by id
export const getUserAPI = (userId) => {
  return http.get(`/api/users/${userId}`);
};

// Update user by id (PATCH)
export const updateUserAPI = (userId, payload) => {
  return http.patch(`/api/users/${userId}`, payload);
};

// Block / Unblock user
export const blockUserAPI = (userId, isBlocked = true) => {
  return http.patch(`/api/users/${userId}/block`, { isBlocked });
};

// Delete user (admin)
export const deleteUserAPI = (userId) => {
  return http.delete(`/api/users/${userId}`);
};

export default {
  listUsersAPI,
  getUserAPI,
  updateUserAPI,
  blockUserAPI,
  deleteUserAPI,
};
