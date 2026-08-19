# Navbar.jsx Documentation

## Purpose

The `Navbar.jsx` file implements a responsive navigation bar component for the AzmoonHub Nasir application. It displays branding with the official logo, user authentication status, role indicators, and provides navigation controls based on the user's authentication state. The component includes a language switcher for English/Persian (EN/FA), sticky positioning, and scroll-triggered shadow effects for enhanced UX.

## Key Components

### Navbar Component

```javascript
const Navbar = () => {
  const { user, isAuthenticated, logout, isInstructor } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [isScrolled, setIsScrolled] = useState(false);
  // ...
};
```

A functional React component that renders a Bootstrap-styled navigation bar with dynamic content based on authentication state, selected language, and scroll position.

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
2. Adds `shadow-sm` class when user scrolls down
3. Removes shadow when at top of page
4. Provides visual feedback and depth perception

### Branding Section with Logo

```jsx
<Link className="navbar-brand d-flex align-items-center" to="/">
  <img src={logo} alt="AzmoonHub Nasir" height="40" className="me-2" />
</Link>
```

**Features:**
- Uses `azHubNasir.png` logo image (40px height)
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
- **position-sticky**: Sticky positioning at top of viewport
- **top-0**: Position at top (0px)
- **shadow-sm**: Small shadow (conditionally applied on scroll)
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

```javascript
style={{ 
  backgroundColor: 'var(--primary-color)', 
  zIndex: 1030 
}}
```

**Purpose:**
- `backgroundColor`: Applies primary brand color (Deep Blue)
- `zIndex: 1030`: Ensures navbar stays above other content (Bootstrap's default modal z-index is 1050)

### Responsive Behavior

- **Desktop (≥992px)**: Full navbar displayed horizontally with logo, language switcher, and auth controls
- **Mobile (<992px)**: Collapsible menu with toggle button; items stack vertically when expanded

## Expected Structure in DOM

```html
<nav class="navbar navbar-expand-lg position-sticky top-0 shadow-sm" 
     style="background-color: var(--primary-color); z-index: 1030;">
  <div class="container-fluid">
    <a class="navbar-brand d-flex align-items-center" href="/">
      <img src="azHubNasir.png" alt="AzmoonHub Nasir" height="40" />
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
        <!-- Authenticated or Login content -->
      </ul>
    </div>
  </div>
</nav>
```

## Dependencies

- **React**: Functional component with hooks (`useState`, `useEffect`)
- **react-router-dom**: `Link`, `useNavigate` for routing
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


