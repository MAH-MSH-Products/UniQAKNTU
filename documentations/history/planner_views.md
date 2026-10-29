# Planner Views Documentation

## Purpose
`backend/planner/views.py` exposes RESTful API endpoints for the student study planning system. Under Sub-module 1 guidelines, it provides a strictly read-only endpoint for weekly study performance aggregation.

## Key Components

### Class `WeeklyPerformanceView`
- **Inherits from**: `rest_framework.views.APIView`
- **Permissions**: `[permissions.IsAuthenticated]`
- **HTTP Methods Supported**: `GET` only.
  *(All `POST`/`PUT`/`PATCH`/`DELETE` operations are forbidden per Sub-module 1 requirements to avoid data duplication; modifications must occur via Sub-module 5 and Sub-module 2).*
- **Query Parameters**:
  - `week_start` (optional): ISO format string `YYYY-MM-DD`. Validated with `datetime.strptime`. Returns `400 Bad Request` if malformed.
- **Response**:
  - `200 OK`: Serialized `WeeklyPerformanceSerializer` payload containing aggregate totals and per-chapter breakdown.
  - `400 Bad Request`: When `week_start` date parameter fails parsing.
  - `401 Unauthorized`: For unauthenticated requests.

## Usage
Route mapped in `backend/planner/urls.py`:
```python
path('weekly-performance/', WeeklyPerformanceView.as_view(), name='weekly-performance')
```

## Integration
- Invokes `PerformedPlanAggregationService.aggregate_weekly_performance`.
- Serializes results with `WeeklyPerformanceSerializer`.
- Registered under global routing at `/api/planner/weekly-performance/`.
