# SUB-MODULE 7: Student Analytics

## 2. Module Architectures

**Module ID:** `student-analytics`
**App Name (Django):** `planner` (Analytics Sub-domain)
**Domain Boundary:** This module is strictly responsible for querying, aggregating, and formatting historical study data into time-series and categorical structures suitable for charting and data visualization. It is a **Read-Only** reporting boundary. 

*Crucial Boundary Resolution:* To eliminate redundant database aggregations and ensure 100% consistency with Sub-module 6 (Reports), this module utilizes a centralized `CoreAnalyticsEngine`. It processes raw data exclusively from `StudyActivity` (Sub-module 5) and `TestRecord` (Sub-module 2) at the standardized `Chapter` granularity level.

**Layers:**
* **Domain:** `StudyAnalytics` (Virtual aggregated entity).
* **Application:** `CoreAnalyticsEngine` (Shared base aggregations), `ChartAdapterService` (Formats engine output specifically for `react-chartjs-2`).
* **Infrastructure:** PostgreSQL (via Django ORM using `TruncDay`, `TruncMonth`, `Sum`, `Avg`), Redis (for caching heavy analytical queries).
* **Interface:** DRF Views (`/api/planner/analytics/`), React SPA (`ChartsManagement.jsx` using `react-chartjs-2`).

**Data Model Mapping (Django `planner` app):**
*No new persistent tables. Derives data safely from:*
1. `StudyActivity` (from Module 5: duration, activity_type: 'READING', 'REVIEW', 'CLASS')
2. `TestRecord` (from Module 2: test counts, correct/wrong metrics)
3. `curriculum.SourceMaterialChapter` (Standardized categorization)

**Folder Placement:**
* Backend: `backend/apps/planner/services/analytics_service.py`
* Frontend: `frontend/src/pages/student/planner/Charts/`

**Naming Conventions Table:**

| Concept | Backend (Django) | Frontend (React) | Database (PostgreSQL) | API Contract |
| --- | --- | --- | --- | --- |
| Total Activity | `ActivityAggregator` | `TotalActivityChart` | N/A (Aggregated) | `total-activity` |
| Course Averages | `CourseAverageAggregator` | `CourseAverageCharts` | N/A (Aggregated) | `course-averages` |
| Time Allocation | `TimeAllocationAggregator` | `TimeAllocationCharts` | N/A (Aggregated) | `time-allocation` |

---

## 3. API Contracts

```markdown
# Student Analytics API Contract
**Module ID:** `student-analytics`
**Version:** `v1`
**Base Path:** `/api/planner/analytics/`
**Owner:** Backend Team

## Conventions
- **Method:** `GET` (Replacing the legacy `POST` approach for fetching chart data to leverage HTTP caching).
- **Query Parameters:** 
  - `start_date` (YYYY-MM-DD)
  - `end_date` (YYYY-MM-DD)
  - `interval` (Enum: `daily`, `weekly`, `monthly`, `3-month`, `6-month`, `1-year`, `all`).

## Endpoints

### `GET /api/planner/analytics/total-activity/`
**Summary:** Returns time-series data for overall study time, broken down by reading, reviewing, and testing.
**Auth:** Required (Role: `STUDENT`)
**Response 200:**
```json
{
  "summary": {
    "total_read_minutes": 2730,
    "total_review_minutes": 735,
    "total_test_minutes": 1200,
    "total_overall_minutes": 4665
  },
  "line_chart": {
    "labels": ["هفته ۱", "هفته ۲", "هفته ۳"],
    "datasets": {
      "total": [25.5, 26.0, 26.25],
      "read": [15.0, 14.5, 16.0],
      "review": [5.5, 4.0, 2.75],
      "test": [5.0, 7.5, 7.5]
    }
  },
  "pie_chart": {
    "read": 45.5,
    "review": 12.25,
    "test": 20.0
  }
}

```

### `GET /api/planner/analytics/course-averages/`

**Summary:** Returns average metrics per chapter/subject (percent score, time per test, time per page read/review).
**Query Params:** Includes `metric_type` (`percent`, `time_per_test`, `time_per_read_page`, `time_per_review_page`).
**Response 200:**

```json
{
  "metric": "time_per_test",
  "unit": "minutes",
  "labels": ["ساختمان داده", "سیستم عامل", "شبکه"],
  "datasets": [2.5, 1.8, 3.2]
}

