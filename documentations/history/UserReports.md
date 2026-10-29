# UserReports Component Documentation

## Purpose
The `UserReports.jsx` component serves as an informational page that guides users on how to properly report content within the UniQAKNTU platform. It explains that reports are submitted contextually from specific questions or answers, not through a general reports page. For general issues, users are directed to the Support Center.

## Key Components

### Imports
- `React`: Core React library for component creation
- `Link` from `react-router-dom`: Navigation component for routing to the Support Center
- `useTranslation` from `react-i18next`: Internationalization hook for multi-language support
- `FaExclamationTriangle`, `FaArrowRight` from `react-icons/fa`: Icons for visual enhancement

### Component Structure

#### Main Container
- Uses `container-fluid` with `py-4` for responsive full-width layout with vertical padding
- Centers content using `row justify-content-center` with column constraints (`col-lg-8 col-md-10`)

#### Academic Card
- Wraps content in `.academic-card` class for consistent academic styling
- **Header**: Gradient background with warning icon and localized title
- **Body**: Contains:
  - Lead paragraph explaining the reporting workflow
  - Info alert with ordered list of steps (how to report)
  - Call-to-action button linking to Support Center

### Localization Keys Used
- `reports.title`: Page title ("Report Content")
- `reports.description`: Main explanatory text
- `reports.how_to_report_title`: Heading for the steps section
- `reports.how_to_report_step_1/2/3`: Individual reporting steps
- `reports.go_to_support`: Button text for navigation

## Usage

### Route Configuration
The component is registered in `App.jsx`:
```jsx
<Route path="/reports" element={<UserReports />} />
```

### Access Points
Users can navigate to this page via:
- Footer link "Reports" (`/reports`)
- Sidebar navigation "Reports"

## Integration

### Parent Components
- Rendered by `App.jsx` router when user navigates to `/reports`
- Wrapped by `MainLayout` which provides navbar, sidebar, and footer

### Child Components
- None (self-contained informational page)

### Dependencies
- Requires i18n translations to be loaded (`support` and `reports` namespaces)
- Requires Bootstrap CSS for styling classes
- Requires `.academic-card` CSS class definition in global styles

## Styling Notes
- Uses Bootstrap utility classes for responsive layout
- Leverages `.academic-card` custom class for thematic consistency
- Icon placement uses flexbox utilities (`d-flex`, `align-items-center`, `gap-2`)
- Button styled with `btn-primary btn-lg` for prominence

## Change Log
- **Initial Creation**: Created as part of UI/UX bugfixes to replace placeholder Reports page with meaningful content explaining the contextual reporting workflow
