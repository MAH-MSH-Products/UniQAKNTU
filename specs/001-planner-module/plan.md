# Implementation Plan: Planner Module

**Branch**: `001-planner-module` | **Date**: 2026-09-23 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/001-planner-module/spec.md`

**Note**: This template is filled in by the `/speckit-plan` command; its definition describes the execution workflow.

## Summary

Implement a comprehensive academic planning and tracking system for graduate exam preparation students. The Planner Module consists of 7 sub-modules providing time tracking, test performance analytics, dashboard visualization, reporting, and community gamification features. The system enforces strict domain boundaries between time tracking (planner app) and social features (community app), uses Redis for performance-critical leaderboard caching, and implements temporal locking to ensure data integrity. All features use SourceMaterialChapter as the standardized granularity level and support Persian (Jalali) calendar throughout the UI.

## Technical Context

**Language/Version**: Python 3.12 (Backend), React 19.2 (Frontend)

**Primary Dependencies**: 
- Backend: Django 4.2+, DRF 3.14+, Celery 5.3+, Redis (django-redis 5.4+), PostgreSQL (psycopg2-binary), jdatetime 4.1+ (Persian calendar), WeasyPrint or pdfkit (PDF generation)
- Frontend: React 19.2, Vite 8.2, React Router 7.18, Axios 1.19, react-i18next 17.0, react-chartjs-2 (to be added), Bootstrap 5.3

**Storage**: PostgreSQL (primary relational DB), Redis (leaderboard cache, analytics cache with 1-hour TTL), S3-compatible storage (django-storages with boto3 for attachments)

**Testing**: pytest with pytest-django (backend), Jest and React Testing Library (frontend per assumptions), CI pipeline with pytest + flake8/black gates

**Target Platform**: Web application (Linux server backend, modern browsers for SPA frontend). Backend timezone: Asia/Tehran. Supports RTL Persian (Farsi) UI with Jalali calendar throughout.

**Project Type**: Full-stack web application (decoupled Django REST API backend + React SPA frontend). Two independently deployable services communicating exclusively via HTTP API boundary defined in API contracts.

**Performance Goals**: 
- Dashboard/list endpoints: <2s response time
- Leaderboard (Redis-backed): <50ms response time (99th percentile)
- Analytics charts: <500ms for cached queries, <3s for cache misses
- PDF report generation: <5s for 12-week full report
- Support 500 concurrent students during peak hours without degradation

**Constraints**: 
- Temporal locking: students can only edit current week + previous week study logs (enforced server-side with 403 for older logs)
- Backward compatibility: All existing public API endpoints in `API.md` and `backend/schema.yml` must remain compatible
- Zero direct database queries in leaderboard GET endpoint (Redis-only to guarantee <50ms)
- All timestamps must expose both ISO 8601 and Persian Jalali (`*_jalali`) formats; UI must render Jalali
- RTL Persian text rendering in PDFs with IRANSans font
- Atomic updates for vote counters using Django F() expressions to prevent race conditions
- Chapter-level granularity standardization across all planner modules via `curriculum.SourceMaterialChapter`

**Scale/Scope**: 
- 7 sub-modules (Weekly Study Hours, Conclusion Plan, Performed Weekly Plan, Dashboard, Community & Leaderboard, Reports, Analytics)
- Estimated 15+ new models across `planner` and `community` Django apps
- 25+ new API endpoints
- 12+ new React pages/components
- Data retention: indefinite (study logs, test records, opinions retained unless explicitly deleted)
- Leaderboard: top 10 students per period (day/week/month/3-months), recalculated hourly via Celery Beat
- Analytics: multi-chart dashboard with 4 major visualizations (total activity line/pie, course averages bar, time allocation bar/table, stacked course activity)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### I. Public API Compatibility ✅ PASS
- **Status**: No conflicts. This is a new module introducing new endpoints under `/api/planner/` and `/api/community/`.
- **Verification**: No existing endpoints in `API.md` or `backend/schema.yml` are being modified or removed.
- **Action**: All new endpoints must be documented in `backend/schema.yml` upon implementation.

### II. Service Boundary Integrity ✅ PASS
- **Status**: Compliant. Backend (`planner` and `community` Django apps) and Frontend (React SPA) remain independently deployable.
- **Verification**: All communication crosses the HTTP API boundary defined in sub-module API contracts. No shared database access or server-side template rendering for frontend views.
- **Action**: Ensure proper git authorship (backend author for backend commits, `mahajialirezaei` for frontend commits).

### III. Role-Based Access Control ✅ PASS
- **Status**: Compliant. Uses existing role enum (`STUDENT | MODERATOR | ADMIN`).
- **Verification**: 
  - Students can only access/modify their own planner data (enforced server-side).
  - Moderators can access moderation queue for community opinions (`PENDING` → `APPROVED/REJECTED` workflow).
  - Admins retain full access per existing permission matrix.
- **Action**: All sensitive endpoints must verify roles server-side; never trust client-side checks.

### IV. Database Schema Integrity ✅ PASS
- **Status**: Compliant. New models follow existing patterns.
- **Verification**:
  - Uses `unique_together` constraints appropriately (e.g., `['student', 'date']` for DailyStudyLog, `['opinion', 'user']` for OpinionVote).
  - Foreign keys to existing models (`accounts.User`, `curriculum.SourceMaterialChapter` - requires verification/creation).
  - No modifications to existing models or constraints.
- **Action**: `curriculum.SourceMaterialChapter` model must exist or be created before planner implementation (see research phase).

### V. Database Migrations — Rollback Plans Required ⚠️ ATTENTION REQUIRED
- **Status**: Requires ongoing compliance during implementation.
- **Verification**: This is a new feature with 15+ new models. All migrations will be additive (no destructive operations on existing data).
- **Action**: 
  - Every migration must include documented rollback plan before merge.
  - If `curriculum.SourceMaterialChapter` doesn't exist and must be created, that migration requires explicit approval from both authors.
  - Migration rollback plans must be documented in each migration file's docstring or accompanying `.md` file.

### VI. Test-Driven Verification ✅ PASS
- **Status**: Planned. Feature spec includes comprehensive acceptance scenarios and success criteria.
- **Verification**: CI gates (pytest + flake8/black for backend, UI validation/JS linting for frontend) will block merges on failure.
- **Action**: 
  - Implementation must include tests for temporal locking (FR-002), upsert logic (FR-004, FR-005), atomic voting (FR-021), and calculation accuracy (FR-003).
  - Integration tests must verify N+1 query prevention and response time targets.

### VII. File-Centric Documentation ⚠️ ATTENTION REQUIRED
- **Status**: Requires ongoing compliance during implementation.
- **Verification**: Each new/modified `.py` file must have a corresponding `.md` in `documentations/`.
- **Action**: 
  - Document structure: Purpose → Key Components → Usage → Integration → Change Log.
  - File-centric (e.g., `documentations/planner_models.md`), not task-centric.
  - Config-only changes (Celery Beat schedules, Redis keys) don't require separate docs unless they introduce new system patterns.

### Security Constraints ✅ PASS
- **Status**: Compliant. No credentials in code; uses existing JWT Bearer authentication.
- **Verification**: 
  - Redis cache keys (e.g., `leaderboard:week`) contain no sensitive data.
  - Anonymous opinions correctly strip author data when `is_anonymous=true` (FR-022).
  - Rate limiting applies to existing auth endpoints; no new rate limits required for planner features.
- **Action**: Ensure `.env` files remain git-ignored and no credentials leak into cache keys or logs.

### Git & Branching Workflow ✅ PASS
- **Status**: Feature branch `001-planner-module` created from `develop`.
- **Verification**: Branch naming follows convention (feature prefix not strictly required per constitution, but numeric prefix is custom).
- **Action**: 
  - Use conventional commits throughout implementation.
  - Open PR to `develop` when complete.
  - CI must pass before merge.

### API Contract Rules ✅ PASS
- **Status**: New endpoints follow existing patterns.
- **Verification**:
  - List endpoints return `{ count, next, previous, results }` with page size = 20.
  - All models expose ISO 8601 (`created_at`/`updated_at`) and Persian Shamsi (`*_jalali`) timestamps.
  - Frontend must render `*_jalali` in UI.
  - Content visibility: `PENDING` opinions visible only to author + moderators; `APPROVED` opinions public.
- **Action**: Error handling must follow existing contract (400/401/403/404/429 with appropriate responses).

### Progress Reporting ✅ PASS
- **Status**: Will use `[PHASE-X] <Task Name> - Status` format during implementation.
- **Action**: Reports must include documentation, verification, references, and blockers sections as per constitution.

---

### Summary: CLEARED TO PROCEED
- **Critical Issues**: None. All gates pass.
- **Attention Required**: 
  1. Verify `curriculum.SourceMaterialChapter` model exists; if not, create it before planner models (Phase 0 research task).
  2. Maintain file-centric documentation discipline throughout implementation.
  3. Document rollback plans for all migrations before merge.
- **Re-check After Phase 1**: Confirm data model design adheres to `unique_together` constraints, upsert patterns, and atomic update requirements.

## Project Structure

### Documentation (this feature)

```text
specs/001-planner-module/
├── spec.md              # Feature specification (complete)
├── plan.md              # This file (/speckit-plan command output - in progress)
├── research.md          # Phase 0 output (to be generated)
├── data-model.md        # Phase 1 output (to be generated)
├── quickstart.md        # Phase 1 output (to be generated)
├── contracts/           # Phase 1 output (to be generated)
│   ├── planner-api.md
│   ├── community-api.md
│   └── analytics-api.md
└── tasks.md             # Phase 2 output (/speckit-tasks command - NOT created by /speckit-plan)
```

### Source Code (repository root)

```text
backend/
├── apps/
│   ├── planner/                          # NEW: Time tracking, analytics, reports
│   │   ├── __init__.py
│   │   ├── apps.py
│   │   ├── models.py                     # DailyStudyLog, StudyActivity, TestRecord, ChapterMastery, DailyNote, ConsultationBooking
│   │   ├── serializers.py
│   │   ├── views/
│   │   │   ├── __init__.py
│   │   │   ├── weekly_hours_views.py     # Sub-module 5: Weekly Study Hours
│   │   │   ├── conclusion_views.py       # Sub-module 2: Conclusion Plan & Test Analytics
│   │   │   ├── performance_views.py      # Sub-module 1: Performed Weekly Plan (read-only aggregation)
│   │   │   ├── dashboard_views.py        # Sub-module 3: Dashboard & Student Tools
│   │   │   ├── report_views.py           # Sub-module 6: Reports
│   │   │   └── analytics_views.py        # Sub-module 7: Student Analytics
│   │   ├── services/
│   │   │   ├── __init__.py
│   │   │   ├── time_lock_service.py      # Temporal validation (current + prev week only)
│   │   │   ├── performed_plan_service.py # Aggregation service for Sub-module 1
│   │   │   ├── dashboard_summary_service.py # Aggregation for dashboard summary
│   │   │   ├── core_analytics_engine.py  # Shared aggregation logic (Sub-modules 6 & 7)
│   │   │   ├── chart_adapter_service.py  # Formats analytics data for Chart.js
│   │   │   ├── report_formatting_service.py # Formats data for reports
│   │   │   └── pdf_export_service.py     # PDF generation via WeasyPrint/pdfkit
│   │   ├── urls.py
│   │   ├── admin.py
│   │   ├── tests/
│   │   │   ├── test_models.py
│   │   │   ├── test_views.py
│   │   │   ├── test_temporal_locking.py
│   │   │   ├── test_calculations.py
│   │   │   └── test_aggregations.py
│   │   ├── migrations/
│   │   └── templates/                    # PDF report templates (HTML for WeasyPrint)
│   │       ├── reports/
│   │       │   ├── weekly_report.html
│   │       │   ├── performed_report.html
│   │       │   ├── conclusion_report.html
│   │       │   └── full_report.html
│   │
│   ├── community/                        # NEW: Social features, leaderboard, opinions
│   │   ├── __init__.py
│   │   ├── apps.py
│   │   ├── models.py                     # StudentOpinion, OpinionVote
│   │   ├── serializers.py
│   │   ├── views.py                      # Leaderboard, Opinions CRUD, Voting
│   │   ├── services/
│   │   │   ├── __init__.py
│   │   │   └── leaderboard_service.py    # Redis caching logic
│   │   ├── tasks.py                      # Celery tasks for leaderboard calculation
│   │   ├── urls.py
│   │   ├── admin.py
│   │   ├── tests/
│   │   │   ├── test_voting_atomicity.py
│   │   │   ├── test_leaderboard_cache.py
│   │   │   └── test_opinion_moderation.py
│   │   └── migrations/
│   │
│   ├── curriculum/                       # EXISTING or TO BE CREATED
│   │   └── models.py                     # Must include SourceMaterialChapter model
│   │
│   ├── users/                            # EXISTING
│   ├── qna/                              # EXISTING
│   ├── tags/                             # EXISTING
│   ├── support/                          # EXISTING
│   └── widgets/                          # EXISTING
│
├── core/
│   ├── settings.py                       # Update: add 'planner', 'community' to INSTALLED_APPS; configure Celery Beat
│   ├── celery.py                         # Update: register periodic tasks
│   ├── urls.py                           # Update: include planner.urls, community.urls
│   └── ...
│
├── requirements.txt                      # Update: add WeasyPrint/pdfkit, redis, celery, chart libs if needed
├── manage.py
└── schema.yml                            # Update: add all new API endpoints

