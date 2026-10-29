# Performed Plan Aggregation Service Documentation

## Purpose
`backend/planner/services/performed_plan_service.py` provides the core business logic for aggregating student study performance over a 7-day calendar window. It implements the Single Source of Truth architecture required by Sub-module 1, preventing data duplication by dynamically joining `StudyActivity` and `TestRecord` models grouped at the `Chapter` granularity level.

## Key Components

### Class `PerformedPlanAggregationService`
Dynamic calculation engine containing domain aggregation algorithms.

#### Method `aggregate_weekly_performance(user, week_start=None)`
- **Input Specifications**:
  - `user`: Authenticated Django `User` instance.
  - `week_start`: Optional `datetime.date` or ISO date string (`YYYY-MM-DD`). Defaults to the Monday of the current week.
- **Output Specifications**:
  Returns a dictionary adhering to the Sub-module 1 API contract:
  ```json
  {
    "week_start": "YYYY-MM-DD",
    "week_end": "YYYY-MM-DD",
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
- **Algorithm Flow**:
  1. Computes the 7-day bounds: `[week_start, week_start + 6 days]`.
  2. Queries `StudyActivity` records where `daily_log__student == user` and `daily_log__log_date` falls in the target date range.
  3. Queries `TestRecord` records where `daily_log__student == user` and `daily_log__log_date` falls in the target date range.
  4. Collects the union of all active `Chapter` IDs referenced in either study or test records.
  5. Performs eager fetching with `.select_related('source_material')` to eliminate N+1 queries.
  6. Aggregates reading time (`activity_type == READING`), review time (`activity_type == REVIEW`), and total test counts per chapter and across the entire week.
  7. Sorts chapters alphabetically by source material and chapter title for consistent presentation.

## Usage
Called directly by `WeeklyPerformanceView` in `backend/planner/views.py`:
```python
from planner.services.performed_plan_service import PerformedPlanAggregationService

data = PerformedPlanAggregationService.aggregate_weekly_performance(
    user=request.user,
    week_start=parsed_week_start
)
```

## Integration
- Integrates with `DailyStudyLog`, `StudyActivity`, `TestRecord`, and `Chapter` models in `backend/planner/models.py`.
- Formatted and validated through `WeeklyPerformanceSerializer` in `backend/planner/serializers.py`.
