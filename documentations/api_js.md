# api.js Documentation

## Purpose

The `api.js` file provides a centralized, pre-configured axios instance for all API requests in the UniQAKNTU frontend application. It handles authentication token management automatically and implements standardized error handling for unauthorized responses.

## Key Components

### Axios Instance Configuration

```javascript
const api = axios.create({
  baseURL: '/api/v1/',
  headers: {
    'Content-Type': 'application/json',
  },
});
```

Creates a dedicated axios instance with:
- **baseURL**: `/api/v1/` - All API requests are prefixed with this base path
- **headers**: Default Content-Type set to `application/json`

### Request Interceptor

Automatically attaches authentication tokens to outgoing requests:

```javascript
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('authToken');
  if (token) {
    config.headers.Authorization = `Token ${token}`;
  }
  return config;
}, (error) => Promise.reject(error));
```

**Functionality:**
- Retrieves the authentication token from `localStorage` using key `authToken`
- If token exists, attaches it to the `Authorization` header in format: `Token <token>`
- Returns modified config for all outgoing requests

### Response Interceptor

Handles 401 Unauthorized responses globally:

```javascript
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('authToken');
      localStorage.removeItem('authUser');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);
```

**Functionality:**
- Detects HTTP 401 Unauthorized status codes
- Clears authentication data from `localStorage`:
  - Removes `authToken`
  - Removes `authUser`
- Redirects user to `/login` route automatically

## Usage

### Import and Use in Components

```javascript
import api from '../services/api';

// GET request
const fetchCourses = async () => {
  const response = await api.get('/courses/');
  return response.data;
};

// POST request
const createTicket = async (ticketData) => {
  const response = await api.post('/tickets/', ticketData);
  return response.data;
};

// PUT request with file upload
const updateAnswer = async (id, formData) => {
  const response = await api.put(`/answers/${id}/`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
  return response.data;
};
```

### Automatic Token Handling

No manual token attachment required - the interceptor handles it:

```javascript
// Token is automatically attached
const userData = await api.get('/auth/user/');

// On 401, user is automatically logged out and redirected
const protectedData = await api.get('/protected-resource/');
```

## Integration Points

### AuthContext Integration

Works seamlessly with `AuthContext.jsx`:
- `AuthContext` stores tokens in `localStorage` using keys `authToken` and `authUser`
- `api.js` reads these tokens automatically for all requests
- On 401, `api.js` clears tokens and redirects, syncing with auth state

### Component Usage

All API calls throughout the application should use this instance:

```javascript
// In Login.jsx
import api from '../services/api';

const login = async (username, password) => {
  const response = await api.post('/auth/login/', { username, password });
  // ...
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
}
```

## Dependencies

- **axios**: HTTP client library for making API requests
- **localStorage**: Browser storage for persisting authentication tokens

## Change Log

- **Initial Implementation**: Created axios instance with base configuration, request interceptor for token attachment, and response interceptor for 401 handling
