# RequireAdmin Documentation

## Purpose
The `RequireAdmin` component is a route protection wrapper that ensures only users with ADMIN role can access specific routes. It provides an additional layer of security beyond the general moderator/admin check, specifically for admin-only features like user management.

## Key Components

### Props
This component does not accept any props. It uses the `Outlet` pattern from react-router-dom to render child routes when access is granted.

### State Management
The component relies on the `useAuth` context hook to access:
- **isAuthenticated**: Boolean indicating if user is logged in
- **isAdmin**: Boolean indicating if user has ADMIN role
- **isLoading**: Boolean indicating if auth context is still initializing

## Usage

### Import
```jsx
import RequireAdmin from './components/auth/RequireAdmin';
```

### Route Configuration
```jsx
<Route element={<RequireAdmin />}>
  <Route element={<MainLayout />}>
    <Route path="/admin/users" element={<UserManagement />} />
  </Route>
</Route>
```

### Access Control Logic
1. **Loading State**: While the auth context is initializing, displays a loading spinner to prevent premature redirects
2. **Unauthenticated Users**: Redirects to `/login` page
3. **Non-Admin Authenticated Users**: Redirects to `/` (home page)
4. **Admin Users**: Renders the child routes via `<Outlet />`

## Integration

### Context Dependencies
- **useAuth**: Provides authentication state and role checks
  - `isAuthenticated`: From access token presence
  - `isAdmin`: Checks if `user.role === 'ADMIN'`
  - `isLoading`: From auth context initialization state

### React Router Dependencies
- **Navigate**: For programmatic redirects
- **Outlet**: For rendering child routes when access is granted

## Behavior Flow

```
User requests /admin/users
         |
         v
   [isLoading?] --yes--> Show loading spinner
         |
        no
         v
[isAuthenticated?] --no--> Navigate to /login
         |
        yes
         v
    [isAdmin?] --no--> Navigate to /
         |
        yes
         v
   Render <Outlet /> (child routes)
```

## Comparison with RequireInstructor

| Feature | RequireInstructor | RequireAdmin |
|---------|------------------|--------------|
| Role Check | `canModerate` (MODERATOR or ADMIN) | `isAdmin` (ADMIN only) |
| Use Case | Moderation tools, content approval | User management, system administration |
| Access Level | Moderate | Full administrative |

## Change Log
- **Phase 9**: Initial implementation of RequireAdmin component
  - Created dedicated admin-only route wrapper
  - Implemented loading state handling
  - Added proper redirect logic for unauthorized access
  - Separated from RequireInstructor to enforce stricter ADMIN-only access
