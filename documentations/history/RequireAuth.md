# RequireAuth.jsx Documentation

## Purpose

The `RequireAuth.jsx` file provides a route protection component that ensures only authenticated users can access protected routes. It wraps around child routes and redirects unauthenticated users to the login page while displaying a loading state during authentication initialization.

## Key Components

### Component Structure

```javascript
const RequireAuth = () => {
  const { isAuthenticated, isLoading } = useAuth();
  
  if (isLoading) {
    return <LoadingSpinner />;
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  return <Outlet />;
};
```

**Props:** None - Uses `useAuth` hook internally

**Returns:**
- Loading spinner during auth initialization
- Navigate redirect to `/login` if not authenticated
- Outlet component for child routes if authenticated

### Loading State Handling

```javascript
if (isLoading) {
  return (
    <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '100vh' }}>
      <div className="spinner-border text-primary" role="status">
        <span className="visually-hidden">Loading...</span>
      </div>
    </div>
  );
}
```

**Purpose:**
- Prevents premature redirects during auth context initialization
- Shows Bootstrap spinner centered on viewport
- Ensures smooth user experience on page reloads

### Authentication Check

```javascript
if (!isAuthenticated) {
  return <Navigate to="/login" replace />;
}
```

**Purpose:**
- Redirects unauthenticated users to login page
- Uses `replace` to prevent back button navigation to protected route
- Preserves intended destination in app state (if implemented)

### Child Route Rendering

```javascript
return <Outlet />;
```

**Purpose:**
- Renders child routes when user is authenticated
- Works with React Router's nested routing
- Allows multiple levels of route protection

## Usage

### Protecting Routes in App.jsx

```javascript
import { Routes, Route } from 'react-router-dom';
import RequireAuth from './components/auth/RequireAuth';
import Home from './pages/Home';
import Dashboard from './pages/Dashboard';

function App() {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      
      {/* Protected routes */}
      <Route element={<RequireAuth />}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/profile" element={<Profile />} />
      </Route>
    </Routes>
  );
}
```

### Nested Protected Routes

```javascript
<Route element={<RequireAuth />}>
  <Route path="/questions" element={<QuestionExplorer />} />
  <Route path="/questions/:id" element={<QuestionDetail />} />
  <Route path="/tickets" element={<MyTickets />} />
</Route>
```

## Integration Points

### AuthContext Dependency

Requires `AuthProvider` to be present in the component tree:

```javascript
// In main.jsx
import { AuthProvider } from './context/AuthContext';

ReactDOM.createRoot(document.getElementById('root')).render(
  <AuthProvider>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </AuthProvider>
);
```

### useAuth Hook

Accesses authentication state from context:

```javascript
const { isAuthenticated, isLoading } = useAuth();
```

**Required Values:**
- `isAuthenticated`: Boolean indicating if user has valid session
- `isLoading`: Boolean indicating if auth state is being initialized

### React Router Dependencies

- **Navigate**: For programmatic redirects
- **Outlet**: For rendering child routes in nested routing

## Styling

### Loading Spinner

Uses Bootstrap 5 classes:
- `d-flex`: Flexbox container
- `justify-content-center`: Horizontal centering
- `align-items-center`: Vertical centering
- `spinner-border`: Bootstrap spinner animation
- `text-primary`: Primary color theme
- `visually-hidden`: Accessibility text

### Custom Styles

```javascript
style={{ minHeight: '100vh' }}
```

Ensures loading state covers full viewport height.

## Change Log

### Phase 1 - JWT Migration (Current)
- No changes required - component structure remains the same
- Now relies on updated `isAuthenticated` logic from AuthContext (JWT-based)

### Initial Implementation
- Created route protection wrapper component
- Implemented loading state to prevent premature redirects
- Added authentication check with redirect to login
- Integrated with AuthContext via useAuth hook
