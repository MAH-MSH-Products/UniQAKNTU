# Feature Specification: Planner Module

**Feature Branch**: `001-planner-module`

**Created**: 2026-09-23

**Status**: Draft

**Input**: User description: "Read all files in the TODOs/Planner directory (sub-module1.md through sub-module7.md) and API_SPRINT2.md. Use them as the authoritative specification for the Planner module. The module must implement:
- Weekly Study Hours (time tracking, temporal locking)
- Conclusion Plan & Test Analytics (test records, mastery levels)
- Performed Weekly Plan (read-only aggregation)
- Dashboard & Student Tools (daily notes, consultations, summary)
- Reports (JSON/PDF export via CoreAnalyticsEngine)
- Student Analytics (chart data via CoreAnalyticsEngine)
- Community & Leaderboard (opinions, voting, Redis-cached leaderboard)
Ensure strict domain boundaries as described in the files. The backend app is `planner`, and the frontend routes are under `/panel/dashboard`, `/schedule/...`, and `/reports`."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Track Weekly Study Hours (Priority: P1)

**As a** student preparing for graduate entrance exams,  
**I want to** log my daily study activities (reading, review, class attendance) by chapter and track sleep duration,  
**So that** I can monitor my time allocation and ensure I'm meeting my study targets while maintaining healthy sleep habits.

**Why this priority**: This is the foundational data capture mechanism. Without accurate time tracking, all downstream analytics, reports, and leaderboard rankings become meaningless. This delivers immediate value: students can start logging their activities on day one.

**Independent Test**: A student can successfully log 3 study activities (2 hours reading Chapter 1 of Discrete Math, 1 hour reviewing Chapter 2 of OS, 8 hours sleep) for today, finalize the day, and see the data reflected in a read-only summary view. The system prevents editing logs older than the previous week.

**Acceptance Scenarios**:

1. **Given** a student is on the current week's daily log form, **When** they select a chapter, activity type (READING/REVIEW/CLASS), enter duration in HH:MM format, and submit, **Then** the activity is saved and appears in the activities list with duration converted to minutes.
2. **Given** a student tries to edit a daily log from 15 days ago, **When** they attempt to save changes, **Then** the system returns a 403 error with message "Cannot edit logs older than the previous week."
3. **Given** a student has logged activities for a day and marks it as finalized, **When** they view the weekly overview, **Then** that day shows a "Finalized" badge and is locked from further editing until un-finalized.

---

### User Story 2 - Record Test Performance and Mastery (Priority: P1)

**As a** student,  
**I want to** record my test results (total questions, correct answers, wrong answers) for each chapter using different test formats (ALL, EVEN, ODD, etc.) and assessment methods (FEEDBACK, WASHBACK),  
**So that** I can track my mastery level and identify weak areas requiring more practice.

**Why this priority**: Test performance tracking is equally fundamental as time tracking. It provides objective mastery metrics and is required for the conclusion grid, reports, and analytics. Like P1 Story 1, this can be independently developed and tested without other features.

**Independent Test**: A student can create a test record for Chapter 3 of Data Structures with format "EVEN", method "FEEDBACK", 40 total questions, 30 correct, 5 wrong. The system calculates percentage as ((30*3 - 5) / (40*3)) * 100 = 70.83% and untested as 5. The student can also set a self-assessed mastery level of 75% for that chapter.

**Acceptance Scenarios**:

1. **Given** a student submits a test record with total=40, correct=30, wrong=5, **When** the backend processes it, **Then** it calculates percentage=70.83, untested=5, and stores the record.
2. **Given** a student submits a test record for the same chapter, format, and method that already exists, **When** the upsert logic executes, **Then** the existing record is updated rather than creating a duplicate (violating unique constraint).
3. **Given** a student sets mastery level to 105, **When** validation runs, **Then** the system rejects it with error "Mastery level must be between 1 and 100."

---

### User Story 3 - View Aggregated Weekly Performance (Priority: P2)

**As a** student,  
**I want to** view a consolidated read-only report of my actual weekly performance combining time spent and tests completed per chapter,  
**So that** I can compare my planned vs. performed activities without duplicate data entry.

**Why this priority**: This is the first consumer of P1 data. It demonstrates the value of logging by aggregating time and test data into actionable insights. It depends on Stories 1 and 2 being completed first but can be independently tested once their data exists.

**Independent Test**: Given a student has logged 120 minutes reading and 45 minutes review for "Graph Theory" chapter, and completed 50 tests, when they view the Performed Weekly Plan for that week, then the summary shows total_read_time=120, total_review_time=45, total_tests=50 for that chapter.

