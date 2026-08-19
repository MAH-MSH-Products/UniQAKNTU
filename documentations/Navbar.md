# Navbar.jsx Documentation

## Purpose

The `Navbar.jsx` file implements a responsive navigation bar component for the AzmoonHub Nasir application. It displays branding with the official logo, user authentication status, role indicators, and provides navigation controls based on the user's authentication state. The component includes a language switcher for English/Persian (EN/FA), sticky positioning, and scroll-triggered shadow effects for enhanced UX. 

**Phase 11 Update:** The Navbar now features dynamic route-based styling that automatically adapts its appearance when rendered on authentication pages (`/login`, `/register`). On these pages, it applies a glassmorphism effect (semi-transparent background with blur) to blend seamlessly with the gradient auth backgrounds, while maintaining its solid professional appearance on all other pages.

## Key Components

### Navbar Component

```javascript
const Navbar = () => {
  const { user, isAuthenticated, logout, isInstructor } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();
  const [isScrolled, setIsScrolled] = useState(false);
  
  // Check if current path is an auth page
  const isAuthPage = location.pathname === '/login' || location.pathname === '/register';
  // ...
};
```

A functional React component that renders a Bootstrap-styled navigation bar with dynamic content based on authentication state, selected language, scroll position, and current route.

**Props:** None (uses AuthContext via hook)

**State Management:**
- Uses `useAuth()` hook to access:
  - `user`: Current user object
  - `isAuthenticated`: Boolean indicating login status
  - `logout`: Logout function
  - `isInstructor`: Boolean indicating instructor role
- Uses `useTranslation()` hook from react-i18next for translations
- Uses `i18n` instance to detect current language and handle language changes
- Uses `useState` to track scroll position for shadow effect
- Uses `useLocation()` hook from react-router-dom to detect current route

### Dynamic Route Detection

```javascript
const location = useLocation();

// Check if current path is an auth page
const isAuthPage = location.pathname === '/login' || location.pathname === '/register';
```

**Functionality:**
1. Accesses current location object via `useLocation()` hook
2. Checks if pathname matches `/login` or `/register`
3. Returns boolean `isAuthPage` for conditional styling
4. Enables route-aware visual adaptations

### getNavbarStyle Function

```javascript
const getNavbarStyle = () => {
  if (isAuthPage) {
    // Glassmorphism style for auth pages - blends with gradient background
    return {
      background: 'rgba(10, 37, 64, 0.4)',
      backdropFilter: 'blur(10px)',
      WebkitBackdropFilter: 'blur(10px)',
      zIndex: 1030,
      position: 'absolute',
      width: '100%'
    };
  }
  // Default solid primary color for other pages
  return {
    backgroundColor: 'var(--primary-color)',
    zIndex: 1030
  };
};
```

**Functionality:**
1. **Auth Pages (`/login`, `/register`):**
   - Semi-transparent dark blue background (`rgba(10, 37, 64, 0.4)`)
   - Backdrop blur effect (10px) for glassmorphism
   - Absolute positioning to float over gradient background
   - Full width to span viewport
   - Allows auth container gradient to show through

2. **Other Pages:**
   - Solid primary color background
   - Sticky positioning (via className)
   - Professional, opaque appearance

### Sticky Positioning & Scroll Effect

```javascript
const [isScrolled, setIsScrolled] = useState(false);

useEffect(() => {
  const handleScroll = () => {
    setIsScrolled(window.scrollY > 0);
  };

  window.addEventListener('scroll', handleScroll);
  return () => window.removeEventListener('scroll', handleScroll);
}, []);
```

**Functionality:**
1. Tracks vertical scroll position
2. Adds `shadow-sm` class when user scrolls down (non-auth pages only)
3. Removes shadow when at top of page
4. Provides visual feedback and depth perception
5. Disabled on auth pages to maintain clean floating appearance

### Branding Section with Logo

```jsx
<Link className="navbar-brand d-flex align-items-center" to="/">
  <img src={logo} alt="AzmoonHub Nasir" height="80" className="me-2" />
</Link>
```

**Features:**
- Uses `azHubNasir.png` logo image (80px height)
- Links to home page (`/`)
- Replaces text-based branding with visual identity

### Language Switcher

```jsx
<li className="nav-item me-3">
  <div className="btn-group btn-group-sm" role="group">
    <button
      type="button"
      className={`btn ${i18n.language === 'en' ? 'btn-light text-primary' : 'btn-outline-light'}`}
      onClick={() => handleLanguageChange('en')}
    >
      EN
    </button>
    <button
      type="button"
      className={`btn ${i18n.language === 'fa' ? 'btn-light text-primary' : 'btn-outline-light'}`}
      onClick={() => handleLanguageChange('fa')}
    >
      FA
    </button>
  </div>
</li>
```

