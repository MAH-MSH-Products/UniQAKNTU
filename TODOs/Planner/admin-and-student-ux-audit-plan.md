# AUDIT & IMPLEMENTATION PLAN: Sub-modules 1 to 7 Admin & Student Experience

**Status:** Plan & Tasks Generated  
**Target File:** `TODOs/Planner/admin-and-student-ux-audit-plan.md`  
**Related Specs:** `sub-module1.md` through `sub-module7.md`  
**Execution Standard:** `/speckit-plan` & `/speckit-tasks`

---

## 1. Executive Summary & Audit Overview

A comprehensive architectural and user experience audit of **Sub-modules 1 to 7** was performed to determine if:
1. **Student Needs are met:** Seamless tracking of study time, test accuracy, mastery levels, dashboard widgets, community gamification, reporting, and statistical analytics.
2. **Admin/Instructor Needs are met:** Full control over courses, books, chapters, content moderation, student consultation bookings, and advisor oversight.

### Key Audit Findings

| Sub-module | Domain | Student Status | Admin Status | Core Problem Identified |
|---|---|---|---|---|
| **Sub-module 1** | Performed Weekly Plan | **Complete** (Read-Only) | **Incomplete** | Admin/Advisor cannot view a specific student's weekly performance. |
| **Sub-module 2** | Conclusion Plan & Test Analytics | **Complete** | **Broken Dependency** | **CRITICAL:** Admin cannot create or edit `Chapters` in the UI or via REST API. If books have no chapters, students cannot add test records or mastery! |
| **Sub-module 3** | Student Dashboard & Tools | **Complete** | **Incomplete** | Student can book consultations, but Admin/Advisor has NO interface or API to view, approve, or manage booked sessions. Quotes/countdown are hardcoded. |
| **Sub-module 4** | Community & Leaderboard | **Complete** | **Broken Moderation** | **CRITICAL:** Opinions are submitted with status `PENDING`, but there is NO moderation API, NO admin UI, and models are not registered in Django admin. Opinions are locked forever! |
| **Sub-module 5** | Weekly Study Hours (Time Tracking) | **Complete** | **Incomplete** | Locked days cannot be unlocked or overridden by an admin if a student has an excuse. Models are missing from Django admin. |
| **Sub-module 6** | Reports & PDF Generation | **Complete** (JSON + PDF) | **Incomplete** | Admin cannot generate or download reports for specific students (`student_id` not supported). |
| **Sub-module 7** | Student Analytics & Charts | **Complete** | **Incomplete** | Admin cannot view analytics for advisees. `SourceMaterial` lacks high-level course set categorization. |

---

## 2. Detailed Gap Analysis

### Gap 1: Chapter Management (Curriculum Management)
- **Impact:** **BLOCKING CRITICAL**
- **Issue:** All planner modules (1, 2, 5, 6, 7) standardize data granularity at the `SourceMaterialChapter` level. In the frontend, admins can create books (`SourceMaterial`) in `SourceMaterialsList.jsx`, but there is **no UI and no REST API** (`POST`, `PUT`, `DELETE`) to add chapters to a book.
- **Consequence:** Newly created books have zero chapters. Students opening `ConclusionPlan` or `HourWeeklyPlan` see "No chapters found for this book" and cannot log study hours or tests.

### Gap 2: Community Opinions Moderation
- **Impact:** **HIGH**
- **Issue:** When students submit thoughts/tips in Sub-module 4, they are saved as `status='PENDING'`. The student feed only shows `APPROVED` opinions. There is no approval/rejection endpoint, no moderation tab in `AdminSupportPanel`, and `backend/community/admin.py` is completely empty.
- **Consequence:** Student opinions are never approved and never appear on the community wall or student dashboard.

### Gap 3: Consultation Sessions Oversight
- **Impact:** **HIGH**
- **Issue:** Students can book consultation time slots in Sub-module 3 (`ConsultationBooking`), but counselors/admins have no screen or API to see who booked which slots, manage meeting status, or view student contact details.
- **Consequence:** Bookings are written to the database without notifying or presenting them to counselors.

### Gap 4: Missing Django Admin Registration
- **Impact:** **MEDIUM-HIGH**
- **Issue:** 
  - `backend/planner/admin.py` does not exist (`DailyStudyLog`, `StudyActivity`, `TestRecord`, `ChapterMastery`, `DailyNote`, `ConsultationBooking` are unregistered).
  - `backend/community/admin.py` is empty (`StudentOpinion`, `OpinionVote` are unregistered).
