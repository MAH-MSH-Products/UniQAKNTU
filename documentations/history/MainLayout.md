# MainLayout.jsx Documentation

## Purpose

The `MainLayout.jsx` file implements the main application shell component for the UniQAKNTU React application. It provides a consistent layout structure across all protected routes, including the top navigation bar (Navbar), side navigation (Sidebar), and a main content area that renders child routes via React Router's Outlet component.

## Key Components

### MainLayout Component

```javascript
const MainLayout = () => {
  return (
    <div className="d-flex flex-column" style={{ minHeight: '100vh' }}>
      <Navbar />
      <div className="d-flex flex-grow-1">
        <div className="d-none d-md-block" style={{ width: '250px', flexShrink: 0 }}>
          <Sidebar />
        </div>
        <main className="flex-grow-1 p-4 bg-light" style={{ overflowY: 'auto' }}>
          <div className="container-fluid">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};
```

A functional React component that serves as the application's primary layout wrapper.

**Props:** None (uses route children via Outlet)

**Structure:**
1. **Top Navbar**: Full-width navigation bar with authentication controls
2. **Sidebar Area**: Left-side navigation (hidden on mobile)
3. **Main Content**: Scrollable content area with routed components

### Layout Structure

#### Vertical Flex Container

```jsx
<div className="d-flex flex-column" style={{ minHeight: '100vh' }}>
  {/* Navbar */}
  {/* Horizontal flex area with sidebar and main */}
</div>
```

**Features:**
- Full viewport height (`minHeight: '100vh'`)
- Flexbox column layout for vertical stacking
- Ensures footer would stick to bottom if added

#### Navbar Integration

```jsx
<Navbar />
```

Renders the top navigation bar component at full width.

**Reference**: See `documentations/Navbar.md` for Navbar details.

#### Sidebar and Main Content Area

```jsx
<div className="d-flex flex-grow-1">
  {/* Sidebar - hidden on small screens */}
  <div className="d-none d-md-block" style={{ width: '250px', flexShrink: 0 }}>
    <Sidebar />
  </div>
  
  {/* Main content area */}
  <main className="flex-grow-1 p-4 bg-light" style={{ overflowY: 'auto' }}>
    <div className="container-fluid">
      <Outlet />
    </div>
  </main>
</div>
```

**Sidebar Container:**
- `d-none d-md-block`: Hidden on mobile (<768px), visible on medium+ screens
- Fixed width: `250px`
- `flexShrink: 0`: Prevents sidebar from shrinking

**Main Content Area:**
- `flex-grow-1`: Takes remaining horizontal space
- `p-4`: Padding (1.5rem) for content spacing
- `bg-light`: Light gray background
- `overflowY: 'auto'`: Independent vertical scrolling
- `container-fluid`: Full-width Bootstrap container

### Outlet Component

```jsx
<Outlet />
```

React Router component that renders the matched child route element.

**Usage in App.jsx:**
```javascript
<Route element={<MainLayout />}>
  <Route path="/" element={<Home />} />
  <Route path="/courses" element={<CoursesPage />} />
  <Route path="/tickets" element={<TicketsPage />} />
</Route>
```

When `/courses` is visited:
- MainLayout renders Navbar + Sidebar
- Outlet renders `<CoursesPage />` in the main content area

## Usage

### Route Configuration in App.jsx

```javascript
import { Routes, Route } from 'react-router-dom';
import MainLayout from './components/layout/MainLayout';
import Home from './pages/Home';
import Login from './pages/Login';

function App() {
  return (
    <Routes>
      {/* Routes with MainLayout wrapper */}
      <Route element={<MainLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/courses" element={<Courses />} />
        <Route path="/tickets" element={<Tickets />} />
      </Route>
      
      {/* Standalone routes (no layout) */}
      <Route path="/login" element={<Login />} />
    </Routes>
  );
}
```

### Child Page Components

Pages rendered inside MainLayout don't need to include Navbar/Sidebar:

```javascript
// pages/Home.jsx
const Home = () => {
  return (
    <div>
      <h1>Welcome</h1>
      <p>This renders inside MainLayout's Outlet</p>
    </div>
  );
};
```

## Integration Points

### Navbar Component

