# Tasks: Planner Module

**Feature**: Planner Module (7 Sub-modules for Academic Planning & Tracking)
**Branch**: `001-planner-module`
**Input**: Design documents from `/specs/001-planner-module/`

**Prerequisites**: 
- ✅ curriculum app created and migrated
- plan.md, spec.md, research.md, data-model.md, contracts/ available

**Docker Context**: 
- All Django commands: `docker-compose exec backend python manage.py ...`
- Dependencies: Update `backend/requirements.txt` then `docker-compose build backend`
- Frontend: Standard npm commands in `frontend/` directory

**Organization**: Tasks grouped by user story (P1 → P2 → P3) for independent implementation and testing

---

## Format: `[ID] [P?] [Story] Description`

- **[BACKEND]** or **[FRONTEND]**: Component tag
- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story (US1, US2, US3, US4, US5, US6, US7)
- Include exact file paths in descriptions

---

## Phase 1: Setup & Dependencies

**Purpose**: Install required dependencies and configure infrastructure

### Backend Dependencies

- [ ] T001 [BACKEND] Add `weasyprint>=60.0` to backend/requirements.txt for PDF generation
- [ ] T002 [BACKEND] Rebuild backend container: `docker-compose build backend`
- [ ] T003 [BACKEND] Verify WeasyPrint installation: `docker-compose exec backend python -c "import weasyprint; print(weasyprint.__version__)"`

### Frontend Dependencies

- [ ] T004 [FRONTEND] [P] Add chart dependencies to frontend/package.json: `react-chartjs-2@^5.3.1`, `chart.js@^4.5.1`, `react-multi-date-picker@^4.3.0`
- [ ] T005 [FRONTEND] Install frontend dependencies: `cd frontend && npm install`
- [ ] T006 [FRONTEND] Verify chart.js installation: Check `node_modules/chart.js` exists

### IRANSans Font Setup

- [ ] T007 [BACKEND] [P] Create directory backend/planner/static/fonts/IRANSans/
- [ ] T008 [BACKEND] [P] Add IRANSans font files (IRANSans-Regular.ttf, IRANSans-Bold.ttf, IRANSans-Light.ttf) to backend/planner/static/fonts/IRANSans/

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

### Django Apps Creation

- [ ] T009 [BACKEND] Create planner app structure at backend/planner/ (models.py, views/, services/, serializers.py, urls.py, admin.py, tests/)
- [ ] T010 [BACKEND] Create community app structure at backend/community/ (models.py, views.py, services/, serializers.py, urls.py, admin.py, tasks.py, tests/)
- [ ] T011 [BACKEND] Register planner and community apps in backend/core/settings.py INSTALLED_APPS

### Celery Beat Configuration

- [ ] T012 [BACKEND] Add CELERY_BEAT_SCHEDULE to backend/core/settings.py with hourly leaderboard task schedule `crontab(minute=0)`
- [ ] T013 [BACKEND] Add CELERY_TIMEZONE = 'Asia/Tehran' to backend/core/settings.py
- [ ] T014 [BACKEND] Add Celery Beat service to docker-compose.yml: `command: celery -A core beat --loglevel=info`
- [ ] T015 [BACKEND] Verify Celery Beat service starts: `docker-compose logs celerybeat`

### Shared Services Foundation

- [ ] T016 [BACKEND] [P] Create TimeLockService in backend/planner/services/time_lock_service.py with methods: get_week_boundaries(date_obj), is_date_editable(target_date), validate_or_raise(target_date)
- [ ] T017 [BACKEND] [P] Create CoreAnalyticsEngine in backend/planner/services/core_analytics_engine.py (shared aggregation logic for reports and analytics)
- [ ] T018 [BACKEND] [P] Create PdfExportService in backend/planner/services/pdf_export_service.py with generate_pdf(html_content, css_content) using WeasyPrint

### Frontend Utilities

- [ ] T019 [FRONTEND] [P] Create frontend/src/utils/persianNumbers.js with toPersianNumber(num) function
- [ ] T020 [FRONTEND] [P] Create frontend/src/utils/chartConfig.js with getBaseRTLConfig() for Chart.js RTL configuration
- [ ] T021 [FRONTEND] [P] Update frontend/src/services/api.js to prepare for planner and community endpoints

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Track Weekly Study Hours (Priority: P1) 🎯 MVP

**Goal**: Students can log daily study activities (reading, review, class) by chapter and track sleep duration with temporal locking

**Independent Test**: Log 3 study activities (2h reading, 1h review, 8h sleep) for today, finalize day, see data in summary. System blocks editing logs >1 week old with 403.

### Backend Models (US1)

- [ ] T022 [BACKEND] [P] [US1] Create DailyStudyLog model in backend/planner/models.py with fields: student (FK User), date (DateField), sleep_duration_minutes (PositiveIntegerField, default=0), is_finalized (BooleanField, default=False), created_at, updated_at; unique_together=['student', 'date']; validation: sleep_duration_minutes 0-1440
- [ ] T023 [BACKEND] [P] [US1] Create StudyActivity model in backend/planner/models.py with fields: daily_log (FK DailyStudyLog, related_name='activities'), chapter (FK curriculum.SourceMaterialChapter), activity_type (CharField choices: READING/REVIEW/CLASS), duration_minutes (PositiveIntegerField, default=0), created_at; validation: duration_minutes > 0
- [ ] T024 [BACKEND] [US1] Create migration for DailyStudyLog and StudyActivity: `docker-compose exec backend python manage.py makemigrations planner`
- [ ] T025 [BACKEND] [US1] Apply migration: `docker-compose exec backend python manage.py migrate planner`

### Backend Serializers (US1)

