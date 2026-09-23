# API Contract: Planner Module

**Base Path**: `/api/planner/`
**Authentication**: JWT Bearer (required for all endpoints)
**Version**: v1
**Date**: 2026-09-23

## Conventions

- **Naming**: snake_case for JSON payloads
- **Pagination**: All list endpoints return `{ count, next, previous, results }` with page size = 20
- **Timestamps**: Every response includes both ISO 8601 (`created_at`, `updated_at`) and Persian Jalali (`*_jalali`) timestamps
- **UI Rendering**: Frontend MUST render `*_jalali` fields in user interface (per FR-024)
- **Role-Based Access**: Students can only access/modify their own data; MODERATOR/ADMIN have broader access
- **Error Responses**: Follow existing error contract (400/401/403/404/429)

---

## Sub-module 5: Weekly Study Hours

### `GET /api/planner/weekly-hours/current/`

**Summary**: Retrieve overview of current tracking week with lock status.

**Auth**: Required (`IsAuthenticated`, Role: `STUDENT`)

**Response 200**:
```json
{
  "week_number": 1,
  "start_date": "2026-09-20",
  "end_date": "2026-09-26",
  "can_edit_previous_week": true,
  "days": [
    {
      "date": "2026-09-20",
      "day_name_jalali": "یکشنبه ۲۹ شهریور",
      "is_finalized": false,
      "is_locked": false,
      "total_study_duration_minutes": 0
    }
  ]
}
```

---

### `GET /api/planner/weekly-hours/daily-logs/{date}/`

**Summary**: Retrieve detailed study activities and sleep time for a specific date.

**Auth**: Required

**Path Parameters**:
- `date`: YYYY-MM-DD format

**Response 200**:
```json
{
  "date": "2026-09-20",
  "date_jalali": "1403/06/29",
  "sleep_duration_minutes": 480,
  "is_finalized": false,
  "activities": [
    {
      "id": "uuid",
      "chapter": {
        "id": "uuid",
        "title": "Graph Theory",
        "chapter_number": 3,
        "source_material": {
          "id": 1,
          "title": "Discrete Mathematics"
        }
      },
      "activity_type": "READING",
      "duration_minutes": 150
    }
  ]
}
```

---

### `PUT /api/planner/weekly-hours/daily-logs/{date}/`

**Summary**: Upsert daily study log and associated activities in bulk. Enforces temporal locking (FR-002).

**Auth**: Required

**Path Parameters**:
- `date`: YYYY-MM-DD format

**Request Body**:
```json
{
  "sleep_duration_minutes": 480,
  "is_finalized": true,
  "activities": [
    {
      "chapter_id": "uuid",
      "activity_type": "REVIEW",
      "duration_minutes": 90
    }
  ]
}
```

**Response 200**:
```json
{
  "message": "Daily log updated successfully."
}
```

**Error 403** (Temporal Lock Violation):
```json
{
  "detail": "Cannot edit logs older than the previous week."
}
```

---

## Sub-module 2: Conclusion Plan & Test Analytics

### `GET /api/planner/conclusion-plan/`

**Summary**: Retrieve aggregated conclusion grid data including mastery levels and test records grouped by chapter.

**Auth**: Required (`IsAuthenticated`, Role: `STUDENT`)

**Response 200**:
```json
{
  "results": [
    {
      "chapter": {
        "id": "uuid",
        "title": "فصل اول",
        "chapter_number": 1,
        "source_material": {
          "id": 12,
          "title": "ساختمان داده"
        }
      },
      "mastery_level": 85,
      "test_records": [
        {
          "id": "uuid",
          "test_format": "EVEN",
          "test_method": "FEEDBACK",
          "total_tests": 40,
          "correct_tests": 30,
          "wrong_tests": 5,
          "untested_tests": 5,
          "percentage": 70.83,
          "created_at": "2026-09-20T10:30:00Z",
          "created_at_jalali": "1403/06/29 10:30:00"
        }
      ]
    }
  ]
}
```

---

### `POST /api/planner/conclusion-plan/test-records/`

**Summary**: Create or update test record for a chapter (upsert logic per FR-004).

**Auth**: Required

**Request Body**:
```json
{
  "chapter_id": "uuid",
  "test_format": "EVEN",
  "test_method": "FEEDBACK",
  "total_tests": 40,
  "correct_tests": 30,
  "wrong_tests": 5
}
```