```

### `GET /api/planner/analytics/time-allocation/`

**Summary:** Returns aggregated study time and test counts grouped by broader course types/sections (e.g., Math, Specialized 1).
**Response 200:**

```json
{
  "bar_chart": {
    "labels": ["مجموعه ریاضی", "مجموعه تخصصی ۱", "زبان"],
    "datasets": [40.5, 85.0, 10.0]
  },
  "table_data": [
    {
      "course_type": "مجموعه ریاضی",
      "total_hours": 40.5,
      "total_tests": 350
    }
  ],
  "totals": {
    "total_hours": 135.5,
    "total_tests": 1200
  }
}

```

### `GET /api/planner/analytics/stacked-course-activity/`

**Summary:** Returns time allocations per specific subject/chapter, stacked by activity type (Read, Review, Test).
**Response 200:**

```json
{
  "labels": ["ساختمان داده", "سیستم عامل", "شبکه"],
  "datasets": {
    "read": [10.5, 15.0, 8.0],
    "review": [4.0, 6.5, 2.0],
    "test": [8.0, 10.0, 5.0]
  }
}

```

## TypeScript Types

```typescript
export type Interval = 'daily' | 'weekly' | 'monthly' | '3-month' | '6-month' | '1-year' | 'all';
export type MetricType = 'percent' | 'time_per_test' | 'time_per_read_page' | 'time_per_review_page';

export interface TotalActivityDTO {
  summary: Record<string, number>;
  line_chart: {
    labels: string[];
    datasets: Record<string, number[]>;
  };
  pie_chart: Record<string, number>;
}

```

```

---

## 4. Integration Plan (Delegation TODOs)

### Backend TODOs
- [ ] **RESTful Refactoring:** Convert the legacy `POST` endpoints into standard `GET` requests utilizing query parameters (`start_date`, `end_date`, `interval`).
- [ ] **Core Analytics Engine:** Implement `CoreAnalyticsEngine` in `planner/services/`. This engine uses Django ORM `annotate()` with `TruncDate`, `TruncWeek`, `TruncMonth` to safely group data from `StudyActivity` and `TestRecord`. Share this engine with Sub-module 6.
- [ ] **Chart Formatting Layer:** Create `ChartAdapterService` that takes the generic Pandas/Dict output from `CoreAnalyticsEngine` and shapes it strictly into the `labels` and `datasets` arrays expected by Chart.js.
- [ ] **Mathematical Safety:** Ensure zero-division safety when calculating averages (e.g., `time_per_test` = `duration / total_tests`). Return `0` or `null` gracefully if `total_tests` is 0.
- [ ] **Caching Layer:** Wrap the analytics endpoint responses in a Redis cache (e.g., 1-hour TTL) for standard queries (like "All Time" or "6 Months") to reduce DB load, invalidating the cache when the user finalizes a new daily log in Sub-module 5.

### Frontend TODOs
- [ ] **Library Migration:** Migrate from vanilla `Chart.js` DOM manipulations to `react-chartjs-2` to align natively with the React SPA architecture.
- [ ] **Component Modularization:** 
  - Break down the massive `charts-management` HTML into individual React components: `<TotalActivityChart/>`, `<CourseAverageChart/>`, `<TimeAllocationChart/>`, and `<StackedActivityChart/>`.
  - Create a reusable `<DateRangeFilter/>` component to handle the custom Modal date selection and the `interval` tab switching.
- [ ] **State Management:** Use a data-fetching library (like React Query or SWR) to handle caching, loading states, and refetching when the user changes the date range or interval tab.
- [ ] **UI/UX Refinement:** Replicate the custom tooltips (e.g., showing `ساعت` or `دقیقه` dynamically based on the chart context) and legend positioning exactly as specified in the legacy configuration. Ensure RTL tooltips display correctly.

---

## 6. Verification Checklist
- [ ] **DRY Architecture:** The backend utilizes the shared `CoreAnalyticsEngine`, meaning Reports (Module 6) and Analytics (Module 7) are guaranteed to show matching numbers.
- [ ] **REST Compliance:** Legacy `POST` chart fetches are successfully refactored to cache-friendly `GET` requests with query parameters.
- [ ] **Mathematical Integrity:** Division by zero errors are strictly mitigated in average calculation endpoints (time per test, time per page).
- [ ] **Data Match:** The Data Table (جدول میزان زمان اختصاص داده شده) precisely matches the sum of the corresponding Doughnut/Bar charts.
- [ ] **Responsiveness:** Chart sizing operates correctly within the React grid system without canvas distortion upon resizing.

```