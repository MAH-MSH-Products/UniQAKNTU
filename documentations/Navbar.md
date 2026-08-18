# Navbar.jsx Documentation

## Purpose

The `Navbar.jsx` file implements a responsive navigation bar component for the UniQAKNTU application. It displays branding, user authentication status, role indicators, and provides navigation controls based on the user's authentication state.

## Key Components

### Navbar Component

```javascript
const Navbar = () => {
  const { user, isAuthenticated, logout, isInstructor } = useAuth();
  const navigate = useNavigate();
  // ...
};
```

A functional React component that renders a Bootstrap-styled navigation bar with dynamic content based on authentication state.

**Props:** None (uses AuthContext via hook)

**State Management:**
- Uses `useAuth()` hook to access:
  - `user`: Current user object
  - `isAuthenticated`: Boolean indicating login status
  - `logout`: Logout function
  - `isInstructor`: Boolean indicating instructor role

### Branding Section

```jsx
<Link className="navbar-brand" to="/">
  UniQAKNTU
</Link>
```

Displays the application logo/brand that links to the home page.

### Mobile Toggle Button

```jsx
<button
  className="navbar-toggler"
  type="button"
  data-bs-toggle="collapse"
  data-bs-target="#navbarNav"
  aria-controls="navbarNav"
  aria-expanded="false"
  aria-label="Toggle navigation"
>
  <span className="navbar-toggler-icon"></span>
</button>
```

Provides responsive collapse functionality for mobile devices using Bootstrap's navbar toggle mechanism.

### Authenticated User Display

```jsx
{isAuthenticated ? (
  <>
    <li className="nav-item me-3">
      <span className="navbar-text text-white">
        Welcome, {user?.username}
        {isInstructor && (
          <span className="badge bg-warning text-dark ms-2">
            Instructor
          </span>
        )}
      </span>
    </li>
    <li className="nav-item">
      <button
        className="btn btn-outline-light btn-sm"
        onClick={handleLogout}
      >
        Logout
      </button>
    </li>
  </>
) : (
  <li className="nav-item">
    <Link className="btn btn-outline-light btn-sm" to="/login">
      Login
    </Link>
  </li>
)}
```

**Conditional Rendering Logic:**

**When Authenticated:**
- Displays welcome message with username
- Shows "Instructor" badge if `user.is_instructor` is true
- Provides logout button that triggers `handleLogout()`

**When Not Authenticated:**
- Displays login button linking to `/login` route

### handleLogout Function

```javascript
const handleLogout = () => {
  logout();
  navigate('/login');
};
```

**Functionality:**
1. Calls `logout()` from AuthContext to clear auth state
2. Navigates user to `/login` route using react-router-dom

## Usage

### Import in MainLayout

```javascript
import Navbar from './Navbar';

const MainLayout = () => {
  return (
    <div>
      <Navbar />
      {/* Other layout components */}
    </div>
  );
};
```

### Bootstrap CSS Requirement

Ensure Bootstrap CSS is imported (handled in component):
```javascript
import 'bootstrap/dist/css/bootstrap.min.css';
```

## Integration Points

### AuthContext Integration

Uses `useAuth()` hook to access authentication state:
```javascript
import { useAuth } from '../../context/AuthContext';

const { user, isAuthenticated, logout, isInstructor } = useAuth();
```

### MainLayout Integration

Used as the top navigation component in the application shell:
```javascript
import Navbar from './Navbar';
import Sidebar from './Sidebar';

const MainLayout = () => (
  <div>
    <Navbar />
    <div className="d-flex">
      <Sidebar />
      <main><Outlet /></main>
    </div>
  </div>
);
```

### react-router-dom Integration

Uses routing hooks for navigation:
```javascript
import { Link, useNavigate } from 'react-router-dom';

const navigate = useNavigate();
// Navigation after logout
navigate('/login');
```

## Styling

### Bootstrap Classes Used

- **navbar**: Base navbar container
- **navbar-expand-lg**: Responsive expansion at lg breakpoint
- **navbar-dark**: Dark theme for navbar
- **bg-primary**: Primary color background (blue)
- **container-fluid**: Full-width container
- **navbar-brand**: Brand/logo styling
- **navbar-toggler**: Mobile toggle button
- **navbar-nav**: Navigation list
- **nav-item**: Individual nav items
- **navbar-text**: Text content in navbar
- **badge**: Role indicator badge
- **bg-warning**: Warning color for instructor badge
- **btn-outline-light**: Outline button style
- **ms-auto**: Margin start (auto) for right alignment
- **align-items-center**: Vertical center alignment

### Responsive Behavior

- **Desktop (≥992px)**: Full navbar displayed horizontally
- **Mobile (<992px)**: Collapsible menu with toggle button

## Expected Structure in DOM

```html
<nav class="navbar navbar-expand-lg navbar-dark bg-primary">
  <div class="container-fluid">
    <a class="navbar-brand" href="/">UniQAKNTU</a>
    <button class="navbar-toggler" ...>
      <span class="navbar-toggler-icon"></span>
    </button>
    <div class="collapse navbar-collapse" id="navbarNav">
      <ul class="navbar-nav ms-auto align-items-center">
        <!-- Authenticated or Login content -->
      </ul>
    </div>
  </div>
</nav>
```

## Dependencies

- **React**: Functional component
- **react-router-dom**: `Link`, `useNavigate` for routing
- **AuthContext**: `useAuth` hook for authentication state
- **Bootstrap**: CSS framework for styling (`bootstrap/dist/css/bootstrap.min.css`)

## Change Log

- **Initial Implementation**: Created responsive navbar with authentication-based conditional rendering, instructor badge display, and logout functionality
