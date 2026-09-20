# SUB-MODULE 1: Performed Weekly Plan (برنامه هفتگی انجام شده)

## 2. Module Architectures

**Module ID:** `performed-weekly-plan`
**App Name (Django):** `planner`
**Domain Boundary:** Responsible for tracking, aggregating, and displaying a student's actual executed study plan. It tracks reading time, review time, test time, and test counts across various source materials (subjects) on a weekly basis. It does *not* handle the generation of the future study plan, only the reporting of the *performed* plan.

**Layers:**

* **Domain:** `WeeklyPerformance`, `SubjectPerformanceRecord`
* **Application:** Aggregation services to calculate total weekly hours and test counts.
* **Infrastructure:** PostgreSQL relational mapping via Django ORM.
* **Interface:** DRF Views/Serializers (`/api/planner/weekly-performance/`), React SPA (`PerformedWeeklyPlan.jsx`).

**Data Model (Django `planner` app):**

1. `WeeklyPerformance`:
* `id`: UUID / PK
* `student`: ForeignKey to `User` (Role: STUDENT)
* `week_number`: Integer (e.g., 1 for Week 1)
* `start_date`: DateField
* `end_date`: DateField
* *Constraint*: `unique_together = ['student', 'week_number']`


2. `SubjectPerformanceRecord`:
* `id`: UUID / PK
* `weekly_performance`: ForeignKey to `WeeklyPerformance`, related_name=`subject_records`
* `source_material`: ForeignKey to `SourceMaterial` (e.g., Discrete Math, OS)
* `read_time_minutes`: Integer (Default: 0)
* `review_time_minutes`: Integer (Default: 0)
* `test_time_minutes`: Integer (Default: 0)
* `test_count`: Integer (Default: 0)



**Folder Placement:**

* Backend: `backend/apps/planner/`
* Frontend: `frontend/src/pages/planner/PerformedWeeklyPlan/`

**Naming Conventions Table:**

| Concept | Backend (Django) | Frontend (React) | Database (PostgreSQL) | API Contract |
| --- | --- | --- | --- | --- |
| Weekly Plan | `WeeklyPerformance` | `WeeklyPerformance` | `planner_weeklyperformance` | `weekly-performance` |
| Subject Record | `SubjectPerformanceRecord` | `SubjectRecord` | `planner_subjectperformancerecord` | `subject_records` |
| Read Time | `read_time_minutes` | `readTimeMinutes` | `read_time_minutes` | `read_time_minutes` |

---

## 3. API Contracts

```markdown
# Performed Weekly Plan API Contract
**Module ID:** `performed-weekly-plan`
**Version:** `v1`
**Base Path:** `/api/planner/weekly-performance/`
**Owner:** Backend Team (Mohammad Sajjad)

## Conventions
- Naming: snake_case for JSON payloads (DRF default), mapped to camelCase in Frontend Axios transforms.
- Auth: Bearer JWT (Authenticated users only)
- Roles: `STUDENT` (can read/write own), `ADMIN`/`MODERATOR` (can read all).

## Envelope
```json
{
  "count": 1,
  "next": null,
  "previous": null,
  "results": [ ... ]
}

```

## Endpoints

### `GET /api/planner/weekly-performance/`

**Summary:** List all weekly performances for the logged-in student.
**Auth:** Required (`IsAuthenticated`)
**Query Params:** `?week_number=1` (optional)
**Response 200:**

```json
{
  "count": 1,
  "next": null,
  "previous": null,
  "results": [
    {
      "id": "uuid",
      "week_number": 1,
      "start_date_jalali": "1403/07/01",
      "end_date_jalali": "1403/07/07",
      "total_read_time": 120, 
      "total_test_count": 50,
      "subject_records": [
        {
          "id": "uuid",
          "source_material": { "id": 12, "title": "گسسته" },
          "read_time_minutes": 60,
          "review_time_minutes": 30,
          "test_time_minutes": 30,
          "test_count": 50
        }
      ]
    }
  ]
}

```

### `PATCH /api/planner/weekly-performance/{id}/records/{record_id}/`

**Summary:** Update a specific subject record (e.g., updating test count or read time).
**Auth:** Required (Must be author/student)
**Body Schema:**

```json
{
  "read_time_minutes": 90,
  "test_count": 60
}

