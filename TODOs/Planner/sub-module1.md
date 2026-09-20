# SUB-MODULE 1: Performed Weekly Plan (برنامه هفتگی انجام شده)

## 2. Module Architectures

**Module ID:** `performed-weekly-plan`
**App Name (Django):** `planner`
**Domain Boundary:** This module is now strictly a **Read-Only Reporting View**. It is responsible for dynamically aggregating and displaying a student's actual executed study plan. To resolve previous data redundancy issues, it **does not own any database tables** for tracking time or tests. Instead, it acts as a consumer, pulling study durations from Sub-module 5 (`weekly-study-hours`) and test counts/performance from Sub-module 2 (`conclusion-plan`).

**Layers:**
* **Domain:** `WeeklyPerformanceSummary` (Virtual Entity)
* **Application:** `PerformedPlanAggregationService` (Combines data from `StudyActivity` and `TestRecord`).
* **Infrastructure:** PostgreSQL via Django ORM (Read-only `.annotate()` and `.aggregate()` queries).
* **Interface:** DRF Views/Serializers (`/api/planner/weekly-performance/`), React SPA (`PerformedWeeklyPlan.jsx`).

**Data Model (Django `planner` app):**
*No persistent tables.* 
Relies purely on:
1. `StudyActivity` (from Module 5) for `duration` and `activity_type` (READING, REVIEW).
2. `TestRecord` (from Module 2) for `total_tests` and `correct_tests`.
*Note: Granularity is standardized to the `Chapter` level across all modules.*

**Folder Placement:**
* Backend: `backend/apps/planner/services/performed_plan_service.py`
* Frontend: `frontend/src/pages/student/planner/PerformedWeeklyPlan/`

**Naming Conventions Table:**

| Concept | Backend (Django) | Frontend (React) | Database (PostgreSQL) | API Contract |
| --- | --- | --- | --- | --- |
| Weekly Plan | `PerformedPlanAggregator` | `WeeklyPerformance` | N/A (Virtual) | `weekly-performance` |
| Chapter Record | `ChapterPerformanceDTO`| `ChapterRecord` | N/A (Virtual) | `chapter_records` |

---

## 3. API Contracts

```markdown
# Performed Weekly Plan API Contract
**Module ID:** `performed-weekly-plan`
**Version:** `v1`
**Base Path:** `/api/planner/weekly-performance/`
**Owner:** Backend Team 

## Conventions
- Naming: snake_case for JSON payloads.
- Auth: Bearer JWT (Authenticated users only)
- Roles: `STUDENT` (can read own), `ADMIN`/`MODERATOR` (can read all).
- Note: This is a read-only endpoint. Modifications must be done via Module 5 (time) and Module 2 (tests).

## Endpoints

### `GET /api/planner/weekly-performance/`

**Summary:** Retrieves the aggregated weekly performance for the logged-in student.
**Auth:** Required (`IsAuthenticated`)
**Query Params:** `?week_start=YYYY-MM-DD` (optional, defaults to current week)
**Response 200:**

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

## TypeScript Types (Frontend Integration)

```typescript
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

```

```

---

## 4. Integration Plan (Delegation TODOs)

### Backend TODOs 
- [ ] **Architecture Refactor:** Remove the old `WeeklyPerformance` and `SubjectPerformanceRecord` models to prevent data duplication.
- [ ] **Aggregation Service:** Create `PerformedPlanAggregationService`. This service must group `StudyActivity` records (filtered by the requested week) and left-join them with `TestRecord` data for the same `Chapter` and timeframe.
- [ ] **Views:** Implement a single `GET` endpoint. Remove the previous `PATCH` endpoint, as updates are now strictly handled by Sub-module 5 (for time) and Sub-module 2 (for tests).

### Frontend TODOs 
- [ ] **Routing:** Add `/schedule/performed-weekly-plan` to `App.jsx` protected by `<RequireAuth>`.
- [ ] **Service Layer:** Implement `getWeeklyPerformances(weekStart)` in `api.js`. Remove any `update` functions.
- [ ] **Component Refactor:** Convert the `PerformedWeeklyPlan` UI into a strictly read-only data grid. Remove any inline input fields for editing time or test counts.
- [ ] **UI/UX:** Add a clear call-to-action (CTA) message at the top of the page informing the user: *"To edit your study times, please visit the [Daily Schedule] page. To edit test results, visit the [Conclusion Plan] page."*

---

## 6. Verification Checklist
- [ ] Database has a Single Source of Truth: No redundant tables exist for tracking performed plans.
- [ ] API successfully joins and aggregates data from `StudyActivity` and `TestRecord` dynamically.
- [ ] Frontend strictly renders a read-only view.
- [ ] Granularity correctly matches the `Chapter` level to ensure consistency with Module 2 and Module 5.

```

