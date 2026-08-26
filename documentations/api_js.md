# API Service (api.js) Documentation

## Overview
The `api.js` module provides a pre-configured Axios instance for all API requests to the UniQAKNTU backend. It has been updated in Phase 2 to include response transformer utilities for standardized pagination handling.

## File Location
`frontend/src/services/api.js`

## Configuration

### Base URL
- **Endpoint:** `/api/`
- **Content-Type:** `application/json`
- **withCredentials:** `false` (JWT is stateless; CORS handles cross-origin)

## Authentication Flow

### Request Interceptor
Automatically attaches JWT access token to outgoing requests:

```javascript
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
```

### Response Interceptor - Auto Refresh
Handles 401 Unauthorized responses by attempting token refresh:

```javascript
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        const refresh = localStorage.getItem('refreshToken');
        const { data } = await api.post('/auth/token/refresh/', { refresh });
        
        localStorage.setItem('accessToken', data.access);
        originalRequest.headers.Authorization = `Bearer ${data.access}`;
        return api(originalRequest);
      } catch (refreshError) {
        localStorage.clear();
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }
    
    return Promise.reject(error);
  }
);
```

## Phase 2 Additions: Response Transformers

### extractResults()
Extracts results array from paginated API response.

**Signature:**
```javascript
export const extractResults = (response) => response.data?.results || [];
```

**Usage:**
```javascript
const response = await api.get('/questions/?status=APPROVED');
const questions = api.extractResults(response);
// Returns: Array of question objects or empty array
```

**Purpose:**
- Standardizes list response parsing across all components
- Handles edge cases where `response.data` or `results` might be undefined
- Aligns with backend pagination format: `{ count, next, previous, results }`

### getPaginationMeta()
Extracts pagination metadata from API response.

**Signature:**
```javascript
export const getPaginationMeta = (response) => ({
  count: response.data?.count || 0,
  next: response.data?.next || null,
  previous: response.data?.previous || null,
});
```

**Usage:**
```javascript
const response = await api.get('/questions/?page=2');
const meta = api.getPaginationMeta(response);
// Returns: { count: 142, next: '.../api/questions/?page=3', previous: '.../api/questions/?page=1' }
```

**Purpose:**
- Provides pagination controls (next/previous URLs)
- Returns total count for display
- Enables server-side pagination without client-side implementation

## Backend API Response Format

All GET list endpoints return:
```json
{
  "count": 142,
  "next": "http://.../api/questions/?page=2",
  "previous": null,
  "results": [
    { "id": 1, "title": "...", ... },
    { "id": 2, "title": "...", ... }
  ]
}
```

## Integration Examples

### Basic List Fetching
```javascript
import api from '../../services/api';

const fetchQuestions = async () => {
  const response = await api.get('/questions/?status=APPROVED');
  const questions = api.extractResults(response);
  setQuestions(questions);
};
```

### Pagination Handling
```javascript
const loadPage = async (url) => {
  const response = await api.get(url);
  const results = api.extractResults(response);
  const meta = api.getPaginationMeta(response);
  
  setData(results);
  setPagination(meta);
};

// Load next page
if (pagination.next) {
  loadPage(pagination.next);
}
```

## Exports

| Export | Type | Description |
|--------|------|-------------|
| `default` | Axios Instance | Pre-configured axios instance with interceptors |
| `extractResults` | Function | Extract results array from paginated response |
| `getPaginationMeta` | Function | Extract pagination metadata |

## Verification Status
**✅ Complete** - Phase 2 implementation complete. Response transformers added and ready for use.

## Related Files
- `components/wiki/QuestionExplorer.jsx` - Uses extractResults for question fetching
- `pages/Home.jsx` - May use pagination utilities
- `API.md` - API endpoint specifications
- `FIXING_TODO.md` - Phase 2 implementation checklist

## Testing Checklist
- [ ] Verify JWT token attachment on requests
- [ ] Test automatic token refresh on 401
- [ ] Confirm extractResults handles undefined responses
- [ ] Validate getPaginationMeta returns correct structure
- [ ] Test with actual backend pagination responses