frontend/
├── src/
│   ├── pages/
│   │   └── student/
│   │       ├── dashboard/                # NEW: Sub-module 3
│   │       │   ├── StudentDashboard.jsx
│   │       │   ├── PersonalRecordsWidget.jsx
│   │       │   ├── StopwatchWidget.jsx
│   │       │   ├── DailyNoteWidget.jsx
│   │       │   └── ConsultationWidget.jsx
│   │       │
│   │       └── planner/                  # NEW: Sub-modules 1, 2, 5, 6, 7
│   │           ├── HourWeeklyPlan/       # Sub-module 5: Weekly Study Hours
│   │           │   ├── HourWeeklyPlan.jsx
│   │           │   ├── DailyStatusList.jsx
│   │           │   └── DailyLogForm.jsx
│   │           │
│   │           ├── ConclusionPlan/       # Sub-module 2: Conclusion Plan & Test Analytics
│   │           │   ├── ConclusionPlan.jsx
│   │           │   ├── ConclusionForm.jsx
│   │           │   └── ConclusionGrid.jsx
│   │           │
│   │           ├── PerformedWeeklyPlan/  # Sub-module 1: Performed Weekly Plan (read-only)
│   │           │   └── PerformedWeeklyPlan.jsx
│   │           │
│   │           ├── Reports/              # Sub-module 6: Reports
│   │           │   ├── ReportsList.jsx
│   │           │   └── ReportViewer.jsx
│   │           │
│   │           └── Charts/               # Sub-module 7: Student Analytics
│   │               ├── ChartsManagement.jsx
│   │               ├── TotalActivityChart.jsx
│   │               ├── CourseAverageChart.jsx
│   │               ├── TimeAllocationChart.jsx
│   │               ├── StackedActivityChart.jsx
│   │               └── DateRangeFilter.jsx
│   │
│   ├── components/
│   │   └── dashboard/
│   │       └── community/                # NEW: Sub-module 4 components (imported by Dashboard)
│   │           ├── LeaderboardGrid.jsx
│   │           ├── OpinionsList.jsx
│   │           └── OpinionCard.jsx
│   │
│   ├── services/
│   │   └── api.js                        # Update: add all planner & community endpoints
│   │
│   ├── contexts/
│   │   └── AuthContext.jsx               # EXISTING: provides user role, token
│   │
│   ├── locales/
│   │   ├── en/
│   │   │   └── translation.json          # Update: add planner, community, analytics keys
│   │   └── fa/
│   │       └── translation.json          # Update: add Persian translations
│   │
│   ├── App.jsx                           # Update: add new routes under /panel/dashboard, /schedule/*, /reports
│   └── index.css                         # Update: ensure dark mode variables cover new UI elements
│
├── package.json                          # Update: add react-chartjs-2, chart.js, react-multi-date-picker
└── ...