**Features:**
- Two-button group for language selection (EN/FA)
- Active language is highlighted with `btn-light text-primary` styling
- Inactive language uses `btn-outline-light` styling
- Calls `handleLanguageChange(lng)` which triggers `i18n.changeLanguage(lng)`

### handleLanguageChange Function

```javascript
const handleLanguageChange = (lng) => {
  i18n.changeLanguage(lng);
};
```

**Functionality:**
1. Changes the active language in i18next
2. Triggers re-render of all components using `useTranslation()`
3. Activates RTL/LTR direction switch in App.jsx (via language change listener)
4. Persists language preference in localStorage

### Mobile Toggle Button

```jsx
<button
  className="navbar-toggler border-0"
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
      <span className="navbar-text text-white d-flex align-items-center">
        <FiUser className="me-1" />
        {t('nav.welcome')}, {user?.username}
        {isInstructor && (
          <span className="badge ms-2" style={{ backgroundColor: 'var(--secondary-color)', color: 'white' }}>
            {t('nav.instructor_badge')}
          </span>
        )}
      </span>
    </li>
    <li className="nav-item">
      <button
        className="btn btn-outline-light btn-sm d-flex align-items-center gap-1"
        onClick={handleLogout}
      >
        <FiLogOut />
        {t('nav.logout')}
      </button>
    </li>
  </>
) : (
  <>
    <li className="nav-item">
      <Link className="btn btn-outline-light btn-sm d-flex align-items-center gap-1" to="/login">
        <FiLogIn />
        {t('nav.login')}
      </Link>
    </li>
  </>
)}
```

**Conditional Rendering Logic:**

**When Authenticated:**
- Displays welcome message with username (translated)
- Shows "Instructor" badge if `user.is_instructor` is true (translated)
- Provides logout button with icon that triggers `handleLogout()` (translated)

**When Not Authenticated:**
- Displays login button with icon linking to `/login` route (translated)

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

### Import in AuthLayout

```javascript
import Navbar from './Navbar';

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

### i18n Integration

Uses react-i18next for internationalization:
```javascript
import { useTranslation } from 'react-i18next';
import i18n from 'i18next';

const { t } = useTranslation();
// Usage: {t('nav.brand')}, {t('nav.logout')}, etc.
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
    <Footer />
  </div>
);
```

### AuthLayout Integration

Used as the top navigation component for authentication pages:
```javascript
import Navbar from './Navbar';
import { Outlet } from 'react-router-dom';

const AuthLayout = () => (
  <div className="auth-layout-wrapper">
    <Navbar />
    <main className="auth-main-content">
      <Outlet />
    </main>
  </div>
);
```

### react-router-dom Integration

Uses routing hooks for navigation and route detection:
```javascript
import { Link, useNavigate, useLocation } from 'react-router-dom';

const navigate = useNavigate();
const location = useLocation();

// Navigation after logout
navigate('/login');

// Route detection for dynamic styling
const isAuthPage = location.pathname === '/login' || location.pathname === '/register';
```

## Styling

### Bootstrap Classes Used

- **navbar**: Base navbar container
- **navbar-expand-lg**: Responsive expansion at lg breakpoint
- **position-sticky**: Sticky positioning at top of viewport (non-auth pages)
- **position-absolute**: Absolute positioning (auth pages)
- **top-0**: Position at top (0px)
- **shadow-sm**: Small shadow (conditionally applied on scroll, non-auth pages only)
- **container-fluid**: Full-width container
- **navbar-brand**: Brand/logo styling
- **navbar-toggler**: Mobile toggle button
- **navbar-nav**: Navigation list
- **nav-item**: Individual nav items
- **navbar-text**: Text content in navbar
- **badge**: Role indicator badge
- **btn-outline-light**: Outline button style
- **btn-group**: Button group container
- **btn-group-sm**: Small button size
- **ms-auto**: Margin start (auto) for right alignment
- **align-items-center**: Vertical center alignment
- **me-2**, **me-3**: Margin end spacing
- **d-flex**: Flexbox display
- **gap-1**: Gap between flex children

### Custom Inline Styles

**Dynamic Styling (getNavbarStyle function):**

**For Auth Pages:**
```javascript
style={{ 
  background: 'rgba(10, 37, 64, 0.4)',
  backdropFilter: 'blur(10px)',
  WebkitBackdropFilter: 'blur(10px)',
  zIndex: 1030,
  position: 'absolute',
  width: '100%'
}}
```

**Purpose:**
- `background`: Semi-transparent dark blue allowing gradient to show through
- `backdropFilter`: Blur effect for glassmorphism appearance
- `WebkitBackdropFilter`: Safari compatibility for blur effect
- `zIndex: 1030`: Ensures navbar stays above other content
- `position: 'absolute'`: Floats over auth container without affecting layout
- `width: '100%'`: Spans full viewport width

**For Other Pages:**
```javascript
style={{ 
  backgroundColor: 'var(--primary-color)', 
  zIndex: 1030 
}}
```

**Purpose:**
- `backgroundColor`: Applies solid primary brand color (Deep Blue)
- `zIndex: 1030`: Ensures navbar stays above other content

### Dynamic ClassName

```javascript
className={`navbar navbar-expand-lg ${isAuthPage ? 'position-absolute' : 'position-sticky'} top-0 ${isScrolled && !isAuthPage ? 'shadow-sm' : ''}`}
```

**Conditional Classes:**
- **position-absolute**: Applied on auth pages for floating effect
- **position-sticky**: Applied on other pages for scroll-following behavior
- **shadow-sm**: Applied only when scrolled AND not on auth page

### Responsive Behavior

- **Desktop (≥992px)**: Full navbar displayed horizontally with logo, language switcher, and auth controls
- **Mobile (<992px)**: Collapsible menu with toggle button; items stack vertically when expanded

## Expected Structure in DOM

### On Auth Pages (`/login`, `/register`)

```html
<nav class="navbar navbar-expand-lg position-absolute top-0" 
     style="background: rgba(10, 37, 64, 0.4); backdrop-filter: blur(10px); position: absolute; width: 100%;">
  <div class="container-fluid">
    <a class="navbar-brand d-flex align-items-center" href="/">
      <img src="azHubNasir.png" alt="AzmoonHub Nasir" height="80" />
    </a>
    <button class="navbar-toggler border-0" ...>
      <span class="navbar-toggler-icon"></span>
    </button>
    <div class="collapse navbar-collapse" id="navbarNav">
      <ul class="navbar-nav ms-auto align-items-center">
        <!-- Language Switcher -->
        <li class="nav-item me-3">
          <div class="btn-group btn-group-sm">
            <button class="btn btn-light text-primary">EN</button>
            <button class="btn btn-outline-light">FA</button>
          </div>
        </li>
        <!-- Login button (when not authenticated) -->
      </ul>
    </div>
  </div>
