# Navbar.jsx Documentation

## Purpose

The `Navbar.jsx` file implements a responsive navigation bar component for the UniQAKNTU application. It displays branding, user authentication status, role indicators, and provides navigation controls based on the user's authentication state. The component also includes a language switcher for English/Persian (EN/FA) with i18n support.

## Key Components

### Navbar Component

```javascript
const Navbar = () => {
  const { user, isAuthenticated, logout, isInstructor } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();
  // ...
};
```

A functional React component that renders a Bootstrap-styled navigation bar with dynamic content based on authentication state and selected language.

**Props:** None (uses AuthContext via hook)

**State Management:**
- Uses `useAuth()` hook to access:
  - `user`: Current user object
  - `isAuthenticated`: Boolean indicating login status
  - `logout`: Logout function
  - `isInstructor`: Boolean indicating instructor role
- Uses `useTranslation()` hook from react-i18next for translations
- Uses `i18n` instance to detect current language and handle language changes

### Branding Section

```jsx
<Link className="navbar-brand" to="/">
  {t('nav.brand')}
</Link>
```

Displays the application logo/brand that links to the home page. The text is translated using i18n.

### Language Switcher

```jsx
<li className="nav-item me-2">
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
        {t('nav.welcome')}, {user?.username}
        {isInstructor && (
          <span className="badge bg-warning text-dark ms-2">
            {t('nav.instructor_badge')}
          </span>
        )}
      </span>
    </li>
    <li className="nav-item">
      <button
        className="btn btn-outline-light btn-sm"
        onClick={handleLogout}
      >
        {t('nav.logout')}
      </button>
    </li>
  </>
) : (
  <li className="nav-item">
    <Link className="btn btn-outline-light btn-sm" to="/login">
      {t('nav.login')}
    </Link>
  </li>
)}
```

**Conditional Rendering Logic:**

**When Authenticated:**
- Displays welcome message with username (translated)
- Shows "Instructor" badge if `user.is_instructor` is true (translated)
- Provides logout button that triggers `handleLogout()` (translated)

**When Not Authenticated:**
- Displays login button linking to `/login` route (translated)

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
- **btn-group**: Button group container
- **btn-group-sm**: Small button size
- **ms-auto**: Margin start (auto) for right alignment
- **align-items-center**: Vertical center alignment
- **me-2**, **me-3**: Margin end spacing

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
        <!-- Language Switcher -->
        <li class="nav-item me-2">
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

- **React**: Functional component
- **react-router-dom**: `Link`, `useNavigate` for routing
- **AuthContext**: `useAuth` hook for authentication state
- **react-i18next**: `useTranslation` hook for translations
- **i18next**: Core i18n instance for language detection and changes
- **Bootstrap**: CSS framework for styling (`bootstrap/dist/css/bootstrap.min.css`)

## Translation Keys Used

| Key | English | Persian |
|-----|---------|---------|
| `nav.brand` | UniQAKNTU | یونی‌قاکنتو |
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

