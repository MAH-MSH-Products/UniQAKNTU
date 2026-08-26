import axios from 'axios';

/**
 * API Service - Configured Axios Instance
 * 
 * This module provides a pre-configured axios instance for all API requests.
 * It automatically handles JWT authentication tokens with request/response interceptors.
 * Implements automatic token refresh on 401 Unauthorized responses.
 */

// Create axios instance with base configuration
const api = axios.create({
  baseURL: '/api/',
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: false, // JWT is stateless; CORS handles cross-origin
});

/**
 * Request Interceptor
 * Attaches JWT access token to outgoing requests if available in localStorage
 * Uses Bearer token format as per backend specification
 */
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

/**
 * Response Interceptor - Auto-Refresh Token
 * Handles 401 Unauthorized responses by attempting to refresh the access token
 * If refresh fails, clears all auth data and redirects to login
 */
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        const refresh = localStorage.getItem('refreshToken');
        const { data } = await api.post('/auth/token/refresh/', { refresh });
        
        // Store new access token
        localStorage.setItem('accessToken', data.access);
        
        // Retry original request with new token
        originalRequest.headers.Authorization = `Bearer ${data.access}`;
        return api(originalRequest);
      } catch (refreshError) {
        // Refresh failed - clear all auth data and redirect to login
        localStorage.clear();
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }
    
    return Promise.reject(error);
  }
);

export default api;
