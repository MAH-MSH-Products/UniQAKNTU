# RequireInstructor.jsx Documentation

## Purpose

The `RequireInstructor.jsx` file provides a route protection wrapper component that ensures only authenticated users with instructor privileges can access instructor-specific routes. It extends the basic authentication check by also verifying the user's role status, redirecting non-instructors to the home page while maintaining proper loading state handling.

## Key Components

### RequireInstructor Component

```javascript
const RequireInstructor = () => {
  const { isAuthenticated, isInstructor, isLoading } = useAuth();

  // Show loading state while auth context is initializing
  if (isLoading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '100vh' }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Redirect to home if authenticated but not an instructor
  if (!isInstructor) {
    return <Navigate to="/" replace />;
  }

  // Render child routes if user is a verified instructor
  return <Outlet />;
};
```

**State Management:**
- **isLoading**: Boolean from AuthContext indicating if authentication state is being initialized
- **isAuthenticated**: Boolean from AuthContext indicating if user is logged in
- **isInstructor**: Boolean from AuthContext indicating if user has instructor role

**Rendering Logic:**
1. **Loading State**: Displays a centered Bootstrap spinner while `isLoading` is true
2. **Unauthenticated**: Redirects to `/login` using `<Navigate replace />`
3. **Not Instructor**: Redirects to `/` (home page) using `<Navigate replace />`
4. **Verified Instructor**: Renders child routes via `<Outlet />`

### Loading Indicator

The loading state prevents premature redirects when:
- User refreshes the page on an instructor route
- AuthContext is initializing from localStorage
- Authentication token and role status are being validated

```javascript
<div className="d-flex justify-content-center align-items-center" style={{ minHeight: '100vh' }}>
  <div className="spinner-border text-primary" role="status">
    <span className="visually-hidden">Loading...</span>
  </div>
</div>
```

## Usage

### Protecting Instructor Routes in App.jsx

Wrap instructor-specific routes with `<RequireInstructor />`:

```javascript
import RequireInstructor from './components/auth/RequireInstructor';

<Routes>
  {/* Public Routes */}
  <Route path="/" element={<Home />} />
  <Route path="/courses" element={<Courses />} />
  
  {/* Instructor Routes - Require Instructor Role */}
  <Route element={<RequireInstructor />}>
    <Route path="/instructor/dashboard" element={<InstructorDashboard />} />
    <Route path="/instructor/answers" element={<ManageAnswers />} />
  </Route>
  
  {/* Auth Routes */}
  <Route path="/login" element={<Login />} />
  <Route path="/register" element={<Register />} />
</Routes>
```

### Combining with Layout Components

Can be nested with layout components for consistent UI:

```javascript
<Route element={<RequireInstructor />}>
  <Route element={<MainLayout />}>
    <Route path="/instructor/dashboard" element={<InstructorDashboard />} />
    <Route path="/instructor/answers" element={<ManageAnswers />} />
  </Route>
</Route>
```

### Stacking with RequireAuth

For routes requiring both authentication and instructor role:

```javascript
<Route element={<RequireAuth />}>
  <Route element={<RequireInstructor />}>
    <Route path="/instructor/dashboard" element={<InstructorDashboard />} />
  </Route>
</Route>
```

Note: In practice, RequireInstructor already checks authentication, so stacking is optional.

## Integration Points

### AuthContext Integration

Consumes authentication and role state via custom hook:

```javascript
import { useAuth } from '../../context/AuthContext';

const RequireInstructor = () => {
  const { isAuthenticated, isInstructor, isLoading } = useAuth();
  // ...
};
```

### React Router DOM Integration

Uses router components for navigation and rendering:

```javascript
import { Navigate, Outlet } from 'react-router-dom';

// Navigate for redirection to different targets
<Navigate to="/login" replace />  // Unauthenticated users
<Navigate to="/" replace />       // Non-instructor users

// Outlet for rendering child routes
return <Outlet />;
```

### MainLayout Integration

Protected instructor routes are wrapped within MainLayout to maintain consistent navigation:

```javascript
<Route element={<RequireInstructor />}>
  <Route element={<MainLayout />}>
    <Route path="/instructor/dashboard" element={<InstructorDashboard />} />
  </Route>
</Route>
```

## Dependencies

- **React**: Core component library
- **react-router-dom**: `<Navigate>`, `<Outlet />` components
- **AuthContext**: `useAuth` hook providing `isAuthenticated`, `isInstructor`, and `isLoading`

## Security Considerations

### Client-Side Protection Only

This component provides **client-side route protection only**. All sensitive operations must be verified server-side:

- API endpoints must validate authentication tokens
- Backend must enforce RBAC permissions for instructor actions
- Never trust client-side role checks for sensitive operations (creating/editing answers, bulk uploads)

### Role Verification Flow

The component implements a strict verification order:
1. Check loading state first (prevents race conditions)
2. Verify authentication (unauthenticated → login)
3. Verify instructor role (non-instructor → home)
4. Allow access (verified instructor → render)

## Expected Behavior

| Scenario | Behavior |
|----------|----------|
| User is authenticated instructor | Child routes render normally |
| User is authenticated but not instructor | Redirects to `/` (home) |
| User is not authenticated | Redirects to `/login` |
| Auth context is loading | Shows spinner, waits for initialization |
| Page refresh on instructor route | Waits for localStorage check, then decides |

## Protected Routes

The following routes should be protected with RequireInstructor:

| Route | Component | Purpose |
|-------|-----------|---------|
| `/instructor/dashboard` | InstructorDashboard | View instructor analytics and stats |
| `/instructor/answers` | ManageAnswers | Create, edit, and manage exam answers |

## Change Log

- **Phase 12 Implementation**: Created RequireInstructor component with loading state handling, authentication checks, and role-based access control