- [ ] T026 [BACKEND] [P] [US1] Create DailyStudyLogSerializer in backend/planner/serializers.py with date_jalali field (using JalaliDateField from core.utils), validate_date() calling TimeLockService.validate_or_raise()
- [ ] T027 [BACKEND] [P] [US1] Create StudyActivitySerializer in backend/planner/serializers.py with nested chapter details

### Backend Views & URLs (US1)

- [ ] T028 [BACKEND] [US1] Create WeeklyHoursViewSet in backend/planner/views/weekly_hours_views.py with endpoints: current_week(), daily_log_detail(), daily_log_update() enforcing temporal locking
- [ ] T029 [BACKEND] [US1] Register WeeklyHoursViewSet in backend/planner/urls.py: `GET /weekly-hours/current/`, `GET /weekly-hours/daily-logs/{date}/`, `PUT /weekly-hours/daily-logs/{date}/`
- [ ] T030 [BACKEND] [US1] Include planner URLs in backend/core/urls.py: `path('api/planner/', include('planner.urls'))`

### Backend Admin (US1)

- [ ] T031 [BACKEND] [P] [US1] Register DailyStudyLog in backend/planner/admin.py with list_display: date, student, is_finalized, sleep_duration_minutes; filters: student, is_finalized, date
- [ ] T032 [BACKEND] [P] [US1] Register StudyActivity in backend/planner/admin.py with list_display: daily_log, chapter, activity_type, duration_minutes; filters: activity_type, daily_log__date

### Backend Tests (US1)

- [ ] T033 [BACKEND] [P] [US1] Create backend/planner/tests/test_temporal_locking.py testing: current_week_editable(), previous_week_editable(), older_than_previous_week_not_editable(), validate_or_raise_failure() per research.md
- [ ] T034 [BACKEND] [P] [US1] Create backend/planner/tests/test_daily_study_log.py testing: create_log(), finalize_day(), unique_constraint(), sleep_validation()
- [ ] T035 [BACKEND] [P] [US1] Run tests: `docker-compose exec backend python manage.py test planner.tests.test_temporal_locking planner.tests.test_daily_study_log`

### Frontend Pages (US1)

- [ ] T036 [FRONTEND] [P] [US1] Create frontend/src/pages/student/planner/HourWeeklyPlan/HourWeeklyPlan.jsx as main container
- [ ] T037 [FRONTEND] [P] [US1] Create frontend/src/pages/student/planner/HourWeeklyPlan/DailyStatusList.jsx showing 7 days with finalized/locked status
- [ ] T038 [FRONTEND] [P] [US1] Create frontend/src/pages/student/planner/HourWeeklyPlan/DailyLogForm.jsx with chapter dropdown, activity type dropdown, duration input (HH:MM), sleep input
- [ ] T039 [FRONTEND] [US1] Add route `/schedule/hour-weekly-plan` to frontend/src/App.jsx protected by <RequireAuth>
- [ ] T040 [FRONTEND] [US1] Wire up API calls in frontend/src/services/api.js: getCurrentWeek(), getDailyLog(date), updateDailyLog(date, data)

### Frontend Translations (US1)

- [ ] T041 [FRONTEND] [P] [US1] Add planner translations to frontend/src/locales/en/translation.json under "planner" namespace
- [ ] T042 [FRONTEND] [P] [US1] Add planner translations to frontend/src/locales/fa/translation.json with Persian strings

**Checkpoint**: User Story 1 complete - students can track weekly study hours with temporal locking ✅

---

## Phase 4: User Story 2 - Record Test Performance and Mastery (Priority: P1)

**Goal**: Students record test results (total, correct, wrong) by chapter with auto-calculated percentages and self-assessed mastery levels

**Independent Test**: Create test record for Chapter 3 with format "EVEN", method "FEEDBACK", 40 total, 30 correct, 5 wrong. System calculates percentage=70.83%, untested=5. Set mastery=75% for chapter.

### Backend Models (US2)

- [ ] T043 [BACKEND] [P] [US2] Create TestRecord model in backend/planner/models.py with fields: student (FK User), chapter (FK SourceMaterialChapter), test_format (CharField choices: ALL/EVEN/ODD/3K/3K_1/3K_2/4K/4K_1/4K_2/4K_3/HALF_1/HALF_2/IMPORTANT/THIRD_1/THIRD_2/THIRD_3), test_method (CharField choices: FEEDBACK/WASHBACK), total_tests (PositiveIntegerField), correct_tests (PositiveIntegerField), wrong_tests (PositiveIntegerField), untested_tests (PositiveIntegerField, editable=False), percentage (DecimalField max_digits=5 decimal_places=2, editable=False), created_at, updated_at; unique_together=['student', 'chapter', 'test_format', 'test_method']; save() calculates: untested_tests = total_tests - correct_tests - wrong_tests, percentage = ((correct_tests * 3) - wrong_tests) / (total_tests * 3) * 100 if total_tests > 0 else 0
- [ ] T044 [BACKEND] [P] [US2] Create ChapterMastery model in backend/planner/models.py with fields: student (FK User), chapter (FK SourceMaterialChapter), level (PositiveSmallIntegerField), created_at, updated_at; unique_together=['student', 'chapter']; validation: level 1-100 inclusive
- [ ] T045 [BACKEND] [US2] Create migration for TestRecord and ChapterMastery: `docker-compose exec backend python manage.py makemigrations planner`
- [ ] T046 [BACKEND] [US2] Apply migration: `docker-compose exec backend python manage.py migrate planner`

### Backend Serializers (US2)

- [ ] T047 [BACKEND] [P] [US2] Create TestRecordSerializer in backend/planner/serializers.py with upsert logic (get_or_create + update pattern), nested chapter details
- [ ] T048 [BACKEND] [P] [US2] Create ChapterMasterySerializer in backend/planner/serializers.py with upsert logic, validate level 1-100

