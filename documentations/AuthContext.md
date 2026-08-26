# AuthContext.jsx Documentation

## Purpose

The `AuthContext.jsx` file provides a React Context for managing authentication state throughout the UniQAKNTU frontend application. It handles JWT token lifecycle management, user session state, and role-based access control (RBAC) by decoding JWT tokens to extract user information.

## Key Components

### Context and Provider

```javascript
const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [accessToken, setAccessToken] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  // ...
};
```

**State Variables:**
- `user`: User object containing `{ id, username, role }` extracted from JWT
- `accessToken`: Current JWT access token
- `isLoading`: Loading state during auth context initialization

### Role-Based Access Control Helpers

```javascript
export const canModerate = (role) => ['MODERATOR', 'ADMIN'].includes(role);
export const isAdmin = (role) => role === 'ADMIN';
```

**Exported Functions:**
- `canModerate(role)`: Returns true if role is MODERATOR or ADMIN
- `isAdmin(role)`: Returns true if role is ADMIN

### JWT Token Decoding

```javascript
const decodeUserFromToken = (token) => {
  try {
    const decoded = jwtDecode(token);
    return {
      id: decoded.user_id || decoded.id,
      username: decoded.username,
      role: decoded.role || 'STUDENT',
    };
  } catch (error) {
    console.error('Failed to decode JWT token:', error);
    return null;
  }
};
```

**Functionality:**
- Uses `jwt-decode` library to decode JWT access tokens
- Extracts `user_id`, `username`, and `role` from token payload
- Defaults role to `'STUDENT'` if not present in token
- Handles decoding errors gracefully

### Initialization Effect

```javascript
useEffect(() => {
  const storedToken = localStorage.getItem('accessToken');
  
  if (storedToken) {
    setAccessToken(storedToken);
    const userData = decodeUserFromToken(storedToken);
    if (userData) {
      setUser(userData);
    }
  }
  setIsLoading(false);
}, []);
```

**Functionality:**
- Runs once on component mount
- Checks localStorage for existing `accessToken`
- Decodes user information from stored token
- Sets loading state to false after initialization

### Login Function

```javascript
const login = async (username, password) => {
  try {
    const response = await api.post('/auth/token/', { username, password });
    const { access, refresh } = response.data;

    localStorage.setItem('accessToken', access);
    localStorage.setItem('refreshToken', refresh);
    
    setAccessToken(access);
    
    const userData = decodeUserFromToken(access);
    setUser(userData);

    return { success: true, data: response.data };
  } catch (error) {
    return { 
      success: false, 
      error: error.response?.data?.message || 'Login failed' 
    };
  }
};
```

**Functionality:**
- Calls `POST /api/auth/token/` with username and password
- Receives `{ access, refresh }` JWT tokens from backend
- Stores both tokens in localStorage
- Decodes user information from access token
- Returns success status and data/error message

### Logout Function

```javascript
const logout = () => {
  setAccessToken(null);
  setUser(null);
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
};
```

**Functionality:**
- Clears all authentication state
- Removes both tokens from localStorage
- Triggers redirect to login page (handled by routing)

### Computed Properties

```javascript
const userRole = user?.role || 'STUDENT';
const canModerateFlag = canModerate(userRole);
const isAuthenticated = !!accessToken && !!user;
```

**Derived Values:**
- `userRole`: Current user's role (defaults to 'STUDENT')
- `canModerateFlag`: Boolean indicating moderator/admin privileges
- `isAuthenticated`: Boolean indicating authenticated state

### Context Value

```javascript
const value = {
  user,
  accessToken,
  isLoading,
  login,
  logout,
  userRole,
  canModerate: canModerateFlag,
  isAdmin: isAdmin(userRole),
  isAuthenticated,
};
```

## Usage

### Wrapping Application with AuthProvider

```javascript
// In main.jsx or App.jsx
import { AuthProvider } from './context/AuthContext';

ReactDOM.createRoot(document.getElementById('root')).render(
  <AuthProvider>
    <App />
  </AuthProvider>
);
```

### Using useAuth Hook in Components

```javascript
import { useAuth } from '../context/AuthContext';

const MyComponent = () => {
  const { user, isAuthenticated, canModerate, logout } = useAuth();
  
  return (
    <div>
      {isAuthenticated ? (
        <p>Welcome, {user.username}! Role: {user.role}</p>
      ) : (
        <p>Please log in</p>
      )}
      
      {canModerate && <button>Moderate Content</button>}
    </div>
  );
};
```

### Login Form Integration

```javascript
const LoginForm = () => {
  const { login } = useAuth();
  const [credentials, setCredentials] = useState({ username: '', password: '' });
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    const result = await login(credentials.username, credentials.password);
    
    if (result.success) {
      // Redirect to dashboard
    } else {
      // Show error message
    }
  };
};
```

## Integration Points

### Backend API Endpoints

- **Token Obtain**: `POST /api/auth/token/`
  - Request: `{ username, password }`
  - Response: `{ access, refresh }`
  - Used by: `login()` function

- **Token Refresh**: `POST /api/auth/token/refresh/`
  - Request: `{ refresh }`
  - Response: `{ access }`
  - Used by: api.js response interceptor (automatic)

### JWT Token Structure

Expected token payload:
```javascript
{
  "user_id": 123,
  "username": "john_doe",
  "role": "STUDENT", // or "MODERATOR" or "ADMIN"
  "exp": 1234567890,
  "iat": 1234567000
}
```

### Role Hierarchy

| Role | canModerate | isAdmin | Permissions |
|------|-------------|---------|-------------|
| STUDENT | false | false | View approved content, create questions/answers |
| MODERATOR | true | false | Approve/reject content, manage users |
| ADMIN | true | true | Full system access, role management |

### localStorage Keys

- `accessToken`: JWT access token (short-lived)
- `refreshToken`: JWT refresh token (long-lived)

## Dependencies

- **react**: Core React library
- **jwt-decode**: Library for decoding JWT tokens without verification
- **axios** (via api.js): HTTP client for API requests

## Change Log

### Phase 1 - JWT Migration (Current)
- Replaced boolean `is_instructor` flag with enum-based `role` field
- Implemented JWT token decoding using `jwt-decode` library
- Changed from single `authToken` to separate `accessToken`/`refreshToken`
- Updated login endpoint from `/auth/login/` to `/api/auth/token/`
- Added `canModerate` and `isAdmin` helper functions for RBAC
- Exported RBAC helpers for use in other components
- Changed user extraction from server response to JWT decoding

### Initial Implementation (Previous)
- Created AuthContext with basic authentication state
- Implemented login/logout functionality
- Used boolean `is_instructor` flag for role checking
- Stored `authToken` and `authUser` in localStorage