**Response 201/200**:
```json
{
  "id": "uuid",
  "chapter_id": "uuid",
  "test_format": "EVEN",
  "test_method": "FEEDBACK",
  "total_tests": 40,
  "correct_tests": 30,
  "wrong_tests": 5,
  "untested_tests": 5,
  "percentage": 70.83,
  "created_at": "2026-09-20T10:30:00Z",
  "created_at_jalali": "1403/06/29 10:30:00"
}
```

**Note**: `untested_tests` and `percentage` are backend-calculated per FR-003.

---

### `DELETE /api/planner/conclusion-plan/test-records/{id}/`

**Summary**: Delete a specific test record.

**Auth**: Required (Author only)

**Response 204**: No Content

---

### `POST /api/planner/conclusion-plan/mastery/`

**Summary**: Set mastery level for a chapter (upsert logic per FR-005).

**Auth**: Required

**Request Body**:
```json
{
  "chapter_id": "uuid",
  "level": 85
}
```

**Validation**:
- `level` must be between 1 and 100 (FR-006)

**Response 201/200**:
```json
{
  "id": "uuid",
  "chapter_id": "uuid",
  "level": 85,
  "updated_at": "2026-09-20T10:35:00Z",
  "updated_at_jalali": "1403/06/29 10:35:00"
}
```

**Error 400** (Invalid Level):
```json
{
  "level": ["Mastery level must be between 1 and 100."]
}
```

---

### `DELETE /api/planner/conclusion-plan/mastery/{chapter_id}/`

**Summary**: Remove mastery level for a chapter.

**Auth**: Required (Author only)

**Response 204**: No Content

---

## Sub-module 1: Performed Weekly Plan (Read-Only)

### `GET /api/planner/weekly-performance/`

**Summary**: Retrieve aggregated weekly performance dynamically joining StudyActivity and TestRecord data.

**Auth**: Required (`IsAuthenticated`)

**Query Parameters**:
- `week_start` (optional): YYYY-MM-DD (defaults to current week)

**Response 200**:
```json
{
  "week_start": "2026-09-20",
  "week_end": "2026-09-26",
  "total_read_time_minutes": 120,
  "total_review_time_minutes": 45,
  "total_test_count": 50,
  "chapter_records": [
    {
      "chapter_id": "uuid",
      "chapter_title": "گراف",
      "source_material_title": "گسسته",
      "read_time_minutes": 60,
      "review_time_minutes": 30,
      "test_count": 50
    }
  ]
}
```

**Note**: This is a read-only endpoint. Modifications must be done via Sub-module 5 (time) and Sub-module 2 (tests) per FR-007.

---

## Sub-module 3: Dashboard & Student Tools

### `GET /api/planner/dashboard/summary/`

**Summary**: Retrieve aggregated dashboard data (motivational quote, countdown, records, tasks).

**Auth**: Required (`IsAuthenticated`, Role: `STUDENT`)

**Response 200**:
```json
{
  "quote": "شروع کردن و تسلیم نشدن...",
  "countdown": {
    "target_name": "آزمون ارشد",
    "days": 227,
    "hours": 7,
    "minutes": 15
  },
  "records": {
    "total_study_hours": "120:30",
    "max_daily_study": "08:15",
    "total_tests": 1450,
    "max_daily_tests": 120
  },
  "today_tasks": {
    "has_reviews": false,
    "has_studies": false
  }
}
```

---

### `GET /api/planner/dashboard/notes/`

**Summary**: Retrieve daily note for current date.

**Auth**: Required

**Query Parameters**:
- `date` (optional): YYYY-MM-DD (defaults to today)

**Response 200**:
```json
{
  "id": "uuid",
  "date": "2026-09-20",
  "date_jalali": "1403/06/29",
  "text": "یادداشت امروز من..."
}
```

**Response 404** (No note for date):
```json
{
  "detail": "Not found."
}
```

---

### `POST /api/planner/dashboard/notes/`

**Summary**: Upsert today's daily note (FR-009: updates if exists, creates if not).

**Auth**: Required

**Request Body**:
```json
{
  "text": "یادداشت شما ..."
}
```

**Response 200/201**:
```json
{
  "id": "uuid",
  "date": "2026-09-20",
  "date_jalali": "1403/06/29",
  "text": "یادداشت شما ..."
}
```

---

### `POST /api/planner/dashboard/consultations/`

**Summary**: Book a weekly consultation slot.

**Auth**: Required

**Request Body**:
```json
{
  "day_of_week": 1,
  "time_slot": "09:00:00"
}
```

**Validation**:
- `day_of_week`: 1-7 (1=Monday, 7=Sunday)
- `time_slot`: HH:MM:SS format