- **Consequence:** System administrators cannot inspect, correct, or audit study logs, test records, or opinions via Django's standard `/admin/` portal.

### Gap 5: Advisor / Counselor Multi-Student Inspection
- **Impact:** **MEDIUM**
- **Issue:** All reporting views (`/api/planner/reports/*`) and analytics views (`/api/planner/analytics/*`) only filter by `student = request.user`.
- **Consequence:** An academic advisor or admin cannot view or download PDF reports for an advisee by passing `?student_id=<id>`.

---

## 3. Specification & Architectural Plan (`speckit-plan`)

### 3.1 Data Model Adjustments
1. **`qna.SourceMaterial`**:
   - Add `course_type` / `category` field (`CharField`, choices: `'MATH'`, `'SPECIALIZED_1'`, `'SPECIALIZED_2'`, `'GENERAL'`) to enable structured grouping in Analytics (Sub-module 7) and Reports (Sub-module 6).
2. **`planner.ConsultationBooking`**:
   - Add `status` field (`CharField`, choices: `'PENDING'`, `'CONFIRMED'`, `'COMPLETED'`, `'CANCELLED'`, default: `'CONFIRMED'`).
   - Add `notes` field (`TextField`, blank=True) for consultant feedback.
3. **`curriculum.SourceMaterialChapter`**:
   - Ensure explicit ordering field `chapter_number` with unique constraint per `source_material`.

### 3.2 API Contracts for Admin Management

#### A. Chapter Management API (`/api/curriculum/chapters/` or `/api/planner/admin/chapters/`)
- `GET /api/planner/chapters/?source_material_id={id}`: List chapters for a book.
- `POST /api/planner/chapters/`: Create new chapter (Admin/Instructor only).
  - Body: `{"source_material_id": 1, "title": "مباحث گراف", "chapter_number": 1, "page_count": 45}`
- `PUT/PATCH /api/planner/chapters/{id}/`: Update chapter title, number, or page count.
- `DELETE /api/planner/chapters/{id}/`: Delete chapter (with safeguard against deleting chapters having study logs).

#### B. Opinion Moderation API (`/api/community/admin/opinions/`)
- `GET /api/community/admin/opinions/?status=PENDING`: List opinions awaiting review.
- `POST /api/community/admin/opinions/{id}/moderate/`:
  - Body: `{"action": "APPROVE" | "REJECT"}`
  - Updates opinion status to `APPROVED` or `REJECTED`.

#### C. Consultation Management API (`/api/planner/admin/consultations/`)
- `GET /api/planner/admin/consultations/`: List all booked consultations with student profile data.
- `PATCH /api/planner/admin/consultations/{id}/`: Update booking status (`COMPLETED`, `CANCELLED`) or notes.

#### D. Advisor Student Reports & Analytics Override
- Update `ReportViewSet`, `TotalActivityAnalyticsView`, `CourseAveragesAnalyticsView`, `TimeAllocationAnalyticsView`, `StackedCourseActivityAnalyticsView`:
  - If `request.user.is_staff` or `request.user.role in ['ADMIN', 'INSTRUCTOR']` and `?student_id={id}` is provided, fetch data for the target student rather than `request.user`.

---

## 4. Actionable Task Breakdown (`speckit-tasks`)

### Phase 1: Core Admin Registration (Django Admin)
- [X] T001 [P] Create `backend/planner/admin.py` and register `DailyStudyLog`, `StudyActivity`, `TestRecord`, `ChapterMastery`, `DailyNote`, and `ConsultationBooking` with searchable, filterable admin classes in `backend/planner/admin.py`.
- [X] T002 [P] Update `backend/community/admin.py` to register `StudentOpinion` and `OpinionVote` with list filters for `status` and `is_anonymous` in `backend/community/admin.py`.

