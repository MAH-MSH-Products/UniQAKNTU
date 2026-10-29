# PerformedWeeklyPlan Component Documentation

## Purpose
`frontend/src/pages/student/planner/PerformedWeeklyPlan/PerformedWeeklyPlan.jsx` renders the student's Performed Weekly Plan report (برنامه هفتگی انجام شده). In compliance with Sub-module 1 specifications, this view is strictly read-only and aggregates completed reading hours, review hours, and solved test items categorized by course and chapter.

## Key Components

### 1. CTA Informational Banner
Prompts students with directions on where to edit their data, reinforcing single-source-of-truth principles:
- Directs users to the Daily Schedule (Sub-module 5) for time edits.
- Directs users to the Conclusion Plan (Sub-module 2) for test result edits.

### 2. Week Navigation Controls
- Week selector controls allowing users to step backward and forward by 7-day intervals.
- "Current Week" reset button.
- Localized date formatting supporting both Gregorian and Persian calendars.

### 3. Summary KPI Cards
Three key metrics presented in high-contrast stat cards:
- **Total Reading Time** (`total_read_time_minutes`), formatted as `Xh Ym` / `X ساعت و Y دقیقه`.
- **Total Review Time** (`total_review_time_minutes`), formatted as `Xh Ym`.
- **Total Test Count** (`total_test_count`), displaying number of completed questions.

### 4. Chapter Breakdown Data Grid
Strictly read-only tabular presentation featuring:
- Source Material (کتاب / ماده درسی)
- Chapter / Topic (فصل / مبحث)
- Reading Time (زمان مطالعه)
- Review Time (زمان مرور)
- Test Count (تعداد تست)
- Empty state indicator when no study or testing activity is recorded for the selected week.

## Usage
Mounted as a protected route in `frontend/src/App.jsx`:
```jsx
<Route
  path="/schedule/performed-weekly-plan"
  element={
    <RequireAuth>
      <PerformedWeeklyPlan />
    </RequireAuth>
  }
/>
```

## Integration
- Fetches data via `api.planner.getWeeklyPerformance({ week_start })` from `frontend/src/services/api.js`.
- Utilizes `useTranslation()` from `react-i18next` with keys in the `"planner"` namespace (`translation.json`).
- Linked from the sidebar navigation menu in `frontend/src/components/layout/Sidebar.jsx`.
- Uses `react-icons/fi` (`FiCalendar`, `FiClock`, `FiCheckCircle`, `FiBookOpen`, `FiChevronLeft`, `FiChevronRight`, `FiInfo`, `FiExternalLink`).