**Response 201**:
```json
{
  "id": "uuid",
  "day_of_week": 1,
  "time_slot": "09:00:00",
  "created_at": "2026-09-20T10:40:00Z"
}
```

---

## Sub-module 6: Reports

### `GET /api/planner/reports/weekly/`

**Summary**: Generate scheduled weekly study plan report.

**Auth**: Required (`IsAuthenticated`, Role: `STUDENT`)

**Query Parameters**:
- `week_id` (optional): Integer
- `start_date` (optional): YYYY-MM-DD
- `end_date` (optional): YYYY-MM-DD
- `format` (optional): `json` | `pdf` (default: `json`)

**Alternative**: Use `Accept` header (`application/json` or `application/pdf`)

**Response 200 (JSON)**:
```json
{
  "report_title": "گزارش برنامه هفتگی روزانه",
  "week_start": "2026-09-20",
  "week_end": "2026-09-26",
  "generated_at": "2026-09-23T11:00:00Z",
  "generated_at_jalali": "1403/07/02 11:00:00",
  "data": {
    "chapters": [
      {
        "chapter_title": "گراف",
        "allocated_minutes": 120
      }
    ]
  }
}
```

**Response 200 (PDF)**:
- Content-Type: `application/pdf`
- Binary PDF stream
- RTL Persian text with IRANSans font (FR-012)

---

### `GET /api/planner/reports/performed/`

**Summary**: Generate performed weekly study report.

**Auth**: Required

**Query Parameters**: Same as `/weekly/`

**Response**: Same structure as `/weekly/`

---

### `GET /api/planner/reports/conclusion/`

**Summary**: Generate conclusion/summary report (mastery and test percentages).

**Auth**: Required

**Query Parameters**: Same as `/weekly/`

**Response**: Same structure as `/weekly/`

---

### `GET /api/planner/reports/full/`

**Summary**: Generate comprehensive report combining Weekly, Performed, and Conclusion data.

**Auth**: Required

**Query Parameters**: Same as `/weekly/`

**Response 200 (JSON)**:
```json
{
  "report_title": "گزارش کامل",
  "week_start": "2026-09-20",
  "week_end": "2026-09-26",
  "generated_at": "2026-09-23T11:00:00Z",
  "scheduled_data": { /* from weekly report */ },
  "performed_data": { /* from performed report */ },
  "conclusion_data": { /* from conclusion report */ }
}
```

**Note**: All report endpoints use `CoreAnalyticsEngine` for data aggregation (FR-013) to ensure consistency.

---

## Sub-module 7: Student Analytics

### `GET /api/planner/analytics/total-activity/`

**Summary**: Return time-series data for overall study time (reading, reviewing, testing).

**Auth**: Required (Role: `STUDENT`)

**Query Parameters**:
- `start_date` (optional): YYYY-MM-DD
- `end_date` (optional): YYYY-MM-DD
- `interval` (required): `daily` | `weekly` | `monthly` | `3-month` | `6-month` | `1-year` | `all`

**Response 200**:
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

**Note**: Values in datasets are in hours (converted from minutes). Frontend must apply Persian number formatting using `toPersianNumber()` utility.

---

### `GET /api/planner/analytics/course-averages/`

**Summary**: Return average metrics per chapter (percent score, time per test, time per page).

**Auth**: Required

**Query Parameters**:
- `start_date` (optional): YYYY-MM-DD
- `end_date` (optional): YYYY-MM-DD
- `metric_type` (required): `percent` | `time_per_test` | `time_per_read_page` | `time_per_review_page`

**Response 200**:
```json
{
  "metric": "time_per_test",
  "unit": "minutes",
  "labels": ["ساختمان داده", "سیستم عامل", "شبکه"],
  "datasets": [2.5, 1.8, 3.2]
}
```

**Note**: FR-015 - Division by zero handled gracefully (returns 0 or null when `total_tests = 0`).

---

### `GET /api/planner/analytics/time-allocation/`

**Summary**: Return aggregated study time and test counts grouped by course type.

**Auth**: Required

**Query Parameters**:
- `start_date` (optional): YYYY-MM-DD
- `end_date` (optional): YYYY-MM-DD

**Response 200**:
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

---

### `GET /api/planner/analytics/stacked-course-activity/`

**Summary**: Return time allocations per chapter, stacked by activity type.

**Auth**: Required

**Query Parameters**:
- `start_date` (optional): YYYY-MM-DD
- `end_date` (optional): YYYY-MM-DD

**Response 200**:
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

**Note**: FR-016 - Analytics responses cached in Redis with 1-hour TTL. Cache invalidated when student finalizes a new daily log.