### Backend Views & URLs (US2)

- [ ] T049 [BACKEND] [US2] Create ConclusionPlanViewSet in backend/planner/views/conclusion_views.py with endpoints: conclusion_grid(), create_test_record(), delete_test_record(), set_mastery(), delete_mastery()
- [ ] T050 [BACKEND] [US2] Register ConclusionPlanViewSet in backend/planner/urls.py: `GET /conclusion-plan/`, `POST /conclusion-plan/test-records/`, `DELETE /conclusion-plan/test-records/{id}/`, `POST /conclusion-plan/mastery/`, `DELETE /conclusion-plan/mastery/{chapter_id}/`

### Backend Admin (US2)

- [ ] T051 [BACKEND] [P] [US2] Register TestRecord in backend/planner/admin.py with list_display: student, chapter, test_format, test_method, percentage, created_at; filters: student, test_format, test_method
- [ ] T052 [BACKEND] [P] [US2] Register ChapterMastery in backend/planner/admin.py with list_display: student, chapter, level, updated_at; filters: student

### Backend Tests (US2)

- [ ] T053 [BACKEND] [P] [US2] Create backend/planner/tests/test_calculations.py testing: percentage_calculation_accuracy(), untested_calculation(), division_by_zero_handling() per FR-003 formula
- [ ] T054 [BACKEND] [P] [US2] Create backend/planner/tests/test_test_record.py testing: upsert_logic(), unique_constraint_prevents_duplicates(), mastery_validation_1_to_100()
- [ ] T055 [BACKEND] [P] [US2] Run tests: `docker-compose exec backend python manage.py test planner.tests.test_calculations planner.tests.test_test_record`

### Frontend Pages (US2)

- [ ] T056 [FRONTEND] [P] [US2] Create frontend/src/pages/student/planner/ConclusionPlan/ConclusionPlan.jsx as main container
- [ ] T057 [FRONTEND] [P] [US2] Create frontend/src/pages/student/planner/ConclusionPlan/ConclusionForm.jsx with source material dropdown, chapter dropdown, test format dropdown, test method dropdown, total/correct/wrong inputs, live percentage preview
- [ ] T058 [FRONTEND] [P] [US2] Create frontend/src/pages/student/planner/ConclusionPlan/ConclusionGrid.jsx showing chapters with test records and mastery levels
- [ ] T059 [FRONTEND] [US2] Add route `/schedule/conclusion-plan` to frontend/src/App.jsx protected by <RequireAuth>
- [ ] T060 [FRONTEND] [US2] Wire up API calls in frontend/src/services/api.js: getConclusionPlan(), createTestRecord(data), deleteTestRecord(id), setMastery(data), deleteMastery(chapterId)

### Frontend Translations (US2)

- [ ] T061 [FRONTEND] [P] [US2] Add conclusion plan translations to frontend/src/locales/en/translation.json
- [ ] T062 [FRONTEND] [P] [US2] Add conclusion plan translations to frontend/src/locales/fa/translation.json

**Checkpoint**: User Story 2 complete - students can record test performance and mastery levels ✅

---

## Phase 5: User Story 3 - View Aggregated Weekly Performance (Priority: P2)

**Goal**: Students view consolidated read-only report combining time spent and tests completed per chapter for any week

**Independent Test**: After logging 120min reading + 45min review + 50 tests for "Graph Theory", view Performed Weekly Plan showing total_read_time=120, total_review_time=45, total_tests=50 for that chapter.

### Backend Service (US3)

- [ ] T063 [BACKEND] [US3] Create PerformedPlanAggregationService in backend/planner/services/performed_plan_service.py with aggregate_weekly_performance(student, week_start) using annotate() and aggregate() on StudyActivity and TestRecord, grouped by chapter

### Backend Views & URLs (US3)

- [ ] T064 [BACKEND] [US3] Create WeeklyPerformanceView in backend/planner/views/performance_views.py with get(request) calling PerformedPlanAggregationService, read-only (no POST/PUT/PATCH/DELETE)
- [ ] T065 [BACKEND] [US3] Register WeeklyPerformanceView in backend/planner/urls.py: `GET /weekly-performance/?week_start=YYYY-MM-DD`

### Backend Tests (US3)

- [ ] T066 [BACKEND] [P] [US3] Create backend/planner/tests/test_aggregations.py testing: aggregation_accuracy(), read_only_no_writes(), chapter_grouping(), zero_data_handling()
- [ ] T067 [BACKEND] [P] [US3] Run tests: `docker-compose exec backend python manage.py test planner.tests.test_aggregations`

### Frontend Page (US3)

- [ ] T068 [FRONTEND] [P] [US3] Create frontend/src/pages/student/planner/PerformedWeeklyPlan/PerformedWeeklyPlan.jsx as read-only data grid with CTA message: "To edit study times, visit Daily Schedule. To edit test results, visit Conclusion Plan" with clickable links
- [ ] T069 [FRONTEND] [US3] Add route `/schedule/performed-weekly-plan` to frontend/src/App.jsx protected by <RequireAuth>
- [ ] T070 [FRONTEND] [US3] Wire up API call in frontend/src/services/api.js: getWeeklyPerformance(weekStart)

### Frontend Translations (US3)

- [ ] T071 [FRONTEND] [P] [US3] Add performed weekly plan translations to frontend/src/locales/en/translation.json
- [ ] T072 [FRONTEND] [P] [US3] Add performed weekly plan translations to frontend/src/locales/fa/translation.json

**Checkpoint**: User Story 3 complete - students can view aggregated weekly performance ✅

---

## Phase 6: User Story 4 - Access Personalized Dashboard Hub (Priority: P2)

**Goal**: Students see centralized dashboard with motivational quotes, exam countdown, personal records, today's note, consultation bookings, leaderboard preview, and community opinions preview

