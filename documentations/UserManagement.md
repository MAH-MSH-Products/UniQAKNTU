# UserManagement Documentation

## Purpose
The `UserManagement` component provides an administrative interface for users with ADMIN role to view all registered users and manage their roles. It allows administrators to promote or demote users between STUDENT, MODERATOR, and ADMIN roles.

## Key Components

### State Management
- **users**: Array of user objects retrieved from the backend
- **loading**: Boolean indicating data fetch status
- **error**: Error message string if data fetch fails
- **searchTerm**: Current search query for filtering users by username/email
- **roleFilter**: Current role filter selection (STUDENT, MODERATOR, ADMIN, or empty)

### Data Fetching Functions
- **fetchUsers()**: Calls `GET /api/users/` with optional query parameters for search and role filtering

### Action Handlers
- **handleRoleChange(userId, newRole)**: Sends PATCH request to update user role
  - Endpoint: `PATCH /api/users/{id}/role/`
  - Payload: `{ "role": "NEW_ROLE" }`

### Helper Functions
- **getRoleBadgeColor(role)**: Returns Bootstrap badge color class based on role
  - ADMIN: `bg-danger` (red)
  - MODERATOR: `bg-primary` (blue)
  - STUDENT: `bg-secondary` (gray)

## Usage

### Import
```jsx
import UserManagement from './pages/admin/UserManagement';
```

### Route Configuration
```jsx
<Route element={<RequireAdmin />}>
  <Route element={<MainLayout />}>
    <Route path="/admin/users" element={<UserManagement />} />
  </Route>
</Route>
```

### Access Control
- Only accessible to users with `isAdmin` flag (ADMIN role only)
- Users without proper permissions see an access denied message
- MODERATORs cannot access this page (ADMIN-only feature)
- Component automatically refreshes data after role changes

## Integration

### API Endpoints Used
| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/users/` | GET | List all users with optional filters |
| `/api/users/{id}/role/` | PATCH | Update user role |

### Query Parameters for User List
| Parameter | Type | Description |
|-----------|------|-------------|
| `role` | string | Filter by role (STUDENT, MODERATOR, ADMIN) |
| `search` | string | Search by username or email |
| `page` | integer | Pagination page number |

### Context Dependencies
- **useAuth**: Provides `user`, `isAdmin` for role-based access control
- **useTranslation**: Provides i18n translation function `t()`

### Response Format Expected
```json
// GET /api/users/
{
  "count": 25,
  "next": "http://.../api/users/?page=2",
  "previous": null,
  "results": [
    {
      "id": "uuid-string",
      "username": "ali_k",
      "email": "ali@kntu.ac.ir",
      "first_name": "Ali",
      "last_name": "Karimi",
      "role": "STUDENT",
      "date_joined": "2024-01-15T08:00:00Z"
    }
  ]
}

// PATCH /api/users/{id}/role/
{
  "id": "uuid-string",
  "username": "ali_k",
  "email": "ali@kntu.ac.ir",
  "first_name": "Ali",
  "last_name": "Karimi",
  "role": "MODERATOR",
  "date_joined": "2024-01-15T08:00:00Z"
}
```

## UI Features

### Filters
- **Search Input**: Text field to search users by username or email
- **Role Dropdown**: Filter users by specific role (All, STUDENT, MODERATOR, ADMIN)
- **Search Button**: Triggers search with current term and filter

### User Table Columns
1. **Username**: User's login name
2. **Email**: User's email address
3. **Full Name**: First and last name (or '-' if not provided)
4. **Current Role**: Badge showing user's current role with color coding
5. **Date Joined**: Persian calendar formatted join date
6. **Actions**: Role change dropdown (disabled for ADMIN users)

### Role Change Restrictions
- ADMIN users cannot have their role changed (dropdown disabled)
- Only ADMIN users can promote others to ADMIN role
- Role changes trigger immediate list refresh

## Change Log
- **Phase 9**: Initial implementation of UserManagement component
  - Created user grid/table with filtering capabilities
  - Implemented role promotion/demotion functionality
  - Added role-based access control using `isAdmin` flag
  - Integrated with backend user management endpoints
  - Replaced old mock "Role Request" flow with admin-managed system