```javascript
import Navbar from './Navbar';

// Rendered at top of layout
<Navbar />
```

See `documentations/Navbar.md` for details.

### Sidebar Component

```javascript
import Sidebar from './Sidebar';

// Rendered in left sidebar area
<Sidebar />
```

See `documentations/Sidebar.md` for details.

### react-router-dom Outlet

```javascript
import { Outlet } from 'react-router-dom';

// Renders matched child route
<Outlet />
```

The Outlet automatically receives:
- Current route element from parent Route
- Access to route context and hooks

## Styling

### Bootstrap Classes Used

- **d-flex**: Display flexbox
- **flex-column**: Flex direction column (vertical)
- **flex-grow-1**: Flex grow factor 1 (fill available space)
- **d-none**: Display none (hide element)
- **d-md-block**: Display block on medium+ breakpoints (≥768px)
- **p-4**: Padding utility (1.5rem)
- **bg-light**: Light background color
- **container-fluid**: Full-width responsive container

### Custom Inline Styles

**Root Container:**
```javascript
style={{ minHeight: '100vh' }}
```
Ensures layout spans full viewport height.

**Sidebar Wrapper:**
```javascript
style={{ width: '250px', flexShrink: 0 }}
```
Fixed sidebar width that doesn't compress.

**Main Content:**
```javascript
style={{ overflowY: 'auto' }}
```
Enables independent scrolling for main content while sidebar stays fixed.

## Responsive Behavior

| Breakpoint | Sidebar | Main Content |
|------------|---------|--------------|
| Mobile (<768px) | Hidden | Full width |
| Medium (≥768px) | 250px width | Remaining width |
| Large (≥992px) | 250px width | Remaining width |
| XL (≥1200px) | 250px width | Remaining width |

**Mobile Consideration:**
- Sidebar completely hidden on small screens
- Future enhancement: Add collapsible/toggle sidebar for mobile
- Navbar remains visible with mobile toggle menu

## Expected DOM Structure

```html
<div class="d-flex flex-column" style="min-height: 100vh;">
  <!-- Navbar -->
  <nav class="navbar navbar-expand-lg navbar-dark bg-primary">
    <!-- Navbar content -->
  </nav>
  
  <!-- Flex row for sidebar + main -->
  <div class="d-flex flex-grow-1">
    <!-- Sidebar (hidden on mobile) -->
    <div class="d-none d-md-block" style="width: 250px; flex-shrink: 0;">
      <div class="sidebar bg-light border-end" style="min-height: calc(100vh - 56px);">
        <!-- Sidebar navigation -->
      </div>
    </div>
    
    <!-- Main content area -->
    <main class="flex-grow-1 p-4 bg-light" style="overflow-y: auto;">
      <div class="container-fluid">
        <!-- Rendered page component from Outlet -->
        <div><!-- Home, Courses, Tickets, etc. --></div>
      </div>
    </main>
  </div>
</div>
```

## Dependencies

- **React**: Functional component
- **react-router-dom**: `Outlet` for rendering child routes
- **Navbar**: Top navigation component
- **Sidebar**: Side navigation component
- **Bootstrap**: CSS framework for responsive layout classes

## Route Hierarchy Example

```
App (BrowserRouter + AuthProvider)
└── Routes
    ├── Route (element: MainLayout)
    │   ├── Route path="/" → Home (in Outlet)
    │   ├── Route path="/courses" → Courses (in Outlet)
    │   ├── Route path="/tickets" → Tickets (in Outlet)
    │   └── Route path="/reports" → Reports (in Outlet)
    └── Route path="/login" → Login (standalone, no MainLayout)
```

## Future Enhancements

1. **Mobile Sidebar Toggle**: Add button to show/hide sidebar on mobile
2. **Breadcrumb Navigation**: Add breadcrumbs above Outlet content
3. **Loading States**: Show loading skeleton while routes load
4. **Error Boundary**: Wrap Outlet with error handling component
5. **Footer Component**: Add sticky footer below main content
6. **Toast Notifications**: Add notification container for app-wide alerts

## Change Log

- **Initial Implementation**: Created main application layout with Navbar, Sidebar, and Outlet-based routing structure with responsive design