**Independent Test**: Save daily note "Finished Graph Theory", view dashboard summary showing total_study_hours="120:30", max_daily_study="08:15", see leaderboard widget, see community opinions widget.

### Backend Models (US4)

- [ ] T073 [BACKEND] [P] [US4] Create DailyNote model in backend/planner/models.py with fields: student (FK User), date (DateField), text (TextField), created_at, updated_at; unique_together=['student', 'date']; upsert behavior
- [ ] T074 [BACKEND] [P] [US4] Create ConsultationBooking model in backend/planner/models.py with fields: student (FK User), day_of_week (PositiveSmallIntegerField 1-7), time_slot (TimeField), created_at; validation: day_of_week 1-7
- [ ] T075 [BACKEND] [US4] Create migration for DailyNote and ConsultationBooking: `docker-compose exec backend python manage.py makemigrations planner`
- [ ] T076 [BACKEND] [US4] Apply migration: `docker-compose exec backend python manage.py migrate planner`

### Backend Service (US4)

- [ ] T077 [BACKEND] [US4] Create DashboardSummaryService in backend/planner/services/dashboard_summary_service.py with get_summary(student) aggregating: total_study_hours, max_daily_study, total_tests, max_daily_tests from StudyActivity and TestRecord; countdown calculation; motivational quote (hardcoded or random Persian quote); today_tasks logic

### Backend Serializers (US4)

- [ ] T078 [BACKEND] [P] [US4] Create DailyNoteSerializer in backend/planner/serializers.py with upsert logic
- [ ] T079 [BACKEND] [P] [US4] Create ConsultationBookingSerializer in backend/planner/serializers.py

### Backend Views & URLs (US4)

- [ ] T080 [BACKEND] [US4] Create DashboardViewSet in backend/planner/views/dashboard_views.py with endpoints: summary(), get_note(), save_note(), book_consultation()
- [ ] T081 [BACKEND] [US4] Register DashboardViewSet in backend/planner/urls.py: `GET /dashboard/summary/`, `GET /dashboard/notes/`, `POST /dashboard/notes/`, `POST /dashboard/consultations/`

### Backend Admin (US4)

- [ ] T082 [BACKEND] [P] [US4] Register DailyNote in backend/planner/admin.py with list_display: student, date, text preview, updated_at; filters: student, date
- [ ] T083 [BACKEND] [P] [US4] Register ConsultationBooking in backend/planner/admin.py with list_display: student, day_of_week, time_slot, created_at; filters: student, day_of_week

### Backend Tests (US4)

- [ ] T084 [BACKEND] [P] [US4] Create backend/planner/tests/test_dashboard.py testing: summary_aggregation(), note_upsert(), consultation_booking(), performance_under_2s()
- [ ] T085 [BACKEND] [P] [US4] Run tests: `docker-compose exec backend python manage.py test planner.tests.test_dashboard`

### Frontend Components (US4)

- [ ] T086 [FRONTEND] [P] [US4] Create frontend/src/pages/student/dashboard/StudentDashboard.jsx as main container
- [ ] T087 [FRONTEND] [P] [US4] Create frontend/src/pages/student/dashboard/PersonalRecordsWidget.jsx showing total_study_hours, max_daily_study, total_tests, max_daily_tests
- [ ] T088 [FRONTEND] [P] [US4] Create frontend/src/pages/student/dashboard/StopwatchWidget.jsx with Start/Stop/Reset using useRef and setInterval
- [ ] T089 [FRONTEND] [P] [US4] Create frontend/src/pages/student/dashboard/DailyNoteWidget.jsx with textarea and save button
- [ ] T090 [FRONTEND] [P] [US4] Create frontend/src/pages/student/dashboard/ConsultationWidget.jsx with day_of_week and time_slot inputs
- [ ] T091 [FRONTEND] [US4] Implement Persian Calendar widget using react-multi-date-picker with Persian locale
- [ ] T092 [FRONTEND] [US4] Add route `/panel/dashboard` to frontend/src/App.jsx protected by <RequireAuth>, set as default redirect after login
- [ ] T093 [FRONTEND] [US4] Wire up API calls in frontend/src/services/api.js: getDashboardSummary(), getDailyNote(date), saveDailyNote(data), bookConsultation(data)

### Frontend Translations (US4)

- [ ] T094 [FRONTEND] [P] [US4] Add dashboard translations to frontend/src/locales/en/translation.json
- [ ] T095 [FRONTEND] [P] [US4] Add dashboard translations to frontend/src/locales/fa/translation.json

**Checkpoint**: User Story 4 complete - students can access personalized dashboard hub ✅

---

## Phase 7: User Story 5 - Generate and Export Study Reports (Priority: P3)

**Goal**: Students generate structured reports (Weekly, Performed, Conclusion, Full) in JSON or PDF format for any date range

**Independent Test**: Select "Full Report" for week Sep 20-26, choose PDF format, click Download, receive properly formatted PDF with RTL Persian text showing scheduled plan, performed activities, and conclusion grid data.

### Backend Service (US5)

- [ ] T096 [BACKEND] [US5] Implement CoreAnalyticsEngine.get_weekly_data(student, week_start, week_end) in backend/planner/services/core_analytics_engine.py aggregating StudyActivity and TestRecord data
- [ ] T097 [BACKEND] [US5] Create ReportFormattingService in backend/planner/services/report_formatting_service.py with format_weekly_report(), format_performed_report(), format_conclusion_report(), format_full_report() calling CoreAnalyticsEngine

### Backend PDF Templates (US5)

