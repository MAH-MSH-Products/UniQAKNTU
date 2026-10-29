# API Service (api.js) Documentation

## Overview
The `api.js` module provides a pre-configured Axios instance for all API requests to the UniQAKNTU backend. It has been updated in Phase 2 to include response transformer utilities for standardized pagination handling, and in Phase 4 to implement flat endpoint structure with query parameters instead of nested REST paths.

## File Location
`frontend/src/services/api.js`

## Configuration

### Base URL
- **Endpoint:** `/api/`
- **Content-Type:** `application/json`
- **withCredentials:** `false` (JWT is stateless; CORS handles cross-origin)

## Authentication Flow

### Request Interceptor
Automatically attaches JWT access token and active language (`Accept-Language`) to outgoing requests:

```javascript
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  const currentLang = (localStorage.getItem('i18nextLng') || 'en').split('-')[0];
  config.headers['Accept-Language'] = currentLang;
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

## Phase 4: Flat Endpoint Structure

### Route Mapping
Phase 4 replaces nested REST paths with flat endpoints using query parameters:

| Old Frontend Route | New Backend Endpoint | Query Parameter |
|-------------------|----------------------|-----------------|
| `/curriculum/courses/` | `/api/source-materials/` | None |
| `/curriculum/courses/{id}/exams/` | `/api/source-materials/` | `?id={id}` |
| `/wiki/questions/{id}/answers/` | `/api/answers/` | `?question={id}` |
| `/wiki/answers/{id}/` | `/api/answers/{id}/` | Path param (unchanged) |

### getSourceMaterials()
Fetches all source materials (replaces old `/curriculum/courses/` endpoint).

**Signature:**
```javascript
export const getSourceMaterials = (params = {}) => {
  return api.get('/source-materials', { params });
};
```

**Usage:**
```javascript
// Get all source materials
const response = await getSourceMaterials();
const materials = extractResults(response);

// Get single source material by ID (using query param)
const response = await getSourceMaterials({ id: 42 });
const material = response.data;
```

### getSourceMaterialById()
Fetches a single source material by ID using query parameter instead of path parameter.

**Signature:**
```javascript
export const getSourceMaterialById = (id) => {
  return api.get('/source-materials', { params: { id } });
};
```

**Usage:**
```javascript
const response = await getSourceMaterialById(42);
const material = response.data;
```

**Purpose:**
- Replaces nested path `/curriculum/courses/{id}/exams/`
- Uses flat endpoint with query parameter for consistency
- Aligns with backend's flat API design

### getAnswersByQuestionId()
Fetches answers for a specific question using query parameter (replaces nested path).

**Signature:**
```javascript
export const getAnswersByQuestionId = (questionId) => {
  return api.get('/answers', { params: { question: questionId } });
};
```

**Usage:**
```javascript
const response = await getAnswersByQuestionId(15);
const answers = extractResults(response);
```

**Purpose:**
- Replaces nested path `/wiki/questions/{id}/answers/`
- Uses flat endpoint `GET /api/answers/?question={id}`
- Simplifies routing and aligns with backend design

### getAnswerById()
Fetches a single answer by ID using path parameter.

**Signature:**
```javascript
export const getAnswerById = (id) => {
  return api.get(`/answers/${id}/`);
};
```

**Usage:**
```javascript
const response = await getAnswerById(123);
const answer = response.data;
```

**Purpose:**
- Retrieves single answer detail
- Uses standard path parameter pattern (unchanged from previous implementation)

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

### Phase 4: Source Materials Caching
```javascript
import { useSourceMaterials } from '../../context/SourceMaterialsContext';

function QuestionForm() {
  const { materials, loading, getMaterialById } = useSourceMaterials();
  
  // Use cached materials for dropdown
  return (
    <select>
      {materials.map(m => (
        <option key={m.id} value={m.id}>{m.title}</option>
      ))}
    </select>
  );
}
```

### Phase 4: Fetching Answers by Question
```javascript
import { getAnswersByQuestionId } from '../../services/api';

const fetchAnswers = async (questionId) => {
  const response = await getAnswersByQuestionId(questionId);
  const answers = extractResults(response);
  setAnswers(answers);
};
```

## Exports

| Export | Type | Description |
|--------|------|-------------|
| `default` | Axios Instance | Pre-configured axios instance with interceptors |
| `extractResults` | Function | Extract results array from paginated response |
| `getPaginationMeta` | Function | Extract pagination metadata |
| `getSourceMaterials` | Function | Get all source materials or filter by query params (Phase 4) |
| `getSourceMaterialById` | Function | Get single source material by ID using query param (Phase 4) |
| `getAnswersByQuestionId` | Function | Get answers for a specific question using query param (Phase 4) |
| `getAnswerById` | Function | Get single answer by ID using path param (Phase 4) |

## Verification Status
**✅ Complete** - Phase 2 implementation complete with response transformers. Phase 4 flat endpoint structure implemented with query parameter alignment.

## Related Files
- `components/wiki/QuestionExplorer.jsx` - Uses extractResults for question fetching
- `components/wiki/AnswerForm.jsx` - Uses SourceMaterialsContext for dropdown population
- `context/SourceMaterialsContext.jsx` - Caches source materials globally (Phase 4)
- `pages/Home.jsx` - May use pagination utilities
- `API.md` - API endpoint specifications
- `FIXING_TODO.md` - Phase 2 and Phase 4 implementation checklists

## Testing Checklist
- [ ] Verify JWT token attachment on requests
- [ ] Test automatic token refresh on 401
- [ ] Confirm extractResults handles undefined responses
- [ ] Validate getPaginationMeta returns correct structure
- [ ] Test with actual backend pagination responses
- [ ] **Phase 4**: Verify `/api/source-materials/` endpoint works correctly
- [ ] **Phase 4**: Verify `/api/answers/?question={id}` returns filtered answers
- [ ] **Phase 4**: Confirm source materials caching in context works properly
- [ ] ⚠️ باید چک شود - Full integration testing with backend flat endpoints
