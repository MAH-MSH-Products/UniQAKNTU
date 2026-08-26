# Navbar.jsx Documentation

## Purpose

The `Navbar.jsx` file provides a responsive navigation bar component for the UniQAKNTU frontend application. It displays branding with the AzmoonHub Nasir logo, user authentication controls, role-based badges, and a language switcher. The navbar dynamically adapts its styling based on the current route and scroll position.

## Key Components

### Component Structure

```javascript
const Navbar = () => {
  const { user, isAuthenticated, logout, canModerate, userRole } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();
  const [isScrolled, setIsScrolled] = useState(false);
  
  // ... state and handlers
  
  return (
    <nav className={...} style={getNavbarStyle()}>
      {/* Navigation content */}
    </nav>
  );
};
```

**Props:** None

**Returns:** Bootstrap navbar element with dynamic styling and content

### Role Badge Rendering

```javascript
const renderRoleBadge = () => {
  if (userRole === 'ADMIN') {
    return (
      <span className="badge" style={{ backgroundColor: '#dc3545', color: 'white' }}>
        {t('nav.admin_badge') || 'Admin'}
      </span>
    );
  } else if (userRole === 'MODERATOR') {
    return (
      <span className="badge" style={{ backgroundColor: 'var(--secondary-color)', color: 'white' }}>
        {t('nav.moderator_badge') || 'Moderator'}
      </span>
    );
  }
  return null;
};
```

**Functionality:**
- Displays role-specific badge based on `userRole` from AuthContext
- ADMIN role: Red badge (#dc3545)
- MODERATOR role: Secondary color badge
- STUDENT role: No badge displayed
- Supports i18n translation with fallback to English

### Dynamic Styling

```javascript
const getNavbarStyle = () => {
  if (isAuthPage) {
    return {
      background: 'rgba(10, 37, 64, 0.4)',
      backdropFilter: 'blur(10px)',
      WebkitBackdropFilter: 'blur(10px)',
      zIndex: 1030,
      position: 'absolute',
      width: '100%'
    };
  }
  return {
    backgroundColor: 'var(--primary-color)',
    zIndex: 1030
  };
};
```

**Functionality:**
- Returns glassmorphism style for auth pages (/login, /register)
- Returns solid primary color for other pages
- Applies blur effect for modern visual appearance

### Scroll Effect

```javascript
useEffect(() => {
  const handleScroll = () => {
    setIsScrolled(window.scrollY > 0);
  };

  window.addEventListener('scroll', handleScroll);
  return () => window.removeEventListener('scroll', handleScroll);
}, []);
```

**Functionality:**
- Tracks scroll position to apply shadow effect
- Adds `shadow-sm` class when page is scrolled
- Cleans up event listener on unmount

### Logout Handler

```javascript
const handleLogout = () => {
  logout();
  navigate('/login');
};
```

**Functionality:**
- Calls `logout()` from AuthContext to clear auth state
- Navigates user to login page

### Language Switcher

```javascript
const handleLanguageChange = (lng) => {
  i18n.changeLanguage(lng);
};
```

**Functionality:**
- Switches between English (EN) and Persian (FA) languages
- Uses react-i18next for internationalization

## Usage

### Basic Integration

```javascript
import Navbar from './components/layout/Navbar';

function App() {
  return (
    <>
      <Navbar />
      <Routes>
        {/* Routes */}
      </Routes>
    </>
  );
}
```

### With AuthProvider

```javascript
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/layout/Navbar';

ReactDOM.createRoot(document.getElementById('root')).render(
  <AuthProvider>
    <Navbar />
    <App />
  </AuthProvider>
);
```

## Integration Points

### AuthContext Dependency

Requires `AuthProvider` to be present in the component tree:

```javascript
const { user, isAuthenticated, logout, canModerate, userRole } = useAuth();
```

**Required Values:**
- `user`: User object with username
- `isAuthenticated`: Boolean for auth state
- `logout`: Function to clear auth session
- `canModerate`: Boolean for moderator/admin check
- `userRole`: String enum (STUDENT, MODERATOR, ADMIN)

### React Router Dependencies

- **Link**: For navigation links within the app
- **useNavigate**: For programmatic navigation (logout)
- **useLocation**: For detecting current route (auth pages)

### Internationalization (i18n)

Uses react-i18next for translations:

```javascript
import { useTranslation } from 'react-i18next';
import i18n from 'i18next';

const { t } = useTranslation();
// Usage: {t('nav.login')}, {t('nav.logout')}, etc.
```

### Bootstrap Integration

Relies on Bootstrap 5 CSS classes:
- `navbar`, `navbar-expand-lg`: Base navbar styles
- `container-fluid`: Full-width container
- `dropdown`, `dropdown-menu`: Profile dropdown
- `btn-group`: Language switcher buttons

## Styling

### Glassmorphism Effect (Auth Pages)

```css
background: rgba(10, 37, 64, 0.4);
backdrop-filter: blur(10px);
WebkitBackdropFilter: blur(10px);
```

Creates frosted glass effect over gradient backgrounds.

### Position Classes

- Auth pages: `position-absolute` (blends with page content)
- Other pages: `position-sticky top-0` (sticks to viewport top)

### Shadow Effect

Applied conditionally based on scroll position:
- `shadow-sm`: Added when `isScrolled` is true

## Change Log

### Phase 1 - JWT Migration (Current)
- Changed from `isInstructor` to `canModerate` and `userRole` from AuthContext
- Implemented `renderRoleBadge()` function for enum-based role display
- Added support for ADMIN role badge (red color)
- Updated MODERATOR badge terminology (from "instructor" to "moderator")
- Removed `isInstructor` conditional rendering

### Initial Implementation (Previous)
- Created responsive navbar with Bootstrap 5
- Implemented authentication-aware UI (login/register vs profile dropdown)
- Added language switcher (EN/FA)
- Integrated scroll-based shadow effect
- Added glassmorphism styling for auth pages
- Implemented profile dropdown with user information