- [ ] T098 [BACKEND] [P] [US5] Create backend/planner/templates/reports/weekly_report.html with RTL layout, IRANSans font, Persian text
- [ ] T099 [BACKEND] [P] [US5] Create backend/planner/templates/reports/performed_report.html with RTL layout
- [ ] T100 [BACKEND] [P] [US5] Create backend/planner/templates/reports/conclusion_report.html with RTL layout
- [ ] T101 [BACKEND] [P] [US5] Create backend/planner/templates/reports/full_report.html with RTL layout combining all three sections

### Backend Views & URLs (US5)

- [ ] T102 [BACKEND] [US5] Create ReportViewSet in backend/planner/views/report_views.py with endpoints: weekly_report(), performed_report(), conclusion_report(), full_report() supporting content negotiation (Accept header or ?format=pdf query param) using PdfExportService
- [ ] T103 [BACKEND] [US5] Register ReportViewSet in backend/planner/urls.py: `GET /reports/weekly/`, `GET /reports/performed/`, `GET /reports/conclusion/`, `GET /reports/full/` with ?week_id or ?start_date/?end_date and ?format=json|pdf

### Backend Tests (US5)

- [ ] T104 [BACKEND] [P] [US5] Create backend/planner/tests/test_reports.py testing: json_format_returns_structured_data(), pdf_format_returns_binary(), rtl_persian_text_rendering(), performance_under_5s_for_12_weeks(), core_analytics_engine_dry_principle()
- [ ] T105 [BACKEND] [P] [US5] Run tests: `docker-compose exec backend python manage.py test planner.tests.test_reports`

### Frontend Pages (US5)

- [ ] T106 [FRONTEND] [P] [US5] Create frontend/src/pages/student/planner/Reports/ReportsList.jsx showing available report types with "View" and "Download PDF" buttons
- [ ] T107 [FRONTEND] [P] [US5] Create frontend/src/pages/student/planner/Reports/ReportViewer.jsx rendering JSON report as styled HTML table
- [ ] T108 [FRONTEND] [US5] Implement PDF download handler in frontend/src/services/api.js with Accept: application/pdf header, binary blob response, browser file save prompt
- [ ] T109 [FRONTEND] [US5] Add route `/reports` to frontend/src/App.jsx protected by <RequireAuth>
- [ ] T110 [FRONTEND] [US5] Wire up API calls in frontend/src/services/api.js: getWeeklyReport(params), getPerformedReport(params), getConclusionReport(params), getFullReport(params)

### Frontend Translations (US5)

- [ ] T111 [FRONTEND] [P] [US5] Add reports translations to frontend/src/locales/en/translation.json
- [ ] T112 [FRONTEND] [P] [US5] Add reports translations to frontend/src/locales/fa/translation.json

**Checkpoint**: User Story 5 complete - students can generate and export study reports ✅

---

## Phase 8: User Story 6 - Visualize Study Analytics with Charts (Priority: P3)

**Goal**: Students view interactive charts (line, pie, bar, stacked) showing study time trends, test performance averages, and time allocation by course

**Independent Test**: Select "Last 3 Months" interval on Total Activity chart, see line chart with weekly labels and three datasets (total, read, review) plus pie chart showing percentage breakdown.

### Backend Service (US6)

- [ ] T113 [BACKEND] [US6] Implement CoreAnalyticsEngine.get_total_activity(student, start_date, end_date, interval) in backend/planner/services/core_analytics_engine.py with TruncDate/TruncWeek/TruncMonth aggregations
- [ ] T114 [BACKEND] [US6] Create ChartAdapterService in backend/planner/services/chart_adapter_service.py with format_for_chartjs(data) converting engine output to labels/datasets arrays for Chart.js

### Backend Views & URLs (US6)

- [ ] T115 [BACKEND] [US6] Create AnalyticsViewSet in backend/planner/views/analytics_views.py with endpoints: total_activity(), course_averages(), time_allocation(), stacked_course_activity() using ChartAdapterService, Redis caching with 1-hour TTL, division by zero handling
- [ ] T116 [BACKEND] [US6] Register AnalyticsViewSet in backend/planner/urls.py: `GET /analytics/total-activity/`, `GET /analytics/course-averages/`, `GET /analytics/time-allocation/`, `GET /analytics/stacked-course-activity/` with ?start_date/?end_date/?interval query params

### Backend Tests (US6)

- [ ] T117 [BACKEND] [P] [US6] Create backend/planner/tests/test_analytics.py testing: cached_response_under_500ms(), uncached_response_under_3s(), division_by_zero_graceful(), redis_cache_hit_rate(), data_matches_core_analytics_engine()
- [ ] T118 [BACKEND] [P] [US6] Run tests: `docker-compose exec backend python manage.py test planner.tests.test_analytics`

### Frontend Components (US6)

- [ ] T119 [FRONTEND] [P] [US6] Create frontend/src/pages/student/planner/Charts/ChartsManagement.jsx as main container with date range filter and interval tabs
- [ ] T120 [FRONTEND] [P] [US6] Create frontend/src/pages/student/planner/Charts/TotalActivityChart.jsx with Line and Pie charts using react-chartjs-2, applying getBaseRTLConfig() and toPersianNumber()
- [ ] T121 [FRONTEND] [P] [US6] Create frontend/src/pages/student/planner/Charts/CourseAverageChart.jsx with Bar chart
- [ ] T122 [FRONTEND] [P] [US6] Create frontend/src/pages/student/planner/Charts/TimeAllocationChart.jsx with Bar chart and table
- [ ] T123 [FRONTEND] [P] [US6] Create frontend/src/pages/student/planner/Charts/StackedActivityChart.jsx with stacked Bar chart
- [ ] T124 [FRONTEND] [P] [US6] Create frontend/src/pages/student/planner/Charts/DateRangeFilter.jsx with date picker using react-multi-date-picker and interval tabs (daily/weekly/monthly/3-month/6-month/1-year/all)
- [ ] T125 [FRONTEND] [US6] Register Chart.js components once globally in frontend/src/App.jsx or index.jsx (CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Title, Tooltip, Legend)
- [ ] T126 [FRONTEND] [US6] Add route `/analytics` to frontend/src/App.jsx protected by <RequireAuth>
- [ ] T127 [FRONTEND] [US6] Wire up API calls in frontend/src/services/api.js: getTotalActivity(params), getCourseAverages(params), getTimeAllocation(params), getStackedCourseActivity(params)

