# Sidebar.jsx Documentation

## Purpose

The `Sidebar.jsx` file implements a navigation sidebar component for the UniQAKNTU application. It provides organized navigation links for courses, support tickets, reports, and instructor-specific tools. The component uses i18n translations for all text content and supports both English (LTR) and Persian (RTL) languages.

## Key Components

### Sidebar Component

```javascript
const Sidebar = () => {
  const { t } = useTranslation();
  return (
    <div className="sidebar bg-light border-end" style={{ minHeight: 'calc(100vh - 56px)' }}>
      {/* Navigation content */}
    </div>
  );
};
```

A functional React component that renders a vertical navigation sidebar with categorized links using translated text.

**Props:** None

**State Management:**
- Uses `useTranslation()` hook from react-i18next for translations

**Styling:**
- Fixed height calculation: `calc(100vh - 56px)` (accounts for navbar height)
- Light background with right border
- Full-height layout matching viewport

### Navigation Section

```jsx
<h6 className="sidebar-heading text-uppercase text-muted small fw-bold mb-3">
  {t('sidebar.navigation')}
</h6>
<ul className="nav flex-column">
  <li className="nav-item">
    <Link className="nav-link text-dark" to="/courses">
      {t('sidebar.all_courses')}
    </Link>
  </li>
  <li className="nav-item">
    <Link className="nav-link text-dark" to="/tickets">
      {t('sidebar.my_tickets')}
    </Link>
  </li>
  <li className="nav-item">
    <Link className="nav-link text-dark" to="/reports">
      {t('sidebar.reports')}
    </Link>
  </li>
</ul>
```

**Navigation Links:**
- **All Courses** (`/courses`): Browse available courses and exams (translated via `sidebar.all_courses`)
- **My Tickets** (`/tickets`): View and manage support tickets (translated via `sidebar.my_tickets`)
- **Reports** (`/reports`): Access content reports (translated via `sidebar.reports`)

Each link includes an emoji icon for visual identification. The emoji icons are part of the translation strings.

### Instructor Tools Section

```jsx
<h6 className="sidebar-heading text-uppercase text-muted small fw-bold mb-3 mt-4">
  {t('sidebar.instructor_tools')}
</h6>
<ul className="nav flex-column">
  <li className="nav-item">
    <Link className="nav-link text-dark" to="/instructor/dashboard">
      {t('sidebar.dashboard')}
    </Link>
  </li>
  <li className="nav-item">
    <Link className="nav-link text-dark" to="/instructor/answers">
      {t('sidebar.manage_answers')}
    </Link>
  </li>
</ul>
```

**Instructor-Only Links:**
- **Dashboard** (`/instructor/dashboard`): Instructor analytics and overview (translated via `sidebar.dashboard`)
- **Manage Answers** (`/instructor/answers`): Create and edit exam answers (translated via `sidebar.manage_answers`)

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
  {t('sidebar.all_courses')}
</Link>
```

### i18n Integration

Uses react-i18next for internationalization:
```javascript
import { useTranslation } from 'react-i18next';

const { t } = useTranslation();
// Usage: {t('sidebar.navigation')}, {t('sidebar.all_courses')}, etc.
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
- **react-i18next**: `useTranslation` hook for translations

## Translation Keys Used

| Key | English | Persian |
|-----|---------|---------|
| `sidebar.navigation` | Navigation | ناوبری |
| `sidebar.all_courses` | 📚 All Courses | 📚 همه درس‌ها |
| `sidebar.my_tickets` | 🎫 My Tickets | 🎫 تیکت‌های من |
| `sidebar.reports` | ⚠️ Reports | ⚠️ گزارش‌ها |
| `sidebar.instructor_tools` | Instructor Tools | ابزارهای استاد |
| `sidebar.dashboard` | 📊 Dashboard | 📊 داشبورد |
| `sidebar.manage_answers` | ✏️ Manage Answers | ✏️ مدیریت پاسخ‌ها |

## Future Enhancements

1. **Role-Based Visibility**: Conditionally render "Instructor Tools" section using `useAuth()` hook
2. **Active State Highlighting**: Add visual indicator for current route
3. **Collapsible on Mobile**: Implement toggle functionality for mobile viewports
4. **Dynamic Course List**: Fetch and display user's enrolled courses dynamically
5. **Notification Badges**: Show unread ticket/report counts

## Change Log

- **Initial Implementation**: Created sidebar with placeholder navigation links for courses, tickets, reports, and instructor tools
- **Phase 7 - i18n Localization**:
  - Integrated useTranslation hook for all text content
  - Updated all hardcoded strings to use translation keys
  - Emoji icons moved into translation JSON files for proper localization

