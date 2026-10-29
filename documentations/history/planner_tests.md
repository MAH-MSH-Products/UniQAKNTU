# Planner Tests Documentation

## Purpose
`backend/planner/tests.py` contains the automated test suite for the `planner` application. It validates the single-source-of-truth invariant, multi-module aggregation logic, read-only API boundaries, user isolation, edge cases, and model constraints.

## Key Test Suites

### 1. `WeeklyPerformanceAPITests`
- `test_unauthenticated_access_denied`: Confirms that unauthenticated requests return `401 Unauthorized`.
- `test_default_current_week_empty`: Tests the default week behavior when no query parameters are provided.
- `test_invalid_week_start_format`: Validates that non-ISO date parameters (e.g. `YYYY/MM/DD`) return `400 Bad Request`.
- `test_aggregated_weekly_performance`: Verifies end-to-end multi-activity aggregation (`READING`, `REVIEW`, and `TestRecord`) across multiple days and chapters within the target week window while excluding records outside the week.
- `test_user_isolation`: Confirms that records from student A are never leaked into student B's aggregation summary.
- `test_http_mutation_methods_disallowed`: Validates that `POST`, `PUT`, `PATCH`, and `DELETE` HTTP methods are disallowed (`405 Method Not Allowed`), enforcing the strictly read-only domain requirement.
- `test_boundary_dates_in_aggregation`: Tests that activity records occurring exactly on Day 0 (`start_date`) and Day 6 (`end_date`) are aggregated, while Day -1 and Day 7 records are excluded.
- `test_activity_with_null_chapter_ignored`: Asserts that general study logs without a specific chapter are safely excluded from the chapter breakdown without throwing exceptions.

### 2. `ModelIntegrityAndStringTests`
- `test_chapter_string_representation`: Tests `Chapter.__str__()` returning `"{course} - {chapter}"`.
- `test_daily_study_log_string_representation`: Tests `DailyStudyLog.__str__()` returning `"{username} - {date}"`.
- `test_daily_study_log_unique_together`: Enforces database-level constraint preventing duplicate daily logs for the same student on the same date (`IntegrityError`).
- `test_study_activity_string_representation`: Tests `StudyActivity.__str__()` with and without an assigned chapter.
- `test_test_record_string_representation`: Tests `TestRecord.__str__()`.

### 3. `PerformedPlanAggregationServiceDirectTests`
- `test_get_week_boundaries_with_date_and_string`: Validates Saturday-to-Friday week calculation given `datetime.date` or date string.
- `test_aggregate_with_only_tests_no_reading`: Verifies handling when only test records exist without reading activities.
- `test_aggregate_with_only_reading_no_tests`: Verifies handling when only reading activities exist without test records.
- `test_aggregate_alphabetical_sorting_of_multiple_chapters`: Confirms chapter list sorting alphabetically by `(source_material_title, chapter_title)`.

## Usage
Run via Django management command:
```bash
python manage.py test planner
```
Or as part of the complete test suite:
```bash
python manage.py test
```