### Frontend Translations (US6)

- [ ] T128 [FRONTEND] [P] [US6] Add analytics translations to frontend/src/locales/en/translation.json
- [ ] T129 [FRONTEND] [P] [US6] Add analytics translations to frontend/src/locales/fa/translation.json

**Checkpoint**: User Story 6 complete - students can visualize study analytics with charts ✅

---

## Phase 9: User Story 7 - Engage with Community and Leaderboard (Priority: P3)

**Goal**: Students view top 10 leaderboard (Redis-cached <50ms), submit opinions (anonymous or attributed), vote on opinions with atomic counters

**Independent Test**: View leaderboard filtered by "week" showing top 10 students with ranks, usernames, total study hours, served from Redis cache in <50ms. Submit anonymous opinion "Six key lessons..." which enters PENDING status for moderator approval.

### Backend Models (US7)

- [ ] T130 [BACKEND] [P] [US7] Create StudentOpinion model in backend/community/models.py with fields: author (FK User), text (TextField), is_anonymous (BooleanField default=False), status (CharField choices: PENDING/APPROVED/REJECTED default='PENDING'), likes (PositiveIntegerField default=0), dislikes (PositiveIntegerField default=0), created_at, updated_at
- [ ] T131 [BACKEND] [P] [US7] Create OpinionVote model in backend/community/models.py with fields: opinion (FK StudentOpinion), user (FK User), vote_type (SmallIntegerField), created_at, updated_at; unique_together=['opinion', 'user']; validation: vote_type in (1, -1)
- [ ] T132 [BACKEND] [US7] Create migration for StudentOpinion and OpinionVote: `docker-compose exec backend python manage.py makemigrations community`
- [ ] T133 [BACKEND] [US7] Apply migration: `docker-compose exec backend python manage.py migrate community`

### Backend Celery Task (US7)

- [ ] T134 [BACKEND] [US7] Create recalculate_leaderboard() task in backend/community/tasks.py aggregating StudyActivity and TestRecord from planner app using apps.get_model(), calculating top 10 for day/week/month/three_months periods, storing serialized JSON in Redis keys: `leaderboard:day`, `leaderboard:week`, `leaderboard:month`, `leaderboard:three_months`; using @shared_task(bind=True, max_retries=3, soft_time_limit=1800)

### Backend Service (US7)

- [ ] T135 [BACKEND] [US7] Create LeaderboardService in backend/community/services/leaderboard_service.py with get_leaderboard(period) reading exclusively from Redis cache (no PostgreSQL fallback per FR-019), returning 503 if Redis unavailable

### Backend Serializers (US7)

- [ ] T136 [BACKEND] [P] [US7] Create StudentOpinionSerializer in backend/community/serializers.py with custom to_representation() stripping author field when is_anonymous=true per FR-022
- [ ] T137 [BACKEND] [P] [US7] Create OpinionVoteSerializer in backend/community/serializers.py

### Backend Views & URLs (US7)

- [ ] T138 [BACKEND] [US7] Create LeaderboardView in backend/community/views.py with get(request) calling LeaderboardService.get_leaderboard(period)
- [ ] T139 [BACKEND] [US7] Create OpinionViewSet in backend/community/views.py with endpoints: list(), create(), retrieve(), update_status() (MODERATOR/ADMIN only), delete(), vote() using Django F() expressions: opinion.likes = F('likes') + 1 within @transaction.atomic() per research.md
- [ ] T140 [BACKEND] [US7] Register routes in backend/community/urls.py: `GET /leaderboard/?period=day|week|month|three_months`, `GET /opinions/`, `POST /opinions/`, `PATCH /opinions/{id}/`, `DELETE /opinions/{id}/`, `POST /opinions/{id}/vote/`
- [ ] T141 [BACKEND] [US7] Include community URLs in backend/core/urls.py: `path('api/community/', include('community.urls'))`

### Backend Admin (US7)

- [ ] T142 [BACKEND] [P] [US7] Register StudentOpinion in backend/community/admin.py with list_display: author, text preview, status, likes, dislikes, is_anonymous, created_at; filters: status, is_anonymous; actions: approve_opinions, reject_opinions
- [ ] T143 [BACKEND] [P] [US7] Register OpinionVote in backend/community/admin.py with list_display: opinion, user, vote_type, created_at; filters: vote_type

### Backend Tests (US7)

- [ ] T144 [BACKEND] [P] [US7] Create backend/community/tests/test_voting_atomicity.py testing: 100_simultaneous_votes_accurate_counts() using ThreadPoolExecutor per research.md
- [ ] T145 [BACKEND] [P] [US7] Create backend/community/tests/test_leaderboard_cache.py testing: redis_only_serving(), response_time_under_50ms(), fallback_503_when_redis_down()
- [ ] T146 [BACKEND] [P] [US7] Create backend/community/tests/test_opinion_moderation.py testing: pending_invisible_to_non_authors(), anonymity_strips_author(), status_transitions()
- [ ] T147 [BACKEND] [P] [US7] Run tests: `docker-compose exec backend python manage.py test community`

### Frontend Components (US7)