**Note**: FR-017 - All analytics endpoints use GET (not POST) to leverage HTTP caching.

---

## TypeScript Types (Frontend Integration)

```typescript
// Sub-module 5
export type ActivityType = 'READING' | 'REVIEW' | 'CLASS';

export interface StudyActivityDTO {
  id?: string;
  chapter_id: string;
  activity_type: ActivityType;
  duration_minutes: number;
}

export interface DailyLogDTO {
  date: string;
  date_jalali: string;
  sleep_duration_minutes: number;
  is_finalized: boolean;
  activities: StudyActivityDTO[];
}

// Sub-module 2
export type TestFormat = 'ALL' | 'EVEN' | 'ODD' | '3K' | '3K_1' | '3K_2' | '4K' | '4K_1' | '4K_2' | '4K_3' | 'HALF_1' | 'HALF_2' | 'IMPORTANT' | 'THIRD_1' | 'THIRD_2' | 'THIRD_3';
export type TestMethod = 'FEEDBACK' | 'WASHBACK';

export interface TestRecordDTO {
  id: string;
  test_format: TestFormat;
  test_method: TestMethod;
  total_tests: number;
  correct_tests: number;
  wrong_tests: number;
  untested_tests: number;
  percentage: number;
  created_at: string;
  created_at_jalali: string;
}

export interface ChapterMasteryDTO {
  id: string;
  chapter_id: string;
  level: number;
  updated_at: string;
  updated_at_jalali: string;
}

// Sub-module 1
export interface ChapterRecordDTO {
  chapter_id: string;
  chapter_title: string;
  source_material_title: string;
  read_time_minutes: number;
  review_time_minutes: number;
  test_count: number;
}

export interface WeeklyPerformanceDTO {
  week_start: string;
  week_end: string;
  total_read_time_minutes: number;
  total_review_time_minutes: number;
  total_test_count: number;
  chapter_records: ChapterRecordDTO[];
}

// Sub-module 3
export interface DashboardSummaryDTO {
  quote: string;
  countdown: {
    target_name: string;
    days: number;
    hours: number;
    minutes: number;
  };
  records: {
    total_study_hours: string;
    max_daily_study: string;
    total_tests: number;
    max_daily_tests: number;
  };
  today_tasks: {
    has_reviews: boolean;
    has_studies: boolean;
  };
}

export interface DailyNoteDTO {
  id: string;
  date: string;
  date_jalali: string;
  text: string;
}

export interface ConsultationBookingDTO {
  id: string;
  day_of_week: number;
  time_slot: string;
  created_at: string;
}

// Sub-module 6
export type ReportFormat = 'json' | 'pdf';

export interface ReportBaseDTO {
  report_title: string;
  week_start: string;
  week_end: string;
  generated_at: string;
  generated_at_jalali: string;
}

export interface FullReportDTO extends ReportBaseDTO {
  scheduled_data: any;
  performed_data: any;
  conclusion_data: any;
}

// Sub-module 7
export type Interval = 'daily' | 'weekly' | 'monthly' | '3-month' | '6-month' | '1-year' | 'all';
export type MetricType = 'percent' | 'time_per_test' | 'time_per_read_page' | 'time_per_review_page';

export interface TotalActivityDTO {
  summary: {
    total_read_minutes: number;
    total_review_minutes: number;
    total_test_minutes: number;
    total_overall_minutes: number;
  };
  line_chart: {
    labels: string[];
    datasets: {
      total: number[];
      read: number[];
      review: number[];
      test: number[];
    };
  };
  pie_chart: {
    read: number;
    review: number;
    test: number;
  };
}

export interface CourseAverageDTO {
  metric: string;
  unit: string;
  labels: string[];
  datasets: number[];
}

export interface TimeAllocationDTO {
  bar_chart: {
    labels: string[];
    datasets: number[];
  };
  table_data: Array<{
    course_type: string;
    total_hours: number;
    total_tests: number;
  }>;
  totals: {
    total_hours: number;
    total_tests: number;
  };
}

export interface StackedCourseActivityDTO {
  labels: string[];
  datasets: {
    read: number[];
    review: number[];
    test: number[];
  };
}
```

---

## Performance Notes

- **FR-016**: Analytics endpoints cached in Redis with 1-hour TTL for standard queries
- **FR-019**: Dashboard summary should be optimized (or briefly cached) to ensure fast page load
- **N+1 Prevention**: All endpoints use `select_related()` and `prefetch_related()` appropriately
- **Response Times**: Dashboard/list endpoints target <2s, analytics <500ms cached/<3s uncached, reports <5s for PDF generation
