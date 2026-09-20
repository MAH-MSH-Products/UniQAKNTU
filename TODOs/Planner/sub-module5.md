# SUB-MODULE 5: Weekly Study Hours (ثبت ساعت‌های مطالعاتی روزانه/هفتگی)

## 2. Module Architectures

**Module ID:** `weekly-study-hours`
**App Name (Django):** `planner`
**Domain Boundary:** This module is the **Single Source of Truth** for tracking a student's daily and weekly time allocation. It governs the granular tracking of time spent on reading, reviewing, attending classes, and sleeping. 
*Crucial Boundary Resolution:* To prevent data redundancy, this module **does not track test counts or test percentages** (which are strictly owned by Sub-module 2: Conclusion Plan). It also enforces strict temporal business rules (e.g., students can only edit the current and immediately preceding week).

**Layers:**
* **Domain:** `DailyStudyLog`, `StudyActivity`
* **Application:** Time-Locking Validation Service.
* **Infrastructure:** PostgreSQL via Django ORM.
* **Interface:** DRF Views/Serializers (`/api/planner/weekly-hours/`), React SPA (`HourWeeklyPlan.jsx`).

**Data Model (Django `planner` app):**

1. `DailyStudyLog`:
* `id`: UUID / PK
* `student`: ForeignKey to `accounts.User` (Role: STUDENT)
* `date`: DateField
* `sleep_duration`: DurationField (or IntegerField in minutes)
* `is_finalized`: BooleanField (Default: False)
* *Constraint*: `unique_together = ['student', 'date']`

2. `StudyActivity`:
* `id`: UUID / PK
* `daily_log`: ForeignKey to `DailyStudyLog`, `related_name='activities'`
* `activity_type`: CharField/Enum (Choices: 'READING', 'REVIEW', 'CLASS') *(Note: 'TEST' is excluded here to avoid overlap with Module 2)*
* `chapter`: ForeignKey to `curriculum.SourceMaterialChapter` *(Standardized granularity)*
* `duration_minutes`: IntegerField (Default: 0)

**Folder Placement:**
* Backend: `backend/apps/planner/`
* Frontend: `frontend/src/pages/student/planner/HourWeeklyPlan/`

**Naming Conventions Table:**

| Concept | Backend (Django) | Frontend (React) | Database (PostgreSQL) | API Contract |
| --- | --- | --- | --- | --- |
| Daily Log | `DailyStudyLog` | `DailyStudyLog` | `planner_dailystudylog` | `daily-logs` |
| Study Activity | `StudyActivity` | `StudyActivity` | `planner_studyactivity` | `activities` |

---

## 3. API Contracts

```markdown
# Weekly Study Hours API Contract
**Module ID:** `weekly-study-hours`
**Version:** `v1`
**Base Path:** `/api/planner/weekly-hours/`
**Owner:** Backend Team 

## Endpoints

### `GET /api/planner/weekly-hours/current/`
**Summary:** Retrieves the overview of the current tracking week, including the lock status of individual days.
**Auth:** Required (`IsAuthenticated`, Role: `STUDENT`)
**Response 200:**
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

### `GET /api/planner/weekly-hours/daily-logs/{date}/`

**Summary:** Retrieves detailed study activities and sleep time for a specific date.
**Auth:** Required
**Response 200:**

```json
{
  "date": "2026-09-20",
  "sleep_duration_minutes": 480,
  "is_finalized": false,
  "activities": [
    {
      "id": "uuid",
      "chapter_id": "uuid",
      "activity_type": "READING",
      "duration_minutes": 150
    }
  ]
}

```

### `PUT /api/planner/weekly-hours/daily-logs/{date}/`

**Summary:** Upserts the daily study log and its associated activities in bulk. Enforces temporal locking (only current and previous week allowed).
**Auth:** Required
**Body Schema:**

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

**Response 200:**

```json
{ "message": "Daily log updated successfully." }

```

**Error 403:**

```json
{ "error": "Cannot edit logs older than the previous week." }

```

## TypeScript Types (Frontend Integration)

```typescript
export type ActivityType = 'READING' | 'REVIEW' | 'CLASS';

export interface StudyActivityDTO {
  id?: string;
  chapter_id: string;
  activity_type: ActivityType;
  duration_minutes: number;
}

export interface DailyLogDTO {
  date: string;
  sleep_duration_minutes: number;
  is_finalized: boolean;
  activities: StudyActivityDTO[];
}

```

```

---

## 4. Integration Plan (Delegation TODOs)

### Backend TODOs 
- [ ] **Models Definition:** Create `DailyStudyLog` and `StudyActivity` models in `apps/planner/models.py`. 
- [ ] **Granularity Fix:** Ensure the `StudyActivity` model links to `curriculum.SourceMaterialChapter` via `chapter_id`, matching the granularity of Sub-module 2.
- [ ] **Data Cleanup:** Remove any fields related to `test_count` or `test_percentage` from this module's design, as tests are exclusively tracked by the Conclusion Plan module.
- [ ] **Temporal Validation Logic:** Create a validation service (`TimeLockService`) that strictly enforces the deadline rule: users can only modify `DailyStudyLog` records falling within the current active week (Sunday to Saturday) and the immediately preceding week. Attempts to modify older records must raise a `PermissionDenied` (403).
- [ ] **Transactional Upsert:** Implement the `PUT /daily-logs/{date}/` endpoint using `transaction.atomic()`. Wiping and replacing a day's activities must not leave orphaned records if an error occurs mid-request.

### Frontend TODOs 
- [ ] **Routing:** Add `/schedule/hour-weekly-plan` to the React router, protected by `<RequireAuth>`.
- [ ] **Component Structure:**
    - `HourWeeklyPlan.jsx` (Main container).
    - `DailyStatusList.jsx` (Renders the vertical list of days with their "Finalized" or "Locked" status).
    - `DailyLogForm.jsx` (The data entry interface for a specific day, accessed via the edit button).
- [ ] **Duration Input Handling:** Build a custom input component or use a specialized library to handle time durations (`HH:MM` format in UI) cleanly, parsing them to `duration_minutes` (integers) before submission to the backend.
- [ ] **Chapter Dropdown:** Implement a cascading dropdown: first select the `SourceMaterial` (Book/Course), then select the `Chapter`.
- [ ] **Video Modal Integration:** Convert the Bootstrap/jQuery `#helpModal` containing the Plyr.js video into a React-friendly modal. Ensure the video pauses when the modal unmounts.

---

## 6. Verification Checklist
- [ ] **Single Source of Truth:** No test-related data is sent to or stored in this module.
- [ ] **Temporal Security:** API strictly blocks modifications to records older than the previous week.
- [ ] **Atomicity:** Daily activity updates correctly purge old activities for that specific day and insert new ones without duplication or orphaned rows.
- [ ] **Granularity Match:** Dropdowns and payloads successfully utilize `chapter_id` instead of vague course/subject IDs.
- [ ] **Input Constraints:** Frontend restricts time inputs to valid bounds (e.g., impossible to enter 25 hours in a single day).

```