- [ ] T148 [FRONTEND] [P] [US7] Create frontend/src/components/dashboard/community/LeaderboardGrid.jsx with period tabs (day/week/month/3-months) and top 10 table
- [ ] T149 [FRONTEND] [P] [US7] Create frontend/src/components/dashboard/community/OpinionsList.jsx with sort options (top/recent) and pagination
- [ ] T150 [FRONTEND] [P] [US7] Create frontend/src/components/dashboard/community/OpinionCard.jsx with like/dislike buttons using optimistic UI updates
- [ ] T151 [FRONTEND] [US7] Import LeaderboardGrid and OpinionsList into frontend/src/pages/student/dashboard/StudentDashboard.jsx
- [ ] T152 [FRONTEND] [US7] Create standalone page frontend/src/pages/student/community/CommunityPage.jsx if needed for full community view
- [ ] T153 [FRONTEND] [US7] Wire up API calls in frontend/src/services/api.js: getLeaderboard(period), getOpinions(params), submitOpinion(data), voteOpinion(id, value)

### Frontend Translations (US7)

- [ ] T154 [FRONTEND] [P] [US7] Add community translations to frontend/src/locales/en/translation.json
- [ ] T155 [FRONTEND] [P] [US7] Add community translations to frontend/src/locales/fa/translation.json

**Checkpoint**: User Story 7 complete - students can engage with community and leaderboard ✅

---

## Phase 10: Polish & Cross-Cutting Concerns

**Purpose**: Improvements affecting multiple user stories, final integration, documentation

### Documentation

- [ ] T156 [BACKEND] [P] Create documentations/planner_models.md following file-centric pattern (Purpose → Key Components → Usage → Integration → Change Log) for all 6 planner models
- [ ] T157 [BACKEND] [P] Create documentations/community_models.md following file-centric pattern for StudentOpinion and OpinionVote models
- [ ] T158 [BACKEND] [P] Create documentations/planner_services.md documenting TimeLockService, CoreAnalyticsEngine, PerformedPlanAggregationService, DashboardSummaryService, ReportFormattingService, PdfExportService, ChartAdapterService
- [ ] T159 [BACKEND] [P] Create documentations/community_services.md documenting LeaderboardService
- [ ] T160 [BACKEND] [P] Update backend/schema.yml with all new planner and community endpoints per constitution requirement

### Performance Optimization

- [ ] T161 [BACKEND] [P] Add select_related('chapter__source_material') to all StudyActivity and TestRecord queries to prevent N+1
- [ ] T162 [BACKEND] [P] Add prefetch_related('activities') when fetching DailyStudyLog lists
- [ ] T163 [BACKEND] [P] Add database indexes to backend/planner/models.py: composite index on (student, date) for DailyStudyLog, (chapter, activity_type) for StudyActivity, (student, chapter) for TestRecord
- [ ] T164 [BACKEND] [P] Add database indexes to backend/community/models.py: (status, created_at) for StudentOpinion, (likes, dislikes) for top sorting

### Security Hardening

- [ ] T165 [BACKEND] [P] Add CHECK constraint for sleep_duration_minutes (0-1440) in DailyStudyLog migration
- [ ] T166 [BACKEND] [P] Add CHECK constraint for level (1-100) in ChapterMastery migration
- [ ] T167 [BACKEND] [P] Verify all endpoints enforce IsAuthenticated permission
- [ ] T168 [BACKEND] [P] Verify students can only access/modify their own data (add permission checks in views)

### Integration Testing

- [ ] T169 [BACKEND] [P] Create backend/tests/integration/test_time_tracking_flow.py testing complete US1 scenario: log activities → finalize day → verify temporal locking
- [ ] T170 [BACKEND] [P] Create backend/tests/integration/test_test_recording_flow.py testing complete US2 scenario: create test record → verify calculations → set mastery
- [ ] T171 [BACKEND] [P] Create backend/tests/integration/test_dashboard_aggregation.py testing complete US4 scenario: log data → view dashboard → verify aggregations
- [ ] T172 [BACKEND] [P] Create backend/tests/integration/test_leaderboard_cache.py testing complete US7 scenario: Celery task runs → data cached → leaderboard served from Redis
- [ ] T173 [BACKEND] Run all integration tests: `docker-compose exec backend python manage.py test tests.integration`

### Validation Against Quickstart

- [ ] T174 Run validation scenarios from specs/001-planner-module/quickstart.md Scenario 1 (US1) and verify all acceptance criteria pass
- [ ] T175 Run validation scenarios from specs/001-planner-module/quickstart.md Scenario 2 (US2) and verify all acceptance criteria pass
- [ ] T176 Run validation scenarios from specs/001-planner-module/quickstart.md Scenario 3 (US3) and verify all acceptance criteria pass
- [ ] T177 Run validation scenarios from specs/001-planner-module/quickstart.md Scenario 4 (US4) and verify all acceptance criteria pass
- [ ] T178 Run validation scenarios from specs/001-planner-module/quickstart.md Scenario 5 (US5) and verify all acceptance criteria pass
- [ ] T179 Run validation scenarios from specs/001-planner-module/quickstart.md Scenario 6 (US6) and verify all acceptance criteria pass
- [ ] T180 Run validation scenarios from specs/001-planner-module/quickstart.md Scenario 7 (US7) and verify all acceptance criteria pass

### Code Quality

- [ ] T181 [BACKEND] Run linting: `docker-compose exec backend flake8 planner community`
- [ ] T182 [BACKEND] Run formatting: `docker-compose exec backend black planner community`
- [ ] T183 [FRONTEND] Run linting: `cd frontend && npm run lint`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3-9)**: All depend on Foundational phase completion
  - US1 (P1): Can start after Foundational - No dependencies on other stories ✅ MVP
  - US2 (P1): Can start after Foundational - No dependencies on other stories ✅
  - US3 (P2): Depends on US1 and US2 data existing for aggregation (soft dependency)
  - US4 (P2): Depends on US1 and US2 data for dashboard records widget (soft dependency)
  - US5 (P3): Depends on US1, US2, US3 data for reports (soft dependency)
  - US6 (P3): Depends on US1, US2 data for analytics (soft dependency)
  - US7 (P3): Depends on US1, US2 data for leaderboard (soft dependency)
