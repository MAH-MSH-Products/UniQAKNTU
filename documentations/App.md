# App.jsx Documentation

## Purpose

The `App.jsx` file serves as the main application entry point for the AzmoonHub Nasir React frontend. It configures the routing structure using React Router DOM, provides authentication context throughout the application, and implements route protection using authentication wrappers. The component also handles RTL/LTR direction switching based on the active language (Persian/English).

## Key Components

### Main Application Component

```javascript
function App() {
  // Handle RTL/LTR direction switching based on language
  useEffect(() => {
    const handleLanguageChange = (lng) => {
      document.documentElement.dir = lng === 'fa' ? 'rtl' : 'ltr';
      document.documentElement.lang = lng;
    };

    handleLanguageChange(i18n.language);
    i18n.on('languageChanged', handleLanguageChange);

    return () => {
      i18n.off('languageChanged', handleLanguageChange);
    };
  }, []);

  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Route definitions */}
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
```

**Core Responsibilities:**
- Wraps application with `BrowserRouter` for client-side routing
- Provides `AuthProvider` for global authentication state
- Configures all application routes with appropriate protection wrappers
- Manages RTL/LTR direction based on i18n language settings

### Language Direction Handler

The `useEffect` hook manages document direction for Persian (RTL) and English (LTR) support:

```javascript
useEffect(() => {
  const handleLanguageChange = (lng) => {
    document.documentElement.dir = lng === 'fa' ? 'rtl' : 'ltr';
    document.documentElement.lang = lng;
  };

  handleLanguageChange(i18n.language);
  i18n.on('languageChanged', handleLanguageChange);

  return () => {
    i18n.off('languageChanged', handleLanguageChange);
  };
}, []);
```

**Functionality:**
- Sets initial `dir` and `lang` attributes on mount
- Listens for language changes via i18next events
- Updates HTML element attributes dynamically
- Cleans up event listener on unmount

## Route Structure

### Public Routes

Accessible to all users without authentication:

| Path | Component | Layout | Description |
|------|-----------|--------|-------------|
| `/` | Home | MainLayout | Landing page with features and hero section |
| `/courses` | Courses Page | MainLayout | Browse all available courses |

```javascript
<Route element={<MainLayout />}>
  <Route path="/" element={<Home />} />
  <Route path="/courses" element={<div className="p-4"><h2>Courses Page</h2></div>} />
</Route>
```

### Protected Routes (RequireAuth)

Require user authentication:

| Path | Component | Layout | Description |
|------|-----------|--------|-------------|
| `/support` | SupportCenter | MainLayout | Submit and view support tickets |
| `/tickets` | My Tickets Page | MainLayout | View user's ticket history |
| `/reports` | Reports Page | MainLayout | View content reports |
| `/admin/support` | AdminSupportPanel | MainLayout | Admin panel for managing tickets |

```javascript
<Route element={<RequireAuth />}>
  <Route element={<MainLayout />}>
    <Route path="/support" element={<SupportCenter />} />
    <Route path="/tickets" element={<div className="p-4"><h2>My Tickets Page</h2></div>} />
    <Route path="/reports" element={<div className="p-4"><h2>Reports Page</h2></div>} />
    <Route path="/admin/support" element={<AdminSupportPanel />} />
  </Route>
</Route>
```

### Instructor Routes (RequireInstructor)

Require authenticated user with instructor role:

| Path | Component | Layout | Description |
|------|-----------|--------|-------------|
| `/instructor/dashboard` | Instructor Dashboard | MainLayout | Instructor analytics and stats |
| `/instructor/answers` | Manage Answers | MainLayout | Create and manage exam answers |

```javascript
<Route element={<RequireInstructor />}>
  <Route element={<MainLayout />}>
    <Route path="/instructor/dashboard" element={<div className="p-4"><h2>Instructor Dashboard</h2></div>} />
    <Route path="/instructor/answers" element={<div className="p-4"><h2>Manage Answers</h2></div>} />
  </Route>
</Route>
```

### Authentication Routes

Login and register pages with minimal layout:

| Path | Component | Layout | Description |
|------|-----------|--------|-------------|
| `/login` | Login | AuthLayout | User login form |
| `/register` | Register | AuthLayout | New user registration |

```javascript
<Route element={<AuthLayout />}>
  <Route path="/login" element={<Login />} />
  <Route path="/register" element={<Register />} />
</Route>
```

## Route Protection Hierarchy

```
BrowserRouter
└── AuthProvider
    └── Routes
        ├── Public Routes (MainLayout)
        │   ├── / → Home
        │   └── /courses → Courses Page
        │
        ├── RequireAuth Routes
        │   └── MainLayout
        │       ├── /support → SupportCenter
        │       ├── /tickets → My Tickets
        │       ├── /reports → Reports
        │       └── /admin/support → AdminSupportPanel
        │
        ├── RequireInstructor Routes
        │   └── MainLayout
        │       ├── /instructor/dashboard → Instructor Dashboard
        │       └── /instructor/answers → Manage Answers
        │
        └── AuthLayout Routes
            ├── /login → Login
            └── /register → Register
```

## Integration Points

### AuthContext Integration

Provides authentication state to all components:

```javascript
import { AuthProvider } from './context/AuthContext';

<AuthProvider>
  <Routes>
    {/* All routes have access to auth context */}
  </Routes>
</AuthProvider>
```

### Route Protection Components

Uses custom wrapper components for access control:

```javascript
import RequireAuth from './components/auth/RequireAuth';
import RequireInstructor from './components/auth/RequireInstructor';

// Authentication required
<Route element={<RequireAuth />}>
  {/* Protected routes */}
</Route>

// Instructor role required
<Route element={<RequireInstructor />}>
  {/* Instructor routes */}
</Route>
```

### Layout Components

Different layouts for different route groups:

```javascript
import MainLayout from './components/layout/MainLayout';
import AuthLayout from './components/layout/AuthLayout';

// Full layout with navbar, sidebar, footer
<Route element={<MainLayout />}>
  {/* Standard routes */}
</Route>

// Minimal layout with navbar only
<Route element={<AuthLayout />}>
  {/* Auth routes */}
</Route>
```

### i18n Integration

Configures internationalization and RTL support:

```javascript
import './i18n';
import i18n from 'i18next';

useEffect(() => {
  const handleLanguageChange = (lng) => {
    document.documentElement.dir = lng === 'fa' ? 'rtl' : 'ltr';
    document.documentElement.lang = lng;
  };
  
  i18n.on('languageChanged', handleLanguageChange);
  // ...
}, []);
```

## Dependencies

- **React**: Core component library (`useEffect`)
- **react-router-dom**: `BrowserRouter`, `Routes`, `Route`
- **AuthContext**: `AuthProvider` for authentication state
- **i18n**: Internationalization configuration
- **i18next**: Language change event handling
- **Layout Components**: MainLayout, AuthLayout
- **Auth Wrappers**: RequireAuth, RequireInstructor
- **Page Components**: Home, Login, Register, SupportCenter, AdminSupportPanel

## Security Considerations

### Client-Side Route Protection

- Route wrappers provide **UI-level protection only**
- All sensitive operations must be verified server-side
- API endpoints must validate authentication tokens
- Backend must enforce RBAC permissions

### Loading State Handling

- RequireAuth and RequireInstructor handle `isLoading` state
- Prevents premature redirects during auth initialization
- Shows loading spinner while checking localStorage

## Expected Behavior

| User State | Accessible Routes |
|------------|-------------------|
| Unauthenticated | `/`, `/courses`, `/login`, `/register` |
| Authenticated (Student) | All public + `/support`, `/tickets`, `/reports` |
| Authenticated (Instructor) | All routes including `/instructor/*` |
| Loading State | Shows spinner on protected routes |

## Change Log

- **Initial Implementation**: Created basic routing structure with MainLayout and AuthLayout
- **Phase 7**: Added i18n RTL/LTR direction switching
- **Phase 11**: Integrated AuthLayout for authentication pages
- **Phase 12**: Implemented route protection with RequireAuth and RequireInstructor wrappers, reorganized route hierarchy