### Phase 2: Chapter Management (Backend & Frontend)
- [X] T003 [US1] Implement CRUD REST endpoints for `SourceMaterialChapter` supporting `GET`, `POST`, `PUT`, `DELETE` with permission `IsAdminUser | IsInstructor` in `backend/planner/views.py` (or `backend/curriculum/views.py`) and `backend/planner/urls.py`.
- [X] T004 [US1] Add `SourceMaterialChapterSerializer` write-capabilities (validating unique `source_material` + `chapter_number`) in `backend/planner/serializers.py`.
- [X] T005 [P] [US1] Add chapter API methods (`createChapter`, `updateChapter`, `deleteChapter`) in `frontend/src/services/api.js`.
- [X] T006 [US1] Create `ChapterManagerModal.jsx` allowing admins to view, add, edit, and delete chapters directly from `SourceMaterialsList.jsx` in `frontend/src/pages/SourceMaterialsList.jsx`.
- [X] T007 [P] [US1] Add translation strings for chapter management in `frontend/src/locales/fa/translation.json` and `frontend/src/locales/en/translation.json`.

### Phase 3: Opinion Moderation (Backend & Frontend)
- [X] T008 [US2] Implement `AdminOpinionListView` and `AdminOpinionModerateView` (`POST /api/community/admin/opinions/{id}/moderate/`) in `backend/community/views.py` and `backend/community/urls.py`.
- [X] T009 [P] [US2] Add opinion moderation API methods (`getAdminPendingOpinions`, `moderateOpinion`) in `frontend/src/services/api.js`.
- [X] T010 [US2] Add a "نظرات دانشجویان (Community Opinions)" moderation tab to `AdminSupportPanel.jsx` in `frontend/src/pages/admin/AdminSupportPanel.jsx` allowing instant approval or rejection.
- [X] T011 [P] [US2] Add translation strings for opinion moderation in `frontend/src/locales/fa/translation.json` and `frontend/src/locales/en/translation.json`.

### Phase 4: Consultation Sessions Oversight (Advisor & Student)
- [X] T012 [US3] Add `status` ('PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED') and `notes` fields to `ConsultationBooking` in `backend/planner/models.py` and generate migration.
- [X] T013 [US3] Implement `AdminConsultationListView` and `AdminConsultationUpdateView` (`/api/planner/admin/consultations/`) in `backend/planner/views.py` and `backend/planner/urls.py`.
- [X] T014 [P] [US3] Add consultation admin API methods (`getAdminConsultations`, `updateConsultationStatus`) in `frontend/src/services/api.js`.
- [X] T015 [US3] Add a "جلسات مشاوره (Consultation Bookings)" tab to `AdminSupportPanel.jsx` in `frontend/src/pages/admin/AdminSupportPanel.jsx`.
- [X] T016 [US3] Update `ConsultationWidget.jsx` in `frontend/src/pages/student/dashboard/StudentDashboard.jsx` to display the student's active bookings and cancellation option.

### Phase 5: Advisor Student Inspection (Reports & Analytics)
- [X] T017 [US4] Update `ReportViewSet` (`weekly`, `performed`, `conclusion`, `full`) to allow staff/instructors to pass `?student_id={id}` in `backend/planner/views.py`.
- [X] T018 [US4] Update Analytics views (`total-activity`, `course-averages`, `time-allocation`, `stacked-course-activity`) to allow staff/instructors to inspect advisee data via `?student_id={id}` in `backend/planner/views.py`.
- [X] T019 [US4] Add automated tests for advisor access and role verification in `backend/planner/tests.py`.

### Phase 6: System Verification & E2E Validation
- [X] T020 Run `npx oxlint` across modified frontend components to ensure 0 lint errors.
- [X] T021 Run `npm run build` in `frontend` to guarantee production build integrity.
- [X] T022 Run `python manage.py test` to ensure all 156+ unit/integration tests pass.

---

## 5. Summary of User Experience Impact

Once this plan is executed:
1. **Admins and Instructors will have complete authority:**
   - They can add courses/books and immediately populate their chapters with page counts without leaving the web application.
   - They can review, approve, or reject student opinions from the Admin Support Panel.
   - They can see all booked student consultation appointments, view student profiles, and manage sessions.
   - They can inspect any student's weekly study hours, test progress, and PDF reports for academic counseling.
   - All planner and community records will be fully accessible in Django Admin.
2. **Students will experience zero blockers:**
   - Books will always have structured chapters, preventing empty dropdowns in test and time logging.
   - Submitted opinions will be actively reviewed and displayed on the leaderboard/dashboard.
   - Consultations will provide clear booking feedback and session tracking.