**Acceptance Scenarios**:

1. **Given** a student has logged activities and tests across multiple chapters in week of Sep 20-26, **When** they request `GET /api/planner/weekly-performance/?week_start=2026-09-20`, **Then** the response aggregates all StudyActivity durations and TestRecord counts grouped by chapter.
2. **Given** a student clicks "Edit" on the Performed Weekly Plan page, **When** the UI renders, **Then** a clear message appears: "To edit study times, visit Daily Schedule. To edit test results, visit Conclusion Plan" with clickable links.
3. **Given** the backend aggregation service is called, **When** it queries StudyActivity and TestRecord tables, **Then** it uses read-only `.annotate()` and `.aggregate()` methods without creating or updating any database records.

---

### User Story 4 - Access Personalized Dashboard Hub (Priority: P2)

**As a** student,  
**I want to** see a centralized dashboard showing motivational quotes, exam countdown, personal records (max daily study hours/tests), today's note, consultation bookings, leaderboard, and community opinions,  
**So that** I have a single entry point to monitor progress and stay motivated.

**Why this priority**: The dashboard is the user's home base and increases engagement by surfacing key metrics and social features. It depends on time/test data from P1 stories for the records widget, but the note and consultation features can be independently developed.

**Independent Test**: A student can save a daily note "Finished Graph Theory chapter today", view the dashboard summary showing total_study_hours="120:30" and max_daily_study="08:15" (fetched from StudyActivity aggregations), and see today's tasks widget correctly reflecting whether they have pending reviews or studies.

**Acceptance Scenarios**:

1. **Given** a student opens the dashboard for the first time today, **When** the page loads, **Then** it displays a motivational Persian quote, countdown to target exam (days/hours/minutes), and high-level records aggregated from planner data.
2. **Given** a student types a daily note and saves it multiple times on the same day, **When** the upsert logic executes, **Then** only one DailyNote record exists for that student-date combination (updated, not duplicated).
3. **Given** a student books a consultation for "Monday 09:00", **When** they submit, **Then** a ConsultationBooking record is created with day_of_week=1 and time_slot="09:00:00".

---

### User Story 5 - Generate and Export Study Reports (Priority: P3)

**As a** student,  
**I want to** generate structured reports (Weekly, Performed, Conclusion, Full) in JSON or PDF format for any date range,  
**So that** I can review my progress offline or share achievements with mentors.

**Why this priority**: Reports are valuable but not critical for daily operations. They depend on the CoreAnalyticsEngine being implemented and consume data from all P1/P2 stories. This is a natural next step after the core tracking features stabilize.

**Independent Test**: A student selects "Full Report" for week Sep 20-26, chooses PDF format, clicks Download, and receives a properly formatted PDF with RTL Persian text showing scheduled plan, performed activities, and conclusion grid data in three sections.

**Acceptance Scenarios**:

1. **Given** a student requests `GET /api/planner/reports/weekly/?week_id=1&format=json`, **When** the endpoint processes it, **Then** it returns structured JSON with report_title, week_start, week_end, and chapter allocations without hitting the database directly (uses CoreAnalyticsEngine).
2. **Given** a student requests `GET /api/planner/reports/conclusion/?week_id=1` with `Accept: application/pdf` header, **When** the backend generates the PDF, **Then** it renders Persian text correctly in RTL direction using IRANSans font.
3. **Given** the ReportFormattingService calls CoreAnalyticsEngine, **When** fetching aggregated data, **Then** it contains zero duplicate `annotate()` or `aggregate()` logic compared to the Analytics module (DRY principle).

---

### User Story 6 - Visualize Study Analytics with Charts (Priority: P3)

**As a** student,  
**I want to** view interactive charts (line, pie, bar, stacked) showing my study time trends, test performance averages, and time allocation by course,  
**So that** I can identify patterns, optimize my schedule, and understand where to focus more effort.

**Why this priority**: Charts provide visual insights but are non-essential for basic tracking. They depend on the same CoreAnalyticsEngine as reports and require frontend charting library integration. This is a polish feature after core functionality is proven.

**Independent Test**: A student selects "Last 3 Months" interval on the Total Activity chart, and the line chart displays weekly labels on the x-axis with three datasets (total, read, review) showing time trends, accompanied by a pie chart showing the percentage breakdown of activity types.

**Acceptance Scenarios**:

1. **Given** a student requests `GET /api/planner/analytics/total-activity/?interval=weekly&start_date=2026-07-01&end_date=2026-09-23`, **When** the backend processes it, **Then** it returns labels (week names) and datasets (total/read/review/test in hours) formatted for Chart.js.
2. **Given** CoreAnalyticsEngine calculates `time_per_test = duration_minutes / total_tests` for a chapter with zero tests, **When** division by zero would occur, **Then** the service returns 0 or null gracefully without crashing.
3. **Given** a student changes the date range filter, **When** React Query or SWR refetches the data, **Then** it leverages HTTP caching headers or Redis cache (1-hour TTL) to avoid redundant database queries.

---

### User Story 7 - Engage with Community and Leaderboard (Priority: P3)

**As a** student,  
**I want to** view the top 10 students ranked by study hours and tests, submit anonymous or attributed opinions for community motivation, and vote on others' opinions,  
**So that** I can stay motivated through healthy competition and share experiences with peers.

**Why this priority**: Gamification and social features boost engagement but are not required for core academic tracking. The leaderboard depends on time/test data from P1 stories and requires Redis caching infrastructure. Community opinions are standalone but enhance the platform's stickiness.

**Independent Test**: A student views the leaderboard filtered by "week" period and sees the top 10 students with their ranks, usernames, majors, total study hours, and average daily metrics served from Redis cache in under 50ms. The student submits an anonymous opinion "Six key lessons from my week..." which enters PENDING status for moderator approval.

**Acceptance Scenarios**:

1. **Given** a Celery Beat task runs hourly, **When** it aggregates StudyActivity and TestRecord data, **Then** it calculates top 10 students for day/week/month/three_months periods and stores serialized JSON in Redis keys like `leaderboard:week`.
2. **Given** 50 students simultaneously vote on the same opinion, **When** the vote endpoint uses Django F() expressions for atomic updates, **Then** the final likes/dislikes counts are accurate without race condition corruption.
3. **Given** a student submits an opinion with is_anonymous=true, **When** the API serializes the response, **Then** the author field is null/stripped before sending to the frontend.

---

### Edge Cases

- **What happens when** a student tries to log more than 24 hours of activities for a single day?  
  → Frontend validation prevents duration inputs exceeding 24 hours total; backend returns 400 if validation is bypassed.

- **What happens when** a student finalizes a day, then tries to unfinalizeand edit it after the temporal lock window expires?  
  → The temporal validation service checks the date against current week and previous week boundaries; if outside, returns 403 "Cannot edit logs older than the previous week."

- **What happens when** a student deletes all test records for a chapter but a mastery level still exists?  
  → The mastery level persists independently; it's a self-assessment, not calculated from tests. The Conclusion Grid shows the mastery level with no test records listed.

- **What happens when** the leaderboard Celery task fails or Redis is down?  
  → The leaderboard endpoint attempts to read from Redis; if unavailable, it returns a cached stale version or fallback error message "Leaderboard temporarily unavailable." It never falls back to live PostgreSQL queries (to prevent performance degradation).

- **What happens when** a student requests a report or chart for a date range with zero data?  
  → The CoreAnalyticsEngine returns empty arrays/zero sums; the frontend displays "No data available for selected period" rather than breaking or showing confusing empty charts.

- **What happens when** two students have identical study hours and test counts in the leaderboard?  
  → Ties are resolved by a secondary sort on `user_id` (deterministic) or `created_at` (earliest user ranked higher). The ranking logic must be documented and consistent.

- **How does the system handle** concurrent updates to the same DailyStudyLog from multiple browser tabs?  
  → Django ORM optimistic locking is not enforced by default; last write wins. If critical, add a `version` field and implement optimistic locking validation, or use database-level advisory locks.

- **How does the system handle** a student changing the chapter association of a StudyActivity after it's been aggregated into reports?  
  → Reports and analytics are calculated on-demand or from cache; editing historical data invalidates relevant caches (Redis keys for leaderboard, analytics cache). The system recalculates on next request.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST allow authenticated students to create, update, and delete StudyActivity records linked to curriculum chapters with activity_type (READING, REVIEW, CLASS) and duration in minutes.
