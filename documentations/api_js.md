# api.js Documentation

## Purpose

The `api.js` file provides a centralized, pre-configured axios instance for all API requests in the UniQAKNTU frontend application. It handles JWT authentication token management automatically through request and response interceptors, including automatic token refresh on 401 Unauthorized responses.

## Key Components

### Axios Instance Configuration

```javascript
const api = axios.create({
  baseURL: '/api/',
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: false, // JWT is stateless; CORS handles cross-origin
});
```

Creates a dedicated axios instance with:
- **baseURL**: `/api/` - All API requests are prefixed with this base path
- **headers**: Default Content-Type set to `application/json`
- **withCredentials**: `false` - JWT is stateless; CORS handles cross-origin requests

### Request Interceptor

Automatically attaches JWT access tokens to outgoing requests:

```javascript
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => Promise.reject(error));
```

**Functionality:**
- Retrieves the JWT access token from `localStorage` using key `accessToken`
- If token exists, attaches it to the `Authorization` header in format: `Bearer <token>`
- Returns modified config for all outgoing requests

### Response Interceptor (Auto-Refresh)

Handles 401 Unauthorized responses by attempting automatic token refresh:

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

**Functionality:**
- Detects HTTP 401 Unauthorized status codes
- Sets `_retry` flag to prevent infinite retry loops
- Attempts to refresh the access token using the refresh token from localStorage
- Stores new access token in localStorage
- Retries the original request with the updated Authorization header
- On refresh failure: clears all localStorage data and redirects to `/login`

## Usage

### Import and Use in Components

```javascript
import api from '../services/api';

// GET request with auto-auth
const fetchQuestions = async () => {
  const response = await api.get('/questions/');
  return response.data;
};

// POST request with JWT token
const createAnswer = async (answerData) => {
  const response = await api.post('/answers/', answerData);
  return response.data;
};

// PATCH request
const updateQuestion = async (id, data) => {
  const response = await api.patch(`/questions/${id}/`, data);
  return response.data;
};
```

### Automatic Token Handling

No manual token attachment required - the interceptors handle everything:

```javascript
// Token is automatically attached as Bearer <accessToken>
const userData = await api.get('/users/me/');

// On 401, token is automatically refreshed and request retried
const protectedData = await api.get('/protected-resource/');

// If refresh fails, user is redirected to login
```

### Token Management

Tokens are stored in localStorage by AuthContext:
- `accessToken`: JWT access token (short-lived, used for API requests)
- `refreshToken`: JWT refresh token (long-lived, used for obtaining new access tokens)

## Integration Points

### AuthContext Integration

Works seamlessly with `AuthContext.jsx`:
- `AuthContext` stores JWT tokens in `localStorage` using keys `accessToken` and `refreshToken`
- `AuthContext` decodes JWT tokens to extract user information (user_id, role, username)
- `api.js` reads tokens from localStorage automatically for all requests
- On 401, `api.js` attempts token refresh before clearing storage and redirecting

### Backend Endpoints

- **Token Obtain**: `POST /api/auth/token/` - Called by AuthContext during login
  - Request: `{ username, password }`
  - Response: `{ access, refresh }`
- **Token Refresh**: `POST /api/auth/token/refresh/` - Called automatically on 401
  - Request: `{ refresh }`
  - Response: `{ access }`
- **All API Routes**: Base URL is `/api/` (configured in axios instance)

### Component Usage

All API calls throughout the application should use this instance:

```javascript
// In Login.jsx
import api from '../services/api';

const login = async (username, password) => {
  const response = await api.post('/auth/token/', { username, password });
  // Access and refresh tokens are handled by AuthContext
};
```

### Error Handling

Components can catch errors from rejected promises:

```javascript
try {
  const data = await api.get('/some-endpoint/');
} catch (error) {
  if (error.response) {
    console.error('API Error:', error.response.status);
  }
  // 401 errors are handled automatically by interceptor
}
```

## Dependencies

- **axios**: HTTP client library for making API requests
- **jwt-decode**: Used by AuthContext to decode JWT tokens (not directly in api.js)
- **localStorage**: Browser storage for persisting JWT tokens

## Change Log

### Phase 1 - JWT Migration (Current)
- Changed `baseURL` from `/api/v1/` to `/api/`
- Replaced Token-based auth (`Token <token>`) with Bearer JWT auth (`Bearer <token>`)
- Implemented automatic token refresh interceptor
- Added `withCredentials: false` configuration
- Changed token storage keys from `authToken`/`authUser` to `accessToken`/`refreshToken`
- Enhanced 401 handling to attempt token refresh before logout

### Initial Implementation (Previous)
- Created axios instance with base configuration
- Request interceptor for token attachment
- Response interceptor for 401 handling with immediate logout
