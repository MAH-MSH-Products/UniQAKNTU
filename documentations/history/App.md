# App.jsx Documentation

## Purpose

The `App.jsx` file serves as the main application entry point for the AzmoonHub Nasir React frontend. It configures the routing structure using React Router DOM, provides authentication context throughout the application, and implements route protection using authentication wrappers. The component also handles RTL/LTR direction switching based on the active language (Persian/English). In Phase 4, it was updated to include SourceMaterialsProvider for caching source materials and implement flat endpoint routing structure.

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
        <SourceMaterialsProvider>
          <Routes>
            {/* Route definitions */}
          </Routes>
        </SourceMaterialsProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
```

**Core Responsibilities:**
- Wraps application with `BrowserRouter` for client-side routing
- Provides `AuthProvider` for global authentication state
- Provides `SourceMaterialsProvider` for caching source materials (Phase 4)
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
| `/source-materials` | SourceMaterialsList | MainLayout | Browse all source materials (Phase 4) |
| `/source-materials/:id` | SourceMaterialsList | MainLayout | View single source material detail (Phase 4) |
| `/source-materials/:examId/questions` | QuestionExplorer | MainLayout | View questions for a specific source material (Phase 10) |

```javascript
<Route element={<MainLayout />}>
  <Route path="/" element={<Home />} />
  
  {/* Phase 4: Source Materials routes (replaces /curriculum/courses/) */}
  <Route path="/source-materials" element={<SourceMaterialsList />} />
  <Route path="/source-materials/:id" element={<div className="p-4"><h2>Source Material Detail</h2></div>} />
  
  {/* Phase 10: Source Material Questions route */}
  <Route path="/source-materials/:examId/questions" element={<QuestionExplorer />} />
</Route>
```

### Protected Routes (RequireAuth)

Require user authentication:

**Phase 6 Update:** Support-related routes have been disabled/removed as the backend endpoints do not exist. These routes are commented out until backend support is added.

| Path | Component | Layout | Description | Status |
|------|-----------|--------|-------------|--------|
| `/support` | ~~SupportCenter~~ | MainLayout | Submit and view support tickets | **Disabled (Phase 6)** |
| `/tickets` | ~~My Tickets Page~~ | MainLayout | View user's ticket history | **Disabled (Phase 6)** |
| `/reports` | ~~Reports Page~~ | MainLayout | View content reports | **Disabled (Phase 6)** |
| `/admin/support` | ~~AdminSupportPanel~~ | MainLayout | Admin panel for managing tickets | **Disabled (Phase 6)** |
| `/answers/:answerId` | AnswerDetail | MainLayout | View single answer detail (Phase 4) | Active |

```javascript
<Route element={<RequireAuth />}>
  <Route element={<MainLayout />}>
    {/* Phase 6: Support routes disabled - backend endpoints do not exist */}
    {/* <Route path="/support" element={<SupportCenter />} /> */}
    {/* <Route path="/tickets" element={<div className="p-4"><h2>My Tickets Page</h2></div>} /> */}
    {/* <Route path="/reports" element={<div className="p-4"><h2>Reports Page</h2></div>} /> */}
    {/* <Route path="/admin/support" element={<AdminSupportPanel />} /> */}
    
    {/* Phase 4: Questions and Answers routes with flat structure */}
    <Route path="/answers/:answerId" element={<AnswerDetail />} />
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
    └── SourceMaterialsProvider (Phase 4)
        └── Routes
            ├── Public Routes (MainLayout)
            │   ├── / → Home
            │   ├── /source-materials → SourceMaterialsList (Phase 4)
            │   ├── /source-materials/:id → SourceMaterial Detail (Phase 4)
            │   └── /source-materials/:examId/questions → QuestionExplorer (Phase 10)
            │
            ├── RequireAuth Routes
            │   └── MainLayout
            │       ├── Phase 6: Support routes DISABLED (commented out)
            │       │   ├── /support → SupportCenter [DISABLED]
            │       ├── /tickets → My Tickets [DISABLED]
            │       ├── /reports → Reports [DISABLED]
            │       ├── /admin/support → AdminSupportPanel [DISABLED]
            │       └── /answers/:answerId → AnswerDetail (Phase 4)
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

### SourceMaterialsContext Integration (Phase 4)

Provides cached source materials to all components for dropdown population:

```javascript
import { SourceMaterialsProvider } from './context/SourceMaterialsContext';

<SourceMaterialsProvider>
  <Routes>
    {/* All routes have access to cached source materials */}
  </Routes>
</SourceMaterialsProvider>
```

**Purpose:**
- Caches source materials globally on app initialization
- Eliminates redundant API calls across components
- Provides consistent data for dropdown menus in forms
- Supports Phase 4 flat endpoint structure

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
- **SourceMaterialsContext**: `SourceMaterialsProvider` for caching source materials (Phase 4)
- **i18n**: Internationalization configuration
- **i18next**: Language change event handling
- **Layout Components**: MainLayout, AuthLayout
- **Auth Wrappers**: RequireAuth, RequireInstructor
- **Page Components**: Home, Login, Register, SupportCenter, AdminSupportPanel
- **Wiki Components**: QuestionExplorer, AnswerDetail (Phase 4)

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
| Unauthenticated | `/`, `/source-materials`, `/login`, `/register` |
| Authenticated (Student) | All public + `/support`, `/tickets`, `/reports`, `/questions/:id/answers` |
| Authenticated (Instructor) | All routes including `/instructor/*` and `/answers/:id` |
| Loading State | Shows spinner on protected routes |

## Phase 4 Routing Changes

### Old Route Structure (Nested REST)
- `/curriculum/courses/` → Course list
- `/curriculum/courses/{id}/exams/` → Single course exams
- `/wiki/questions/{id}/answers/` → Answers for question
- `/wiki/answers/{id}/` → Single answer detail

### New Route Structure (Flat Endpoints)
- `/source-materials/` → Source materials list
- `/source-materials/:id` → Single source material detail
- `/questions/:questionId/answers` → Answers for question
- `/answers/:answerId` → Single answer detail

**Benefits:**
- Simpler routing logic
- Aligns with backend flat API design
- Easier to maintain and extend
- Consistent query parameter usage

## Change Log

- **Initial Implementation**: Created basic routing structure with MainLayout and AuthLayout
- **Phase 7**: Added i18n RTL/LTR direction switching
- **Phase 11**: Integrated AuthLayout for authentication pages
- **Phase 12**: Implemented route protection with RequireAuth and RequireInstructor wrappers, reorganized route hierarchy
- **Phase 4**: Added SourceMaterialsProvider for global caching, updated routes to use flat endpoint structure, added QuestionExplorer and AnswerDetail routes
- **Phase 10**: Updated routing for QuestionExplorer component to use source material-based URLs (`/source-materials/:examId/questions`), replaced placeholder content with SourceMaterialsList component at `/source-materials` route