- **FR-002**: System MUST enforce temporal locking: students can only modify DailyStudyLog records within the current week (Sunday-Saturday) or immediately preceding week. Attempts to edit older logs return HTTP 403.
- **FR-003**: System MUST calculate test performance metrics automatically: `percentage = ((correct_tests * 3) - wrong_tests) / (total_tests * 3) * 100` and `untested_tests = total_tests - correct_tests - wrong_tests` upon saving TestRecord.
- **FR-004**: System MUST enforce upsert logic for TestRecord: if a record with the same (student, chapter, test_format, test_method) exists, update it; otherwise create new. This prevents duplicate records violating unique constraints.
- **FR-005**: System MUST enforce upsert logic for ChapterMastery: if a record with the same (student, chapter) exists, update the level; otherwise create new.
- **FR-006**: System MUST validate ChapterMastery level is an integer between 1 and 100 inclusive. Reject values outside this range with HTTP 400.
- **FR-007**: System MUST provide a read-only aggregation endpoint `/api/planner/weekly-performance/` that dynamically joins StudyActivity (for time) and TestRecord (for test counts) grouped by chapter without persisting aggregated data.
- **FR-008**: System MUST provide a dashboard summary endpoint that aggregates total_study_hours, max_daily_study, total_tests, and max_daily_tests from planner data without duplicating aggregation logic.
- **FR-009**: System MUST implement DailyNote with unique constraint (student, date) and upsert behavior: multiple saves on the same date update the existing note rather than creating duplicates.
- **FR-010**: System MUST implement ConsultationBooking allowing students to book weekly time slots with day_of_week (1-7) and time_slot.
- **FR-011**: System MUST generate reports (Weekly, Performed, Conclusion, Full) supporting two response formats: JSON (application/json) and PDF (application/pdf) based on Accept header or ?format=pdf query parameter.
- **FR-012**: System MUST render PDF reports with RTL (right-to-left) Persian text using IRANSans font without visual distortion or text inversion.
- **FR-013**: System MUST implement CoreAnalyticsEngine as a shared service used by both Reports (Sub-module 6) and Analytics (Sub-module 7) to eliminate duplicate aggregation queries and ensure data consistency.
- **FR-014**: System MUST provide analytics endpoints returning chart-ready data (labels, datasets) for: total activity (line/pie), course averages (bar), time allocation (bar/table), and stacked course activity (stacked bar).
- **FR-015**: System MUST handle division-by-zero gracefully in analytics calculations (e.g., time_per_test when total_tests=0) by returning 0 or null without crashing.
- **FR-016**: System MUST cache analytics responses in Redis with 1-hour TTL for standard queries (intervals: weekly, monthly, all) and invalidate cache when a student finalizes a new daily log.
- **FR-017**: System MUST refactor chart data fetching from legacy POST requests to standard RESTful GET requests with query parameters (start_date, end_date, interval) to leverage HTTP caching.
- **FR-018**: System MUST implement a Celery Beat task running hourly to calculate and cache leaderboard data (top 10 students by study hours and tests) for periods: day, week, month, three_months in Redis.
- **FR-019**: System MUST serve leaderboard data exclusively from Redis cache without querying PostgreSQL in the GET endpoint to guarantee sub-50ms response time.
- **FR-020**: System MUST implement StudentOpinion with status workflow (PENDING → APPROVED/REJECTED) and moderation queue accessible to ADMIN/MODERATOR roles.
- **FR-021**: System MUST enforce unique constraint on OpinionVote (opinion, user) and use Django F() expressions for atomic like/dislike counter updates to prevent race conditions.
- **FR-022**: System MUST strip author data from StudentOpinion responses when is_anonymous=true, returning author as null to frontend.
- **FR-023**: System MUST use SourceMaterialChapter (from curriculum app) as the standardized granularity level for all planner modules to ensure consistency.
- **FR-024**: Frontend MUST render all timestamps using the *_jalali fields (Persian calendar) rather than ISO 8601 dates in user-facing interfaces.
- **FR-025**: Frontend MUST restrict the Performed Weekly Plan page to read-only display with clear CTAs directing users to Daily Schedule (for time edits) and Conclusion Plan (for test edits).

### Key Entities *(include if feature involves data)*

