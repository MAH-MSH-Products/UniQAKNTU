# SUB-MODULE 3: Dashboard & Student Tools (داشبورد)

## 2. Module Architectures

**Module ID:** `student-dashboard`
**App Name (Django):** `planner` 
**Domain Boundary:** This module serves as the central presentation hub for the student. It manages personal dashboard utilities including the Daily Personal Note, Consultation Bookings, and high-level summary statistics (Motivational Quote, Exam Countdown). 
*Crucial Boundary Resolution:* To prevent domain overlap, this module **does not own or manage** the Community Opinions or the Leaderboard backend logic. The Dashboard frontend will simply act as a consumer, rendering UI widgets that fetch data from the `community` endpoints (owned entirely by Sub-module 4).

**Layers:**
* **Domain:** `DailyNote`, `ConsultationBooking`, `DashboardSummary` (Virtual)
* **Application:** Aggregation services for dashboard top-level statistics (e.g., fetching total hours/tests from Sub-module 5 and Sub-module 2 to show in summary cards).
* **Infrastructure:** PostgreSQL relational mapping via Django ORM.
* **Interface:** DRF Views/Serializers (`/api/planner/dashboard/`), React SPA (`StudentDashboard.jsx`).

**Data Model (Django `planner` app):**

1. `DailyNote`:
* `id`: UUID / PK
* `student`: ForeignKey to `accounts.User` (Role: STUDENT)
* `date`: DateField (Unique per student per day)
* `text`: TextField

2. `ConsultationBooking`:
* `id`: UUID / PK
* `student`: ForeignKey to `accounts.User` (Role: STUDENT)
* `day_of_week`: Integer (1 to 7)
* `time_slot`: TimeField
* `created_at`: DateTimeField

**Folder Placement:**
* Backend: `backend/apps/planner/views/dashboard_views.py`
* Frontend: `frontend/src/pages/student/dashboard/StudentDashboard.jsx`

**Naming Conventions Table:**

| Concept | Backend (Django) | Frontend (React) | Database (PostgreSQL) | API Contract |
| --- | --- | --- | --- | --- |
| Dashboard Summary | `DashboardAggregator` | `DashboardSummary` | N/A (Aggregated) | `dashboard/summary` |
| Daily Note | `DailyNote` | `DailyNoteWidget` | `planner_dailynote` | `dashboard/notes` |
| Consultation | `ConsultationBooking` | `ConsultationWidget` | `planner_consultationbooking` | `dashboard/consultations` |

---

## 3. API Contracts

```markdown
# Student Dashboard API Contract
**Module ID:** `student-dashboard`
**Version:** `v1`
**Base Path:** `/api/planner/dashboard/`
**Owner:** Backend Team

## Endpoints

### `GET /api/planner/dashboard/summary/`
**Summary:** Retrieves aggregated data for the dashboard's top row (Motivational quote, countdown to exam, and high-level user records).
**Auth:** Required (`IsAuthenticated`, Role: `STUDENT`)
**Response 200:**
```json
{
  "quote": "شروع کردن و تسلیم نشدن...",
  "countdown": {
    "target_name": "آزمون ارشد",
    "days": 227, "hours": 7, "minutes": 15
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

### `GET /api/planner/dashboard/notes/`

**Summary:** Retrieves the daily note for the current date.
**Auth:** Required
**Response 200:**

```json
{
  "id": "uuid",
  "date": "2026-09-20",
  "text": "یادداشت امروز من..."
}

```

### `POST /api/planner/dashboard/notes/`

**Summary:** Upsert today's daily note (updates if a note for today already exists).
**Auth:** Required
**Body Schema:**

```json
{
  "text": "یادداشت شما ..."
}

```

**Response 200/201:** Returns the saved `DailyNote` object.

### `POST /api/planner/dashboard/consultations/`

**Summary:** Book a weekly consultation slot.
**Auth:** Required
**Body Schema:**

```json
{
  "day_of_week": 1,
  "time_slot": "09:00:00"
}

```

**Response 201:**

```json
{ "message": "Consultation booked successfully." }

```

## TypeScript Types (Frontend Integration)

```typescript
export interface DashboardSummaryDTO {
  quote: string;
  countdown: { days: number; hours: number; minutes: number; target_name: string };
  records: {
    total_study_hours: string;
    max_daily_study: string;
    total_tests: number;
    max_daily_tests: number;
  };
  today_tasks: { has_reviews: boolean; has_studies: boolean };
}

export interface DailyNoteDTO {
  id: string;
  date: string;
  text: string;
}

```

```

---

## 4. Integration Plan (Delegation TODOs)

### Backend TODOs 
- [ ] **Models:** Implement `DailyNote` and `ConsultationBooking` within the `planner` app. Ensure unique constraints are properly set (e.g., one note per student per day).
- [ ] **Summary Service:** Create a lightweight `DashboardSummaryService` that queries Sub-module 5's tables (for total hours) and Sub-module 2's tables (for total tests) to formulate the `records` object.
- [ ] **Daily Note Upsert:** Implement an upsert (update-or-create) logic in the `POST /notes/` endpoint to ensure a user doesn't create multiple notes for the same physical date. Use the server's timezone-aware current date.
- [ ] **Decoupling:** Ensure *no* Community or Leaderboard models are defined here. Leave social features entirely to the `community` app (Sub-module 4).

### Frontend TODOs 
- [ ] **Routing:** Add `/panel/dashboard` to `App.jsx` protected by `<RequireAuth>`. Configure this as the default redirect path after a successful login.
- [ ] **Component Structure:**
    - Create `StudentDashboard.jsx` as the main container.
    - Extract sub-components for modularity: `<PersonalRecordsWidget/>`, `<StopwatchWidget/>`, `<DailyNoteWidget/>`.
    - Import `<LeaderboardGrid/>` and `<OpinionsList/>` directly from the `community` component folder (to be built in Sub-module 4).
- [ ] **Client-Side Widgets (No Backend required):**
    - Implement the **Stopwatch** entirely in React state (Start, Stop, Reset). Use `useRef` and `setInterval` to prevent the entire Dashboard from re-rendering every second.
    - Implement the **Persian Calendar** using a React-compatible Jalali calendar library (e.g., `react-multi-date-picker` with Persian locale).
- [ ] **API Consumption:** Wire up `getDashboardSummary()`, `getDailyNote()`, and `saveDailyNote()` using the `src/services/api.js` interceptor.
- [ ] **Styling & Assets:** 
    - Utilize the project's native CSS variables and Glassmorphism UI guidelines to style the dashboard cards. Use Flexbox/CSS Grid for responsive layout adjustments (stacking vertically on mobile).

---

## 6. Verification Checklist
- [ ] **Strict Boundary Adherence:** The backend module contains absolutely no logic for leaderboards or user opinions (delegated strictly to Sub-module 4).
- [ ] **Upsert Integrity:** Submitting a daily note multiple times on the same day updates the existing record rather than generating duplicates.
- [ ] **Performance:** The Dashboard Summary query is heavily optimized (or cached briefly) to ensure the homepage loads instantly without executing heavy N+1 counts across the test and time-log tables.
- [ ] **React State Optimization:** The Stopwatch widget isolates its state so that ticking seconds do not trigger React re-renders on sibling components (like the large leaderboard or chart widgets).

```