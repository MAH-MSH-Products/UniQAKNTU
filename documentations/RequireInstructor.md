# RequireInstructor.jsx Documentation

## Purpose

The `RequireInstructor.jsx` file provides a route protection component that ensures only users with moderator or admin privileges can access protected routes. It wraps around child routes and redirects non-privileged users to the home page while redirecting unauthenticated users to the login page.

## Key Components

### Component Structure

```javascript
const RequireInstructor = () => {
  const { isAuthenticated, canModerate, isLoading } = useAuth();
  
  if (isLoading) {
    return <LoadingSpinner />;
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  if (!canModerate) {
    return <Navigate to="/" replace />;
  }
  
  return <Outlet />;
};
```

**Props:** None - Uses `useAuth` hook internally

**Returns:**
- Loading spinner during auth initialization
- Navigate redirect to `/login` if not authenticated
- Navigate redirect to `/` if authenticated but not moderator/admin
- Outlet component for child routes if user has moderator/admin role

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
- First check in the authorization chain

### Role-Based Access Control Check

```javascript
if (!canModerate) {
  return <Navigate to="/" replace />;
}
```

**Purpose:**
- Redirects authenticated users without moderator/admin role to home page
- Enforces RBAC policy: only MODERATOR and ADMIN roles can access
- Uses `canModerate` boolean from AuthContext (derived from user.role)

### Child Route Rendering

```javascript
return <Outlet />;
```

**Purpose:**
- Renders child routes when user has moderator/admin privileges
- Works with React Router's nested routing
- Allows multiple levels of role-protected routes

## Usage

### Protecting Moderator/Admin Routes in App.jsx

```javascript
import { Routes, Route } from 'react-router-dom';
import RequireInstructor from './components/auth/RequireInstructor';
import AdminPanel from './pages/admin/AdminPanel';
import UserManagement from './pages/admin/UserManagement';

function App() {
  return (
    <Routes>
      {/* Public and general protected routes */}
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      
      {/* Moderator/Admin only routes */}
      <Route element={<RequireInstructor />}>
        <Route path="/admin" element={<AdminPanel />} />
        <Route path="/admin/users" element={<UserManagement />} />
        <Route path="/moderation" element={<ModerationQueue />} />
      </Route>
    </Routes>
  );
}
```

### Nested Role-Protected Routes

```javascript
<Route element={<RequireInstructor />}>
  <Route path="/admin" element={<AdminDashboard />}>
    <Route path="users" element={<UserManagement />} />
    <Route path="content" element={<ContentModeration />} />
    <Route path="settings" element={<SystemSettings />} />
  </Route>
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

Accesses authentication and authorization state from context:

```javascript
const { isAuthenticated, canModerate, isLoading } = useAuth();
```

**Required Values:**
- `isAuthenticated`: Boolean indicating if user has valid session
- `canModerate`: Boolean indicating if user has MODERATOR or ADMIN role
- `isLoading`: Boolean indicating if auth state is being initialized

### Role Hierarchy

| Role | canModerate | Access to RequireInstructor Routes |
|------|-------------|-----------------------------------|
| STUDENT | false | ❌ Denied - redirected to home |
| MODERATOR | true | ✅ Granted |
| ADMIN | true | ✅ Granted |

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
- Changed from checking `isInstructor` boolean to `canModerate` boolean
- Now uses enum-based role system (STUDENT, MODERATOR, ADMIN) instead of boolean flags
- Updated documentation to reflect moderator/admin terminology
- Component logic updated to use `canModerate` from AuthContext

### Initial Implementation (Previous)
- Created role-based route protection wrapper component
- Implemented loading state to prevent premature redirects
- Added authentication check with redirect to login
- Added instructor role check with redirect to home
- Integrated with AuthContext via useAuth hook using `isInstructor` flag
