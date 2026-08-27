# WidgetsPanel Documentation

## Purpose
The `WidgetsPanel` component provides a dynamic side panel displaying three widget sections:
1. **Recent Answers** - Shows the latest instructor answers added to the platform
2. **Popular Courses** - Displays courses with the most exams/questions
3. **Latest Exams** - Lists recently added exams

This component enhances user engagement by providing quick access to trending and recent content, similar to dashboard widgets on modern LMS platforms like Coursera.

**Phase 6 Update:** All backend endpoints for widgets do not exist. This component now uses mock data exclusively and serves as a placeholder until backend support is added.

**Phase 6.2 Update:** Implements conditional rendering based on the `REACT_APP_ENABLE_MOCK_WIDGETS` environment variable. When set to `'false'`, displays an `EmptyState` fallback component instead of mock widgets.

## Key Components

### State Variables
- `recentAnswers` (Array): Stores recent answer objects (mock data)
- `popularCourses` (Array): Stores popular course objects (mock data)
- `latestExams` (Array): Stores latest exam objects (mock data)
- `loading` (Boolean): Tracks data fetching state

### Widget Sections

#### 1. Recent Answers Widget
- **Icon**: `FiMessageSquare` from react-icons
- **Data Source**: `GET /widgets/recent-answers/` **[DISABLED - Phase 6]**
- **Display Fields**: title, course, author, date
- **Status**: Backend endpoint does not exist - using mock data

#### 2. Popular Courses Widget
- **Icon**: `FiBookOpen` from react-icons
- **Data Source**: `GET /widgets/popular-courses/` **[DISABLED - Phase 6]**
- **Display Fields**: name, code, examCount
- **Status**: Backend endpoint does not exist - using mock data

#### 3. Latest Exams Widget
- **Icon**: `FiFileText` from react-icons
- **Data Source**: `GET /widgets/latest-exams/` **[DISABLED - Phase 6]**
- **Display Fields**: title, course, date
- **Status**: Backend endpoint does not exist - using mock data

### EmptyState Component (Phase 6.2)
A fallback component that displays when `process.env.REACT_APP_ENABLE_MOCK_WIDGETS === 'false'`.

**Purpose**: Provides a graceful degradation path when mock widgets are disabled via environment configuration.

**Display**: Shows a centered message with icon stating "Widgets are currently unavailable. Backend integration pending."

## Usage

```jsx
import WidgetsPanel from './components/layout/WidgetsPanel';

// Used within MainLayout
<MainLayout>
  <WidgetsPanel />
</MainLayout>
```

### Environment Configuration (Phase 6.2)
To disable mock widgets and show the empty state fallback:

```env
# .env file
REACT_APP_ENABLE_MOCK_WIDGETS=false
```

When this environment variable is set to `'false'`, the component renders `<EmptyState />` instead of the mock widget panels.

## Styling

The component uses the following CSS classes from `index.css`:
- `.widget-panel` - Container styling
- `.widget-item` - Individual item rows
- `.widget-icon` - Icon styling with secondary color
- `.widget-title` - Primary text (title)
- `.widget-subtitle` - Secondary text (metadata)
- `.academic-card` - Card container with hover effects

## Integration

### Parent Component: MainLayout
The `WidgetsPanel` is integrated into `MainLayout.jsx`:
- **Desktop View**: Displayed as a 300px wide column on the right side
- **Mobile View**: Hidden using Bootstrap's `d-none d-lg-block` utility

### API Integration Points [DISABLED - Phase 6]
All three widget endpoints do not exist in the backend. The component uses mock data exclusively:

**Disabled Endpoints:**
- `GET /widgets/recent-answers/` **[DISABLED]**
- `GET /widgets/popular-courses/` **[DISABLED]**
- `GET /widgets/latest-exams/` **[DISABLED]**

### Mock Data Structure
```javascript
// Recent Answers Mock Data
const mockAnswers = [
  { id: 1, title: 'Banker\'s Algorithm Solution', course: 'Operating Systems', author: 'Dr. Khanmirza', date: '2026-08-16' },
  { id: 2, title: 'Deadlock Prevention', course: 'Operating Systems', author: 'Prof. Rahimi', date: '2026-08-15' },
  { id: 3, title: 'Process Scheduling', course: 'Computer Architecture', author: 'Dr. Azizi', date: '2026-08-14' }
];

// Popular Courses Mock Data
const mockCourses = [
  { id: 1, name: 'Operating Systems', code: 'CE414', examCount: 12 },
  { id: 2, name: 'Computer Networks', code: 'CE420', examCount: 10 },
  { id: 3, name: 'Database Systems', code: 'CE305', examCount: 8 }
];

// Latest Exams Mock Data
const mockExams = [
  { id: 1, title: 'Final Exam 1402', course: 'Operating Systems', date: '2026-08-16' },
  { id: 2, title: 'Midterm 1402', course: 'Computer Networks', date: '2026-08-15' },
  { id: 3, title: 'Final Exam 1401', course: 'Database Systems', date: '2026-08-14' }
];
```

## Dependencies
- `react` - Core React library
- `react-i18next` - For translations (useTranslation hook)
- `react-icons/fi` - For Feather icons (FiMessageSquare, FiBookOpen, FiFileText)
- `../../services/api` - Imported but not used in Phase 6

## Change Log

- **Phase 6.2 (2026-08-27)** - UI Fallbacks Implementation:
  - Added `EmptyState` component for graceful degradation
  - Implemented conditional rendering based on `REACT_APP_ENABLE_MOCK_WIDGETS` environment flag
  - Follows pattern: `{process.env.REACT_APP_ENABLE_MOCK_WIDGETS === 'true' ? <MockWidgets /> : <EmptyState />}`

- **Phase 6 (2026-08-27)** - Feature Decommissioning & Mock Fallbacks:
  - Removed all API calls to non-existent backend endpoints
  - All widget data now uses mock data exclusively
  - Updated documentation to reflect disabled endpoints
  - Component serves as placeholder until backend support is added
  - Removed `api` import usage (kept for future integration)

- **Phase 8 (2026-08-18)** - Initial Creation:
  - Implemented professional academic styling
  - Added mock data for three widget types
  - Integrated with MainLayout responsive structure
