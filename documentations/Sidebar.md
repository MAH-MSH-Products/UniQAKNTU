# Sidebar.jsx Documentation

## Purpose

The `Sidebar.jsx` file implements a navigation sidebar component for the UniQAKNTU application. It provides organized navigation links for courses, support tickets, reports, and instructor-specific tools. The component uses placeholder links that will be connected to actual pages in future development phases.

## Key Components

### Sidebar Component

```javascript
const Sidebar = () => {
  return (
    <div className="sidebar bg-light border-end" style={{ minHeight: 'calc(100vh - 56px)' }}>
      {/* Navigation content */}
    </div>
  );
};
```

A functional React component that renders a vertical navigation sidebar with categorized links.

**Props:** None

**Styling:**
- Fixed height calculation: `calc(100vh - 56px)` (accounts for navbar height)
- Light background with right border
- Full-height layout matching viewport

### Navigation Section

```jsx
<h6 className="sidebar-heading text-uppercase text-muted small fw-bold mb-3">
  Navigation
</h6>
<ul className="nav flex-column">
  <li className="nav-item">
    <Link className="nav-link text-dark" to="/courses">
      📚 All Courses
    </Link>
  </li>
  <li className="nav-item">
    <Link className="nav-link text-dark" to="/tickets">
      🎫 My Tickets
    </Link>
  </li>
  <li className="nav-item">
    <Link className="nav-link text-dark" to="/reports">
      ⚠️ Reports
    </Link>
  </li>
</ul>
```

**Navigation Links:**
- **All Courses** (`/courses`): Browse available courses and exams
- **My Tickets** (`/tickets`): View and manage support tickets
- **Reports** (`/reports`): Access content reports

Each link includes an emoji icon for visual identification.

### Instructor Tools Section

```jsx
<h6 className="sidebar-heading text-uppercase text-muted small fw-bold mb-3 mt-4">
  Instructor Tools
</h6>
<ul className="nav flex-column">
  <li className="nav-item">
    <Link className="nav-link text-dark" to="/instructor/dashboard">
      📊 Dashboard
    </Link>
  </li>
  <li className="nav-item">
    <Link className="nav-link text-dark" to="/instructor/answers">
      ✏️ Manage Answers
    </Link>
  </li>
</ul>
```

**Instructor-Only Links:**
- **Dashboard** (`/instructor/dashboard`): Instructor analytics and overview
- **Manage Answers** (`/instructor/answers`): Create and edit exam answers

**Note:** Currently displays to all users. Future implementation should conditionally render this section based on `user.is_instructor` from AuthContext.

## Usage

### Import in MainLayout

```javascript
import Sidebar from './Sidebar';

const MainLayout = () => {
  return (
    <div className="d-flex">
      <Sidebar />
      <main><Outlet /></main>
    </div>
  );
};
```

### Responsive Display

Sidebar is hidden on mobile devices via MainLayout CSS classes:
```jsx
<div className="d-none d-md-block" style={{ width: '250px' }}>
  <Sidebar />
</div>
```

## Integration Points

### react-router-dom Integration

Uses `Link` component for client-side routing:
```javascript
import { Link } from 'react-router-dom';

<Link className="nav-link text-dark" to="/courses">
  📚 All Courses
</Link>
```

### MainLayout Integration

Embedded as the left sidebar in the application shell:
```javascript
import Navbar from './Navbar';
import Sidebar from './Sidebar';

const MainLayout = () => (
  <div className="d-flex flex-column">
    <Navbar />
    <div className="d-flex flex-grow-1">
      <div className="d-none d-md-block">
        <Sidebar />
      </div>
      <main className="flex-grow-1">
        <Outlet />
      </main>
    </div>
  </div>
);
```

### Future AuthContext Integration

For role-based link visibility:
```javascript
import { useAuth } from '../../context/AuthContext';

const Sidebar = () => {
  const { isInstructor } = useAuth();
  
  return (
    <>
      {/* Common links */}
      
      {isInstructor && (
        {/* Instructor-only links */}
      )}
    </>
  );
};
```

## Styling

### Bootstrap Classes Used

- **sidebar**: Custom sidebar container class
- **bg-light**: Light gray background
- **border-end**: Right border separator
- **sidebar-heading**: Section header styling
- **text-uppercase**: Uppercase text transformation
- **text-muted**: Muted text color
- **small**: Smaller font size
- **fw-bold**: Bold font weight
- **mb-3**: Margin bottom (1rem)
- **mt-4**: Margin top (1.5rem)
- **nav**: Navigation container
- **flex-column**: Vertical flex layout
- **nav-item**: Navigation list item
- **nav-link**: Navigation link styling
- **text-dark**: Dark text color

### Custom Inline Styles

```javascript
style={{ minHeight: 'calc(100vh - 56px)' }}
```

Ensures sidebar extends full viewport height minus navbar (56px is standard Bootstrap navbar height).

## Expected Structure in DOM

```html
<div class="sidebar bg-light border-end" style="min-height: calc(100vh - 56px);">
  <div class="p-3">
    <h6 class="sidebar-heading text-uppercase text-muted small fw-bold mb-3">
      Navigation
    </h6>
    <ul class="nav flex-column">
      <li class="nav-item">
        <a class="nav-link text-dark" href="/courses">📚 All Courses</a>
      </li>
      <!-- More links -->
    </ul>
    
    <h6 class="sidebar-heading text-uppercase text-muted small fw-bold mb-3 mt-4">
      Instructor Tools
    </h6>
    <ul class="nav flex-column">
      <li class="nav-item">
        <a class="nav-link text-dark" href="/instructor/dashboard">📊 Dashboard</a>
      </li>
      <!-- More instructor links -->
    </ul>
  </div>
</div>
```

## Dependencies

- **React**: Functional component
- **react-router-dom**: `Link` component for navigation

## Future Enhancements

1. **Role-Based Visibility**: Conditionally render "Instructor Tools" section using `useAuth()` hook
2. **Active State Highlighting**: Add visual indicator for current route
3. **Collapsible on Mobile**: Implement toggle functionality for mobile viewports
4. **Dynamic Course List**: Fetch and display user's enrolled courses dynamically
5. **Notification Badges**: Show unread ticket/report counts

## Change Log

- **Initial Implementation**: Created sidebar with placeholder navigation links for courses, tickets, reports, and instructor tools
