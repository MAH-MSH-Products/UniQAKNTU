import axios from 'axios';

/**
 * API Service - Configured Axios Instance
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

/**
 * Response Transformer Utilities
 * Standardizes API response parsing for list endpoints
 * All GET list endpoints return { count, next, previous, results } or a flat array
 */

/**
 * Extract results array from API response (Handles both Paginated and Flat Array responses)
 * @param {Object} response - Axios response object
 * @returns {Array} - Array of result objects or empty array
 */
export const extractResults = (response) => {
  // Check if the backend returned a flat array instead of a paginated object
  if (Array.isArray(response.data)) {
    return response.data;
  }
  // Otherwise, extract from the paginated results property
  return response.data?.results || [];
};

/**
 * Extract pagination metadata from API response
 * @param {Object} response - Axios response object
 * @returns {Object} - Pagination metadata { count, next, previous }
 */
export const getPaginationMeta = (response) => ({
  count: response.data?.count || 0,
  next: response.data?.next || null,
  previous: response.data?.previous || null,
});

// ============================================
// Phase 4: Routing & Query Parameter Alignment
// Replace nested REST paths with flat endpoints + query parameters
// ============================================

/**
 * Source Materials API (replaces /curriculum/courses/)
 * GET /api/source-materials/ - List all source materials
 * GET /api/source-materials/?id={id} - Get single source material by ID
 */
export const getSourceMaterials = (params = {}) => {
  return api.get('/source-materials/', { params });
};

/**
 * Get single source material by ID
 * Uses query parameter instead of path parameter
 * @param {number} id - Source material ID
 */
export const getSourceMaterialById = (id) => {
  return api.get('/source-materials/', { params: { id } });
};

/**
 * Answers API (replaces /wiki/questions/{id}/answers/)
 * GET /api/answers/?question={questionId} - Get answers for a specific question
 * @param {number} questionId - Question ID to fetch answers for
 */
export const getAnswersByQuestionId = (questionId) => {
  return api.get('/answers/', { params: { question: questionId } });
};

/**
 * Get single answer by ID
 * GET /api/answers/{id}/ - Path parameter for single answer
 * @param {number} id - Answer ID
 */
export const getAnswerById = (id) => {
  return api.get(`/answers/${id}/`);
};

export default api;