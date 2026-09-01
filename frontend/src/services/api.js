import axios from 'axios';

// Create axios instance with base configuration
const api = axios.create({
  baseURL: '/api/',
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: false, // JWT is stateless; CORS handles cross-origin
});

// Request Interceptor
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    const currentLang = (localStorage.getItem('i18nextLng') || 'en').split('-')[0];
    config.headers['Accept-Language'] = currentLang;
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response Interceptor - Auto-Refresh Token
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        const refresh = localStorage.getItem('refreshToken');
        const { data } = await api.post('/auth/token/refresh/', { refresh });
        
        // Store new access token and new refresh token (Token Rotation)
        localStorage.setItem('accessToken', data.access);
        if (data.refresh) {
          localStorage.setItem('refreshToken', data.refresh);
        }
        
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
 * Extract results array from API response (Handles both Paginated and Flat Array responses)
 * @param {Object} response - Axios response object
 * @returns {Array} - Array of result objects or empty array
 */
export const extractResults = (response) => {
  if (Array.isArray(response.data)) {
    return response.data;
  }
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
// ============================================

export const getSourceMaterials = (params = {}) => {
  return api.get('/source-materials/', { params });
};

export const getSourceMaterialById = (id) => {
  return api.get('/source-materials/', { params: { id } });
};

export const getAnswersByQuestionId = (questionId) => {
  return api.get('/answers/', { params: { question: questionId } });
};

export const getAnswerById = (id) => {
  return api.get(`/answers/${id}/`);
};

export default api;