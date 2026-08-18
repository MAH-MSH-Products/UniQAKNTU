# WidgetsPanel Documentation

## Purpose
The `WidgetsPanel` component provides a dynamic side panel displaying three widget sections:
1. **Recent Answers** - Shows the latest instructor answers added to the platform
2. **Popular Courses** - Displays courses with the most exams/questions
3. **Latest Exams** - Lists recently added exams

This component enhances user engagement by providing quick access to trending and recent content, similar to dashboard widgets on modern LMS platforms like Coursera.

## Key Components

### State Variables
- `recentAnswers` (Array): Stores recent answer objects
- `popularCourses` (Array): Stores popular course objects
- `latestExams` (Array): Stores latest exam objects
- `loading` (Boolean): Tracks data fetching state

### Widget Sections

#### 1. Recent Answers Widget
- **Icon**: `FiMessageSquare` from react-icons
- **Data Source**: `GET /widgets/recent-answers/` **(باید چک شود)**
- **Display Fields**: title, course, author, date

#### 2. Popular Courses Widget
- **Icon**: `FiBookOpen` from react-icons
- **Data Source**: `GET /widgets/popular-courses/` **(باید چک شود)**
- **Display Fields**: name, code, examCount

#### 3. Latest Exams Widget
- **Icon**: `FiFileText` from react-icons
- **Data Source**: `GET /widgets/latest-exams/` **(باید چک شود)**
- **Display Fields**: title, course, date

## Usage

```jsx
import WidgetsPanel from './components/layout/WidgetsPanel';

// Used within MainLayout
<MainLayout>
  <WidgetsPanel />
</MainLayout>
```

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

### API Integration Points (باید چک شود)
All three widget endpoints are currently using mock data. The actual API integration should replace the mock data sections:

```javascript
// Replace mock data with actual API calls:
const answersResponse = await api.get('/widgets/recent-answers/');
setRecentAnswers(answersResponse.data);

const coursesResponse = await api.get('/widgets/popular-courses/');
setPopularCourses(coursesResponse.data);

const examsResponse = await api.get('/widgets/latest-exams/');
setLatestExams(examsResponse.data);
```

## Dependencies
- `react` - Core React library
- `react-i18next` - For translations (useTranslation hook)
- `react-icons/fi` - For Feather icons (FiMessageSquare, FiBookOpen, FiFileText)
- `../../services/api` - Axios instance for API requests

## Change Log
- **Phase 8 (2026-08-18)**: Initial creation as part of UI/UX overhaul
  - Implemented professional academic styling
  - Added mock data for three widget types
  - Integrated with MainLayout responsive structure
