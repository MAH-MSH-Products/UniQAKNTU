# AuthLayout.jsx Documentation

## Purpose

The `AuthLayout.jsx` file implements a minimal layout wrapper component specifically designed for authentication pages (Login and Register) in the AzmoonHub Nasir application. It provides a clean, focused layout that includes only the Navbar at the top followed by the page content via React Router's Outlet component. This layout intentionally excludes the Sidebar, WidgetsPanel, and Footer to maintain user focus on the authentication flow while ensuring consistent navigation access across all pages.

## Key Components

### AuthLayout Component

```javascript
const AuthLayout = () => {
  return (
    <div className="auth-layout-wrapper">
      <Navbar />
      <main className="auth-main-content">
        <Outlet />
      </main>
    </div>
  );
};
```

A functional React component that renders a minimal layout structure for authentication routes.

**Props:** None (uses React Router Outlet)

**Structure:**
- **auth-layout-wrapper**: Outer container div
- **Navbar**: Navigation bar component (dynamically styled for auth pages)
- **auth-main-content**: Main content area containing the Outlet
- **Outlet**: React Router component that renders the matched child route (Login or Register)

### Excluded Components

Unlike `MainLayout`, AuthLayout intentionally omits:
- **Sidebar**: Course/exam navigation not needed during authentication
- **WidgetsPanel**: Dynamic widgets panel for recent/popular content
- **Footer**: Multi-column footer with links and social media

This minimal approach ensures:
1. Reduced visual distractions during login/registration
2. Full-screen gradient background visibility
3. Streamlined authentication user experience

## Usage

### Import in App.jsx Routing

```javascript
import AuthLayout from './components/layout/AuthLayout';

// In App component Routes:
<Route element={<AuthLayout />}>
  <Route path="/login" element={<Login />} />
  <Route path="/register" element={<Register />} />
</Route>
```

### Integration with React Router

AuthLayout uses React Router's `Outlet` component to render child routes:

```javascript
import { Outlet } from 'react-router-dom';

// The Outlet renders the matched child route component
<Outlet /> // Renders <Login /> or <Register /> based on current path
```

## Integration Points

### Navbar Integration

```javascript
import Navbar from './Navbar';

// Navbar is rendered at the top of the layout
<Navbar />
```

**Special Behavior:**
- When rendered within AuthLayout, the Navbar detects it's on an auth page (`/login` or `/register`) via `useLocation()` hook
- Applies glassmorphism styling (semi-transparent background with blur effect) to blend with auth page gradients
- Uses `position: absolute` to float over the gradient background without affecting layout flow

### React Router Integration

Uses React Router v6's layout route pattern:

```javascript
import { Outlet } from 'react-router-dom';

// Parent route with element
<Route element={<AuthLayout />}>
  // Child routes rendered via Outlet
  <Route path="/login" element={<Login />} />
  <Route path="/register" element={<Register />} />
</Route>
```

### Authentication Pages

Renders the following pages within the layout:
- **Login.jsx**: User login form with modern gradient design
- **Register.jsx**: User registration form with modern gradient design

Both pages use the `.auth-container` CSS class which accounts for the absolute-positioned navbar.

## Styling

### CSS Classes Used

- **auth-layout-wrapper**: Outer container (can be extended for future styling needs)
- **auth-main-content**: Main content area wrapping the Outlet

### Layout Structure

```html
<div class="auth-layout-wrapper">
  <nav class="navbar ...">...</nav>
  <main class="auth-main-content">
    <div class="auth-container">
      <!-- Login or Register page content -->
    </div>
  </main>
</div>
```

### Responsive Behavior

- **Desktop**: Navbar spans full width at top, auth form centered below
- **Mobile**: Navbar collapses into toggle menu, auth form maintains centered layout

## Expected Structure in DOM

```html
<div class="auth-layout-wrapper">
  <nav class="navbar navbar-expand-lg position-absolute top-0" 
       style="background: rgba(10, 37, 64, 0.4); backdrop-filter: blur(10px);">
    <!-- Navbar content -->
  </nav>
  <main class="auth-main-content">
    <div class="auth-container" style="padding-top: 6rem;">
      <div class="auth-box" style="margin-top: 2rem;">
        <!-- Login or Register form -->
      </div>
    </div>
  </main>
</div>
```

## Dependencies

- **React**: Functional component
- **react-router-dom**: `Outlet` component for rendering child routes
- **Navbar component**: Imported from `./Navbar`

## Relationship with Other Layouts

### AuthLayout vs MainLayout

| Feature | AuthLayout | MainLayout |
|---------|-----------|------------|
| **Navbar** | ✅ Included (glassmorphism style) | ✅ Included (solid primary color) |
| **Sidebar** | ❌ Excluded | ✅ Included |
| **WidgetsPanel** | ❌ Excluded | ✅ Included |
| **Footer** | ❌ Excluded | ✅ Included |
| **Routes** | `/login`, `/register` | `/`, `/courses`, `/support`, etc. |
| **Background** | Full-screen gradient | Light gray (`#F4F5F7`) |
| **Purpose** | Authentication flow | Main application interface |

## Change Log

- **Phase 11 - Initial Implementation**: 
  - Created AuthLayout component as minimal wrapper for auth pages
  - Integrated Navbar with glassmorphism styling support
  - Implemented Outlet-based routing pattern
  - Excluded Sidebar, WidgetsPanel, and Footer for focused UX
  - Updated App.jsx to wrap `/login` and `/register` routes with AuthLayout
  - Added CSS adjustments to `.auth-container` and `.auth-box` to prevent navbar overlap