tests/
├── integration/                          # NEW: E2E tests for planner workflows
│   ├── test_time_tracking_flow.py
│   ├── test_test_recording_flow.py
│   ├── test_dashboard_aggregation.py
│   └── test_leaderboard_cache.py
└── ...
```

**Structure Decision**: Web application with decoupled backend/frontend (Option 2 pattern). Backend uses Django apps pattern (`planner` and `community` apps under `backend/apps/`). Frontend uses page-based routing under `src/pages/student/` with shared components in `src/components/`. This structure supports the existing architecture and maintains clear domain boundaries between time tracking (planner app), social features (community app), and presentation layer (React SPA).

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

**Status**: No violations detected. No complexity tracking required.

All architectural decisions align with the existing constitution:
- Follows existing decoupled backend/frontend pattern
- Uses established Django apps structure
- No new architectural patterns introduced
- Redis and Celery are already in use per `requirements.txt`
- No deviation from RBAC or API contract patterns

---

## Phase 1: Design & Contracts - COMPLETE ✅

**Status**: All design artifacts generated successfully

**Generated Artifacts:**

1. **research.md** (Phase 0)
   - 6 research areas investigated and documented
   - All NEEDS CLARIFICATION items resolved
   - Technology choices finalized with rationale
   - CRITICAL: Curriculum app creation identified as blocking dependency

2. **data-model.md** (Phase 1)
   - 8 database models defined (1 in curriculum app, 6 in planner app, 2 in community app)
   - Virtual entities documented (WeeklyPerformanceSummary, DashboardSummary, LeaderboardEntry)
   - Relationships, constraints, and validation rules specified
   - Migration strategy with rollback considerations

3. **contracts/** (Phase 1)
   - `planner-api.md`: 25+ endpoints across 7 sub-modules with TypeScript types
   - `community-api.md`: Leaderboard + opinions endpoints with business rules
   - Complete request/response schemas
   - Performance targets and caching strategies

4. **quickstart.md** (Phase 1)
   - 7 validation scenarios (one per priority user story)
   - Runnable curl commands and expected responses
   - Performance validation guidelines
   - Integration testing checklist

**Design Decisions Summary:**

| Area | Decision | Status |
|------|----------|--------|
| Curriculum Model | Create new `curriculum` app with SourceMaterialChapter | ⚠️ BLOCKS IMPLEMENTATION |
| Chart Library | react-chartjs-2 v5.3.1 + Chart.js v4.5.1 | ✅ Ready to implement |
| PDF Generation | WeasyPrint (≥60.0) | ✅ Ready to implement |
| Celery Beat | Manual CELERY_BEAT_SCHEDULE | ✅ Ready to configure |
| Temporal Locking | Service class with serializer + view validation | ✅ Pattern documented |
| Atomic Voting | Django F() expressions with @transaction.atomic() | ✅ Pattern documented |
| Persian Calendar | react-multi-date-picker + existing jdatetime backend | ✅ Ready to implement |

**Constitution Re-Check:**

All gates still pass after design phase:
- ✅ No API compatibility issues (new endpoints only)
- ✅ Service boundaries maintained (planner/community apps independent)
- ✅ RBAC patterns followed (STUDENT/MODERATOR/ADMIN roles)
- ✅ Database schema integrity preserved (unique constraints, indexes documented)
- ⚠️ Migration rollback plans required during implementation
- ✅ File-centric documentation will be maintained during implementation
- ✅ Testing patterns identified for temporal locking, atomic voting, race conditions

**Critical Path:**

1. **IMMEDIATE BLOCKER**: Curriculum app creation
   - Requires approval from both project authors
   - Estimated effort: 2-3 hours
   - Must be completed before any planner models can be implemented

2. **Implementation Sequence** (after curriculum app):
   - Phase A: Backend models (planner + community apps)
   - Phase B: Backend services and views
   - Phase C: Frontend components and pages
   - Phase D: Integration and testing

**Next Command:** `/speckit-tasks` to generate implementation task breakdown