- **DailyStudyLog**: Represents a student's log for a single date, tracking sleep duration and finalization status. Related to Student via ForeignKey. Unique per (student, date).
- **StudyActivity**: Represents a single study session within a DailyStudyLog, linking to a Chapter with activity type (READING, REVIEW, CLASS) and duration in minutes. Many activities per log.
- **TestRecord**: Represents test performance for a chapter with format (ALL, EVEN, ODD, etc.), method (FEEDBACK, WASHBACK), total questions, correct/wrong counts, and backend-calculated percentage/untested fields. Unique per (student, chapter, test_format, test_method).
- **ChapterMastery**: Represents a student's self-assessed mastery level (1-100%) for a chapter. Unique per (student, chapter).
- **DailyNote**: Represents a personal note for a specific date. Unique per (student, date).
- **ConsultationBooking**: Represents a recurring weekly consultation booking with day_of_week and time_slot.
- **StudentOpinion**: Represents a user-submitted motivational opinion/review with moderation status (PENDING, APPROVED, REJECTED), optional anonymity, and like/dislike counters.
- **OpinionVote**: Represents a vote (1=like, -1=dislike) cast by a user on an opinion. Unique per (opinion, user).
- **WeeklyPerformanceSummary**: Virtual entity (no table) aggregating StudyActivity and TestRecord data per chapter for a given week.
- **DashboardSummary**: Virtual entity (no table) aggregating motivational quote, exam countdown, personal records, and today's tasks.
- **Report**: Virtual entity (no table) representing formatted study data as JSON or PDF for export.
- **LeaderboardEntry**: Virtual entity (no table) representing cached top-student rankings stored in Redis.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Students can log daily study activities and finalize a day in under 3 minutes with zero data loss or validation errors.
- **SC-002**: The temporal locking mechanism prevents 100% of unauthorized edits to logs older than the previous week (verified via integration tests with various date offsets).
- **SC-003**: Test performance percentage calculations achieve 100% accuracy compared to the formula ((C*3 - W) / (T*3) * 100) across 50 test cases with varying inputs.
- **SC-004**: The Performed Weekly Plan page loads aggregated data for a week containing 7 days × 5 chapters × 3 activity types in under 2 seconds without N+1 query issues.
- **SC-005**: Dashboard summary endpoint responds in under 1 second while aggregating data from StudyActivity, TestRecord, DailyNote, and ConsultationBooking tables.
- **SC-006**: PDF report generation completes within 5 seconds for a full report spanning 12 weeks of data, with Persian text correctly rendered in RTL.
- **SC-007**: Analytics chart endpoints respond in under 500ms for cached queries (Redis hit) and under 3 seconds for cache misses requiring database aggregation.
- **SC-008**: Leaderboard endpoint achieves sub-50ms response time 99% of the time by serving exclusively from Redis cache.
- **SC-009**: Concurrent voting on the same opinion by 100 simultaneous users results in accurate final like/dislike counts with zero race condition corruption (verified via load testing).
- **SC-010**: The CoreAnalyticsEngine eliminates 100% of duplicate aggregation logic between Reports and Analytics modules (verified via code review showing single shared service).
- **SC-011**: Students successfully create, view, vote on, and filter community opinions with pagination supporting 1000+ approved opinions without performance degradation.
- **SC-012**: The system supports 500 concurrent students logging daily activities without database deadlocks or lock contention (verified via stress testing).

## Assumptions

- **Target Users**: Students are tech-savvy enough to use dropdowns, duration inputs (HH:MM format), and understand concepts like "finalize day" and "temporal locking."
- **Data Granularity**: The curriculum app provides or will be extended to include SourceMaterialChapter model for chapter-level tracking. If it doesn't exist, it must be created before planner implementation.
- **Authentication**: JWT Bearer token authentication is already implemented and the frontend AuthContext provides user role and token for all API requests.
- **Existing Infrastructure**: Redis is available in the deployment environment for caching leaderboard and analytics data. Celery Beat is configured for periodic task execution.
- **PDF Library**: The backend environment supports WeasyPrint or pdfkit with required system dependencies (e.g., wkhtmltopdf, Cairo, Pango) and IRANSans Persian font installed.
- **Frontend Framework**: The frontend uses React with react-chartjs-2 for charting, react-router-dom for routing, and Axios for HTTP requests with existing interceptor for auth headers.
- **Persian Localization**: The frontend i18n system (react-i18next or equivalent) is already configured with fa (Farsi) locale support for all UI strings.
- **Timezone**: The backend uses a single timezone (likely Asia/Tehran) consistently across all datetime operations. Jalali calendar conversion utilities are available via a Django package (e.g., jdatetime).
- **Database**: PostgreSQL is the primary database. The planner and community apps use Django ORM with migrations. No direct SQL is required except for complex annotations.
- **Testing Framework**: Backend uses pytest with pytest-django for testing. Frontend uses Jest and React Testing Library. CI pipeline runs tests on every PR.
- **Rollback Strategy**: All migrations include documented rollback plans as per the project constitution. Destructive migrations require explicit approval.
- **Domain Boundaries**: The planner app strictly owns time tracking and aggregation logic. The community app strictly owns social features (opinions, leaderboard). No cross-app model imports; only read-only queries across apps via services.
- **Performance Targets**: Dashboard and list endpoints target <2s response time. Leaderboard targets <50ms via Redis. Reports target <5s for PDF generation. Analytics charts target <500ms for cached, <3s for uncached.
- **Concurrent Users**: The system is designed to support up to 500 concurrent students during peak hours (exam season) without degradation.
- **Data Retention**: Study logs, test records, and opinions are retained indefinitely unless explicitly deleted by the user or purged by admin policy (out of scope for this spec).