- **Polish (Phase 10)**: Depends on all desired user stories being complete

### Critical Path for MVP

```
Setup (T001-T008) 
  → Foundational (T009-T021) 
    → US1 (T022-T042) 
      → STOP and VALIDATE ✅
```

### Full Feature Sequence

```
Setup → Foundational → US1 → US2 → US3 → US4 → US5 → US6 → US7 → Polish
```

### Parallel Opportunities

**Within Setup Phase**: T001-T002-T003 (backend deps) || T004-T005-T006 (frontend deps) || T007-T008 (fonts)

**Within Foundational Phase**: T016 (TimeLockService) || T017 (CoreAnalyticsEngine) || T018 (PdfExportService) || T019-T020-T021 (frontend utils)

**Across User Stories** (if team capacity allows): After Foundational completes, US1 and US2 can proceed in parallel (different models, no conflicts)

**Within Each User Story**: All tasks marked [P] can run in parallel

---

## Parallel Example: User Story 1

```bash
# Launch models in parallel:
Task T022: "Create DailyStudyLog model" 
Task T023: "Create StudyActivity model"

# After migration applied, launch serializers in parallel:
Task T026: "Create DailyStudyLogSerializer"
Task T027: "Create StudyActivitySerializer"

# After views complete, launch admin + tests + frontend in parallel:
Task T031: "Register DailyStudyLog in admin"
Task T032: "Register StudyActivity in admin"
Task T033: "Create test_temporal_locking.py"
Task T034: "Create test_daily_study_log.py"
Task T036: "Create HourWeeklyPlan.jsx"
Task T037: "Create DailyStatusList.jsx"
Task T038: "Create DailyLogForm.jsx"
Task T041: "Add en translations"
Task T042: "Add fa translations"
```

---

## Implementation Strategy

### MVP First (User Stories 1 & 2 Only)

1. Complete Phase 1: Setup (T001-T008)
2. Complete Phase 2: Foundational (T009-T021) - CRITICAL
3. Complete Phase 3: User Story 1 (T022-T042)
4. Complete Phase 4: User Story 2 (T043-T062)
5. **STOP and VALIDATE**: Test US1 and US2 independently using quickstart.md
6. Deploy/demo if ready

**MVP Scope**: Students can log daily study activities with temporal locking AND record test performance with mastery levels. This delivers core tracking functionality.

### Incremental Delivery

1. Setup + Foundational → Foundation ready
2. Add US1 (Track Weekly Study Hours) → Test independently → Deploy/Demo (First P1 story!)
3. Add US2 (Record Test Performance) → Test independently → Deploy/Demo (Second P1 story!)
4. Add US3 (View Weekly Performance) → Test independently → Deploy/Demo (First P2 story!)
5. Add US4 (Dashboard Hub) → Test independently → Deploy/Demo (Second P2 story!)
6. Add US5 (Reports) → Test independently → Deploy/Demo (First P3 story!)
7. Add US6 (Analytics) → Test independently → Deploy/Demo (Second P3 story!)
8. Add US7 (Community & Leaderboard) → Test independently → Deploy/Demo (Third P3 story!)
9. Polish → Final release

Each story adds value without breaking previous stories.

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together (T001-T021)
2. Once Foundational done:
   - **Developer A**: User Story 1 (T022-T042) - backend/planner/models.py (DailyStudyLog, StudyActivity), views, frontend
   - **Developer B**: User Story 2 (T043-T062) - backend/planner/models.py (TestRecord, ChapterMastery), views, frontend
   - **Developer C**: User Story 7 (T130-T155) - backend/community/ complete (models, Celery task, views, frontend)
3. After US1 & US2 complete, proceed with dependent stories:
   - **Developer A**: User Story 3 (T063-T072) - aggregation service
   - **Developer B**: User Story 4 (T073-T095) - dashboard
   - **Developer C**: User Story 5 (T096-T112) - reports
4. Final wave:
   - **Developer A**: User Story 6 (T113-T129) - analytics
   - **Developer B**: Polish (T156-T183) - documentation, optimization, validation

---

## Task Count Summary

- **Total Tasks**: 183
- **Setup**: 8 tasks
- **Foundational**: 13 tasks (BLOCKING)
- **User Story 1** (P1): 21 tasks ✅ MVP
- **User Story 2** (P1): 20 tasks ✅ MVP
- **User Story 3** (P2): 10 tasks
- **User Story 4** (P2): 23 tasks
- **User Story 5** (P3): 17 tasks
- **User Story 6** (P3): 17 tasks
- **User Story 7** (P3): 26 tasks
- **Polish**: 28 tasks

**Backend Tasks**: ~110
**Frontend Tasks**: ~60
**Mixed/Documentation**: ~13

**Parallelizable Tasks**: ~80 marked with [P]

---

## Notes

- [BACKEND] = Django/Python/Docker task
- [FRONTEND] = React/JavaScript/npm task
- [P] = Parallelizable (different files, no dependencies)
- [US#] = User story mapping for traceability
- All Django commands use Docker: `docker-compose exec backend python manage.py ...`
- All dependency updates require rebuild: `docker-compose build backend`
- Avoid vague tasks - each task specifies exact file path and acceptance criteria
- Commit after each task or logical group of [P] tasks
- Stop at any checkpoint to validate story independently before proceeding
- Constitution compliance maintained: file-centric docs, rollback plans documented, backward compatibility preserved
