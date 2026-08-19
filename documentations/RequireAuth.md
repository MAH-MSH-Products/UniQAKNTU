# RequireAuth.jsx Documentation

## Purpose

The `RequireAuth.jsx` file provides a route protection wrapper component that ensures only authenticated users can access protected routes. It consumes the `AuthContext` to check authentication state and redirects unauthenticated users to the login page. The component properly handles the loading state to prevent premature redirects during authentication context initialization.

## Key Components

### RequireAuth Component

```javascript
const RequireAuth = () => {
  const { isAuthenticated, isLoading } = useAuth();

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

  // Render child routes if authenticated
  return <Outlet />;
};
```

**State Management:**
- **isLoading**: Boolean from AuthContext indicating if authentication state is being initialized
- **isAuthenticated**: Boolean from AuthContext indicating if user is logged in

**Rendering Logic:**
1. **Loading State**: Displays a centered Bootstrap spinner while `isLoading` is true
2. **Unauthenticated**: Redirects to `/login` using `<Navigate replace />`
3. **Authenticated**: Renders child routes via `<Outlet />`

### Loading Indicator

The loading state prevents premature redirects when:
- User refreshes the page on a protected route
- AuthContext is initializing from localStorage
- Authentication token is being validated

```javascript
<div className="d-flex justify-content-center align-items-center" style={{ minHeight: '100vh' }}>
  <div className="spinner-border text-primary" role="status">
    <span className="visually-hidden">Loading...</span>
  </div>
</div>
```

## Usage

### Protecting Routes in App.jsx

Wrap protected routes with `<RequireAuth />`:

```javascript
import RequireAuth from './components/auth/RequireAuth';

<Routes>
  {/* Public Routes */}
  <Route path="/" element={<Home />} />
  <Route path="/courses" element={<Courses />} />
  
  {/* Protected Routes - Require Authentication */}
  <Route element={<RequireAuth />}>
    <Route path="/support" element={<SupportCenter />} />
    <Route path="/tickets" element={<MyTickets />} />
    <Route path="/reports" element={<Reports />} />
    <Route path="/admin/support" element={<AdminSupportPanel />} />
  </Route>
  
  {/* Auth Routes */}
  <Route path="/login" element={<Login />} />
  <Route path="/register" element={<Register />} />
</Routes>
```

### Combining with Layout Components

Can be nested with layout components for consistent UI:

```javascript
<Route element={<RequireAuth />}>
  <Route element={<MainLayout />}>
    <Route path="/support" element={<SupportCenter />} />
    <Route path="/tickets" element={<MyTickets />} />
  </Route>
</Route>
```

## Integration Points

### AuthContext Integration

Consumes authentication state via custom hook:

```javascript
import { useAuth } from '../../context/AuthContext';

const RequireAuth = () => {
  const { isAuthenticated, isLoading } = useAuth();
  // ...
};
```

### React Router DOM Integration

Uses router components for navigation and rendering:

```javascript
import { Navigate, Outlet } from 'react-router-dom';

// Navigate for redirection
<Navigate to="/login" replace />

// Outlet for rendering child routes
return <Outlet />;
```

### MainLayout Integration

Protected routes are wrapped within MainLayout to maintain consistent navigation:

```javascript
<Route element={<RequireAuth />}>
  <Route element={<MainLayout />}>
    <Route path="/support" element={<SupportCenter />} />
  </Route>
</Route>
```

## Dependencies

- **React**: Core component library
- **react-router-dom**: `<Navigate>`, `<Outlet />` components
- **AuthContext**: `useAuth` hook providing `isAuthenticated` and `isLoading`

## Security Considerations

### Client-Side Protection Only

This component provides **client-side route protection only**. All sensitive operations must be verified server-side:

- API endpoints must validate authentication tokens
- Backend must enforce RBAC permissions
- Never trust client-side checks for sensitive operations

### Loading State Handling

Properly handling `isLoading` prevents:
- Premature redirects on page refresh
- Flash of unauthenticated content
- Poor user experience during auth initialization

## Expected Behavior

| Scenario | Behavior |
|----------|----------|
| User is authenticated | Child routes render normally |
| User is not authenticated | Redirects to `/login` |
| Auth context is loading | Shows spinner, waits for initialization |
| Page refresh on protected route | Waits for localStorage check, then decides |

## Change Log

- **Phase 12 Implementation**: Created RequireAuth component with loading state handling and authentication checks
