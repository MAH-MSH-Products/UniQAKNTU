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

// ============================================
// Sprint 2: Premium Packages & Marketplace
// ============================================
export const getPackages = (params = {}) => {
  return api.get('/packages/', { params });
};

export const createPackage = (data) => {
  return api.post('/packages/', data);
};

export const purchasePackage = (packageId) => {
  return api.post(`/packages/${packageId}/purchase/`);
};

export const getMyPurchases = () => {
  return api.get('/users/me/purchases/');
};

// ============================================
// Sprint 2: Gamification & Reward Tokens
// ============================================
export const getTokenHistory = () => {
  return api.get('/users/me/token-history/');
};

// ============================================
// Sprint 2: Custom Exam Builder
// ============================================
export const createCustomExam = (data) => {
  return api.post('/custom-exams/', data);
};

export const getCustomExams = () => {
  return api.get('/custom-exams/');
};

export const getCustomExamById = (id) => {
  return api.get(`/custom-exams/${id}/`);
};

export const deleteCustomExam = (id) => {
  return api.delete(`/custom-exams/${id}/`);
};

// ============================================
// Sprint 2: AI Integration & Tooling
// ============================================
export const generateAIAnswer = (questionId) => {
  return api.post('/ai/generate-answer/', { question_id: questionId });
};

export const improveTextWithAI = (text) => {
  return api.post('/ai/improve-text/', { text });
};

// ============================================
// Planner: Sub-module 1 - Performed Weekly Plan
// ============================================
export const getWeeklyPerformance = (params = {}) => {
  return api.get('/planner/weekly-performance/', { params });
};

// ============================================
// Planner: Sub-module 2 - Conclusion Plan & Test Analytics
// ============================================
export const getConclusionPlan = (params = {}) => {
  return api.get('/planner/conclusion-plan/', { params });
};

export const getConclusionPlanChapters = (sourceMaterialId) => {
  return api.get('/planner/conclusion-plan/chapters/', {
    params: { source_material_id: sourceMaterialId }
  });
};

export const createOrUpdateTestRecord = (data) => {
  return api.post('/planner/conclusion-plan/test-records/', data);
};

export const deleteTestRecord = (id) => {
  return api.delete(`/planner/conclusion-plan/test-records/${id}/`);
};

export const setChapterMastery = (data) => {
  return api.post('/planner/conclusion-plan/mastery/', data);
};

export const deleteChapterMastery = (chapterId) => {
  return api.delete(`/planner/conclusion-plan/mastery/${chapterId}/`);
};

export const getChapters = (params = {}) => {
  return api.get('/planner/chapters/', { params });
};

export const createChapter = (data) => {
  return api.post('/planner/chapters/', data);
};

export const updateChapter = (id, data) => {
  return api.put(`/planner/chapters/${id}/`, data);
};

export const patchChapter = (id, data) => {
  return api.patch(`/planner/chapters/${id}/`, data);
};

export const deleteChapter = (id) => {
  return api.delete(`/planner/chapters/${id}/`);
};

// ============================================
// Planner: Sub-module 3 - Dashboard & Student Tools
// ============================================
export const getDashboardSummary = () => {
  return api.get('/planner/dashboard/summary/');
};

export const getDailyNote = () => {
  return api.get('/planner/dashboard/notes/');
};

export const saveDailyNote = (data) => {
  return api.post('/planner/dashboard/notes/', data);
};

export const getConsultations = () => {
  return api.get('/planner/dashboard/consultations/');
};

export const bookConsultation = (data) => {
  return api.post('/planner/dashboard/consultations/', data);
};

export const cancelConsultationBooking = (id) => {
  return api.delete(`/planner/dashboard/consultations/${id}/`);
};

export const getAdminConsultations = (params = {}) => {
  return api.get('/planner/admin/consultations/', { params });
};

export const updateConsultationStatus = (id, data) => {
  return api.patch(`/planner/admin/consultations/${id}/`, data);
};

// ============================================
// Community: Sub-module 4 - Community & Leaderboard
// ============================================
export const getLeaderboard = (period = 'week') => {
  return api.get('/community/leaderboard/', { params: { period } });
};

export const getOpinions = (params = {}) => {
  return api.get('/community/opinions/', { params });
};

export const submitOpinion = (data) => {
  return api.post('/community/opinions/', data);
};

export const voteOpinion = (id, value) => {
  return api.post(`/community/opinions/${id}/vote/`, { value });
};

export const getAdminOpinions = (params = {}) => {
  return api.get('/community/admin/opinions/', { params });
};

export const moderateOpinion = (id, action) => {
  return api.post(`/community/admin/opinions/${id}/moderate/`, { action });
};

// ============================================
// Planner: Sub-module 5 - Weekly Study Hours
// ============================================
export const getWeeklyHoursOverview = (params = {}) => {
  return api.get('/planner/weekly-hours/current/', { params });
};

export const getDailyStudyLog = (date) => {
  return api.get(`/planner/weekly-hours/daily-logs/${date}/`);
};

export const saveDailyStudyLog = (date, data) => {
  return api.put(`/planner/weekly-hours/daily-logs/${date}/`, data);
};

// ============================================
// Planner: Sub-module 6 - Student Reports
// ============================================
export const getWeeklyReport = (params = {}) => {
  return api.get('/planner/reports/weekly/', { params });
};

export const getPerformedReport = (params = {}) => {
  return api.get('/planner/reports/performed/', { params });
};

export const getConclusionReport = (params = {}) => {
  return api.get('/planner/reports/conclusion/', { params });
};

export const getFullReport = (params = {}) => {
  return api.get('/planner/reports/full/', { params });
};

export const downloadReportPdf = async (type, params = {}) => {
  const response = await api.get(`/planner/reports/${type}/`, {
    params: { ...params, format: 'pdf' },
    responseType: 'blob',
    headers: {
      Accept: 'application/pdf',
    },
  });
  const blob = new Blob([response.data], { type: 'application/pdf' });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  const filename = `${type}_report_${params.start_date || 'week'}.pdf`;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
};

// ============================================
// Planner: Sub-module 7 - Student Analytics
// ============================================
export const getTotalActivityAnalytics = (params = {}) => {
  return api.get('/planner/analytics/total-activity/', { params });
};

export const getCourseAveragesAnalytics = (params = {}) => {
  return api.get('/planner/analytics/course-averages/', { params });
};

export const getTimeAllocationAnalytics = (params = {}) => {
  return api.get('/planner/analytics/time-allocation/', { params });
};

export const getStackedCourseActivityAnalytics = (params = {}) => {
  return api.get('/planner/analytics/stacked-course-activity/', { params });
};

export default api;