```

**Response 200:** Returns the updated `SubjectPerformanceRecord` object.

## TypeScript Types (Frontend Integration)

```typescript
export interface SubjectRecordDTO {
  id: string;
  source_material: { id: number; title: string };
  read_time_minutes: number;
  review_time_minutes: number;
  test_time_minutes: number;
  test_count: number;
}

export interface WeeklyPerformanceDTO {
  id: string;
  week_number: number;
  start_date_jalali: string;
  end_date_jalali: string;
  total_read_time: number;
  total_test_count: number;
  subject_records: SubjectRecordDTO[];
}

```

```

---

## 4. Integration Plan (Delegation TODOs)

### Backend TODOs (Assignee: Mohammad Sajjad)
- [ ] **App Creation:** Run `python manage.py startapp planner` inside `backend/apps/`. Add it to `INSTALLED_APPS`.
- [ ] **Models:** Implement `WeeklyPerformance` and `SubjectPerformanceRecord` models in `apps/planner/models.py`. Ensure FK to `accounts.User` and `curriculum.SourceMaterial`.
- [ ] **Signals/Properties:** Add `@property` methods to `WeeklyPerformance` to dynamically calculate `total_read_time`, `total_review_time`, and `total_test_count` based on its related `subject_records`.
- [ ] **Serializers:** Create `WeeklyPerformanceSerializer` and `SubjectPerformanceRecordSerializer` in `serializers.py`. Include nested read-only relations for the source material titles.
- [ ] **Views (ViewSets):** 
    - Create `WeeklyPerformanceViewSet`. Override `get_queryset` so `STUDENT` role only gets their own records, while `ADMIN` gets all.
    - Use DRF `@action` or a nested router to handle `PATCH` updates to specific `subject_records`.
- [ ] **URLs:** Map the ViewSet to `/api/planner/weekly-performance/` in `backend/config/urls.py`.
- [ ] **Documentation:** Create `documentations/planner_models.md` and `documentations/planner_views.md` explaining the aggregation logic.

### Frontend TODOs (Assignee: Mohammad Amin)
- [ ] **Routing:** Add `/schedule/performed-weekly-plan` to `App.jsx` protected by `<RequireAuth>`.
- [ ] **Service Layer:** Update `src/services/api.js` to include:
    - `getWeeklyPerformances()`
    - `updateSubjectRecord(performanceId, recordId, data)`
- [ ] **i18n Localization:** Add translation keys in `fa/translation.json` and `en/translation.json` under the `"planner"` key for table headers (زبان، گسسته، آمار، زمان خواندن، زمان تست).
- [ ] **Component Creation:** 
    - Create `src/pages/student/planner/PerformedWeeklyPlan.jsx`.
    - Create a reusable table component `src/components/planner/PerformanceTable.jsx` replicating the HTML grid from the raw file (using Bootstrap table classes, NOT raw tables).
- [ ] **State Management:** Use `useEffect` to fetch data via `getWeeklyPerformances()`. Group the data by `week_number`.
- [ ] **UI/UX Implementation:**
    - Use the exact color codes from the raw HTML mockup as CSS Variables in `index.css`:
        - `--read-color: #dbf0fe;`
        - `--review-color: #cfebfd;`
        - `--test-color: #c3e7fd;`
    - Replace the raw static table with dynamic `.map()` rendering over `subject_records`.
    - Implement a guide/legend box at the bottom explaining the colors (راهنما).
- [ ] **Dark Mode Compatibility:** Ensure the new CSS variables (`--read-color`, etc.) have high-contrast alternatives inside the `[data-theme="dark"]` block in `index.css`.

---

## 6. Verification Checklist
- [ ] The `planner` app is isolated and does not create circular dependencies with `curriculum` or `wiki`.
- [ ] API strictly returns `_jalali` formatted dates for UI rendering.
- [ ] Frontend successfully displays the grid matching the HTML template's visual hierarchy (Glassmorphism + Bootstrap overrides).
- [ ] Student cannot access or modify another student's `WeeklyPerformance` via the API (Tested via RBAC).
- [ ] API documentation (`API.md`) is updated with the new `/api/planner/` routes.

***

```