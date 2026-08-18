# AuthContext.jsx Documentation

## Purpose

The `AuthContext.jsx` file provides a centralized authentication state management system for the UniQAKNTU React application. It manages user sessions, authentication tokens, and role-based access control throughout the application using React Context API.

## Key Components

### AuthContext

```javascript
const AuthContext = createContext(null);
```

A React Context object that holds authentication state and methods, accessible throughout the component tree.

### AuthProvider Component

The main provider component that wraps the application and exposes authentication state:

```javascript
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  // ...
};
```

**State Management:**
- **user**: Object containing user data (username, is_instructor, is_staff, etc.) or null
- **token**: Authentication token string or null
- **isLoading**: Boolean indicating if auth state is being initialized

**Initialization Logic:**
On mount, checks `localStorage` for existing `authToken` and `authUser`:
```javascript
useEffect(() => {
  const storedToken = localStorage.getItem('authToken');
  const storedUser = localStorage.getItem('authUser');
  
  if (storedToken && storedUser) {
    setToken(storedToken);
    setUser(JSON.parse(storedUser));
  }
  setIsLoading(false);
}, []);
```

### login Function

Authenticates user and stores session data:

```javascript
const login = async (username, password) => {
  try {
    const response = await api.post('/auth/login/', { username, password });
    const { token: authToken, user: userData } = response.data;
    
    setToken(authToken);
    setUser(userData);
    localStorage.setItem('authToken', authToken);
    localStorage.setItem('authUser', JSON.stringify(userData));
    
    return { success: true, data: response.data };
  } catch (error) {
    return { success: false, error: error.response?.data?.message || 'Login failed' };
  }
};
```

**Parameters:**
- `username` (string): User's username
- `password` (string): User's password

**Returns:**
- Promise resolving to object with `success` boolean and either `data` or `error`

**Side Effects:**
- Updates React state (`user`, `token`)
- Persists to `localStorage` (`authToken`, `authUser`)

### logout Function

Clears all authentication data:

```javascript
const logout = () => {
  setToken(null);
  setUser(null);
  localStorage.removeItem('authToken');
  localStorage.removeItem('authUser');
};
```

**Side Effects:**
- Clears React state
- Removes data from `localStorage`

### Helper Properties

**isInstructor:**
```javascript
const isInstructor = user?.is_instructor || false;
```
Returns true if user has instructor role.

**isAuthenticated:**
```javascript
const isAuthenticated = !!token && !!user;
```
Returns true if user is logged in.

### useAuth Custom Hook

Provides easy access to authentication context:

```javascript
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
```

**Returns:**
- `user`: Current user object or null
- `token`: Authentication token or null
- `isLoading`: Loading state boolean
- `login(username, password)`: Login function
- `logout()`: Logout function
- `isInstructor`: Boolean helper
- `isAuthenticated`: Boolean helper

## Usage

### Wrap Application with AuthProvider

In `App.jsx`:
```javascript
import { AuthProvider } from './context/AuthContext';

function App() {
  return (
    <AuthProvider>
      {/* Your routes and components */}
    </AuthProvider>
  );
}
```

### Access Auth State in Components

```javascript
import { useAuth } from '../context/AuthContext';

const MyComponent = () => {
  const { user, token, login, logout, isInstructor, isAuthenticated } = useAuth();
  
  return (
    <div>
      {isAuthenticated ? (
        <p>Welcome, {user.username} {isInstructor && '(Instructor)'}</p>
      ) : (
        <button onClick={() => login('username', 'password')}>Login</button>
      )}
    </div>
  );
};
```

### Implement Login Form

```javascript
const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    const result = await login(username, password);
    
    if (result.success) {
      navigate('/');
    } else {
      setError(result.error);
    }
  };
  
  // ... render form
};
```

### Conditional Rendering Based on Role

```javascript
const AnswerButton = () => {
  const { isInstructor } = useAuth();
  
  return (
    <>
      {isInstructor && (
        <button>Create Answer</button>
      )}
    </>
  );
};
```

## Integration Points

### api.js Integration

Uses the configured axios instance for login requests:
```javascript
import api from '../services/api';

const login = async (username, password) => {
  const response = await api.post('/auth/login/', { username, password });
  // ...
};
```

### Navbar Component

Displays user info and logout button:
```javascript
const { user, isAuthenticated, logout, isInstructor } = useAuth();
```

### Protected Routes

Can be extended to create protected route components:
```javascript
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();
  
  if (isLoading) return <Loading />;
  if (!isAuthenticated) return <Navigate to="/login" />;
  
  return children;
};
```

## Dependencies

- **React**: `createContext`, `useState`, `useContext`, `useEffect`
- **api.js**: Configured axios instance for API calls
- **localStorage**: Browser storage for token persistence

## Expected API Response Format

The login endpoint `/auth/login/` should return:
```json
{
  "token": "abc123...",
  "user": {
    "id": 1,
    "username": "john_doe",
    "email": "john@example.com",
    "is_instructor": true,
    "is_staff": false
  }
}
```

## Change Log

- **Initial Implementation**: Created AuthContext with login/logout functionality, localStorage persistence, and role-based helpers