</nav>
```

### On Other Pages (`/`, `/courses`, etc.)

```html
<nav class="navbar navbar-expand-lg position-sticky top-0 shadow-sm" 
     style="background-color: var(--primary-color); z-index: 1030;">
  <!-- Same structure as above -->
</nav>
```

## Dependencies

- **React**: Functional component with hooks (`useState`, `useEffect`)
- **react-router-dom**: `Link`, `useNavigate`, `useLocation` for routing and route detection
- **AuthContext**: `useAuth` hook for authentication state
- **react-i18next**: `useTranslation` hook for translations
- **i18next**: Core i18n instance for language detection and changes
- **react-icons/fi**: Feather icons (`FiLogOut`, `FiLogIn`, `FiUser`)
- **Bootstrap**: CSS framework for styling (`bootstrap/dist/css/bootstrap.min.css`)

## Translation Keys Used

| Key | English | Persian |
|-----|---------|---------|
| `nav.brand` | AzmoonHub Nasir | آزمون‌هاب نصیر |
| `nav.welcome` | Welcome | خوش آمدید |
| `nav.instructor_badge` | Instructor | استاد |
| `nav.login` | Login | ورود |
| `nav.logout` | Logout | خروج |
| `nav.register` | Register | ثبت‌نام |
| `nav.register_here` | Register here | اینجا ثبت‌نام کنید |
| `nav.dont_have_account` | Don't have an account? | حساب کاربری ندارید؟ |

## Change Log

- **Initial Implementation**: Created responsive navbar with authentication-based conditional rendering, instructor badge display, and logout functionality
- **Phase 7 - i18n Localization**: 
  - Added language switcher (EN/FA buttons)
  - Integrated useTranslation hook for all text content
  - Implemented handleLanguageChange function for dynamic language switching
  - Updated all hardcoded strings to use translation keys
- **Phase 9 - UI Polish**:
  - Replaced text logo with `azHubNasir.png` image
  - Added sticky positioning (`position-sticky top-0`)
  - Implemented scroll listener with useEffect for shadow effect
  - Added `zIndex: 1030` to ensure proper stacking context
  - Updated instructor badge styling to use secondary color
  - Enhanced icon integration with react-icons
- **Phase 11 - Dynamic Auth Styling**:
  - Added `useLocation()` hook import from react-router-dom
  - Implemented `isAuthPage` detection logic for `/login` and `/register` routes
  - Created `getNavbarStyle()` function for route-based dynamic styling
  - Added glassmorphism effect for auth pages:
    - Semi-transparent background: `rgba(10, 37, 64, 0.4)`
    - Backdrop blur filter: `blur(10px)`
    - Absolute positioning to float over gradient
  - Updated className to conditionally apply `position-absolute` vs `position-sticky`
  - Disabled shadow effect on auth pages (`isScrolled && !isAuthPage`)
  - Maintained solid primary color styling for non-auth pages
  - Preserved all existing scroll-listener and language-switcher functionality


