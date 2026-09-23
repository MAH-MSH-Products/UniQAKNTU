# Quickstart Validation Guide: Planner Module

**Feature**: Planner Module (7 Sub-modules)
**Date**: 2026-09-23
**Purpose**: End-to-end validation scenarios to prove the feature works

## Overview

This guide provides runnable validation scenarios for each priority user story. These scenarios prove the feature works end-to-end without including full implementation details. For complete data models, see [data-model.md](./data-model.md). For API contracts, see [contracts/](./contracts/).

---

## Prerequisites

### Backend Setup

1. **Create curriculum app** (CRITICAL BLOCKER - must be done first):
```bash
cd backend
python manage.py startapp curriculum
# Add 'curriculum.apps.CurriculumConfig' to INSTALLED_APPS in settings.py
python manage.py makemigrations curriculum
python manage.py migrate curriculum
```

2. **Create planner and community apps**:
```bash
python manage.py startapp planner
python manage.py startapp community
# Add to INSTALLED_APPS in settings.py
python manage.py makemigrations planner community
python manage.py migrate planner community
```

3. **Install dependencies**:
```bash
pip install weasyprint  # For PDF generation
# Ensure Redis is running for leaderboard cache
redis-server
```

4. **Configure Celery Beat** (add to settings.py):
```python
from celery.schedules import crontab

CELERY_BEAT_SCHEDULE = {
    'recalculate-leaderboard-hourly': {
        'task': 'community.tasks.recalculate_leaderboard',
        'schedule': crontab(minute=0),
    },
}
```

5. **Start services**:
```bash
# Terminal 1: Django server
python manage.py runserver

# Terminal 2: Celery worker
celery -A core worker --loglevel=info

# Terminal 3: Celery beat
celery -A core beat --loglevel=info
```

### Frontend Setup

1. **Install dependencies**:
```bash
cd frontend
npm install react-chartjs-2 chart.js react-multi-date-picker
```

2. **Start dev server**:
```bash
npm run dev
```

### Test Data Setup

Create test data via Django shell or admin:
```python
python manage.py shell

from users.models import User
from curriculum.models import SourceMaterialChapter
from qna.models import SourceMaterial

# Create test student
student = User.objects.create_user(
    username='test_student',
    email='student@test.com',
    password='testpass123',
    role='STUDENT'
)

# Create test source material and chapters
discrete_math = SourceMaterial.objects.create(
    title='Discrete Mathematics',
    year=2024
)

graph_chapter = SourceMaterialChapter.objects.create(
    source_material=discrete_math,
    title='Graph Theory',
    chapter_number=3,
    page_count=50
)
```

---

## Validation Scenario 1: Track Weekly Study Hours (P1)

**User Story**: Students can log daily study activities and track sleep duration with temporal locking.

### Setup
- User: `test_student` (STUDENT role)
- Date: Today (within current week)
- Chapter: Graph Theory (from test data)

### Test Steps

1. **Create daily study log**:
```bash
# Via API
curl -X PUT http://localhost:8000/api/planner/weekly-hours/daily-logs/2026-09-23/ \
  -H "Authorization: Bearer {access_token}" \
  -H "Content-Type: application/json" \
  -d '{
    "sleep_duration_minutes": 480,
    "is_finalized": false,
    "activities": [
      {
        "chapter_id": "{graph_chapter_uuid}",
        "activity_type": "READING",
        "duration_minutes": 120
      },
      {
        "chapter_id": "{graph_chapter_uuid}",
        "activity_type": "REVIEW",
        "duration_minutes": 60
      }
    ]
  }'
```

2. **Verify data saved**:
```bash
curl http://localhost:8000/api/planner/weekly-hours/daily-logs/2026-09-23/ \
  -H "Authorization: Bearer {access_token}"
```

**Expected Response**:
```json
{
  "date": "2026-09-23",
  "date_jalali": "1403/07/02",
  "sleep_duration_minutes": 480,
  "is_finalized": false,
  "activities": [
    {
      "id": "...",
      "chapter": {
        "id": "...",
        "title": "Graph Theory",
        "chapter_number": 3
      },
      "activity_type": "READING",
      "duration_minutes": 120
    },
    {
      "id": "...",
      "activity_type": "REVIEW",
      "duration_minutes": 60
    }
  ]
}
```

3. **Test temporal locking** (attempt to edit old log):
```bash
# Try to edit a log from 15 days ago
curl -X PUT http://localhost:8000/api/planner/weekly-hours/daily-logs/2026-09-08/ \
  -H "Authorization: Bearer {access_token}" \
  -H "Content-Type: application/json" \
  -d '{"sleep_duration_minutes": 500, "activities": []}'
```

**Expected Response**: HTTP 403
```json
{
  "detail": "Cannot edit logs older than the previous week."
}
```

4. **Test finalization**:
```bash
curl -X PUT http://localhost:8000/api/planner/weekly-hours/daily-logs/2026-09-23/ \
  -H "Authorization: Bearer {access_token}" \
  -H "Content-Type: application/json" \
  -d '{
    "sleep_duration_minutes": 480,
    "is_finalized": true,
    "activities": [...]
  }'
```

**Expected**: `is_finalized: true` in response, day shows "Finalized" badge in weekly overview.

### Success Criteria
✅ Student can log 3 study activities (2 hours reading, 1 hour review, 8 hours sleep)
✅ Data appears in read-only summary view
✅ System returns 403 for logs older than previous week
✅ Finalized days show locked status

---

## Validation Scenario 2: Record Test Performance (P1)

**User Story**: Students can record test results and track mastery levels.

### Test Steps

1. **Create test record**:
```bash
curl -X POST http://localhost:8000/api/planner/conclusion-plan/test-records/ \
  -H "Authorization: Bearer {access_token}" \
  -H "Content-Type: application/json" \
  -d '{
    "chapter_id": "{graph_chapter_uuid}",
    "test_format": "EVEN",
    "test_method": "FEEDBACK",
    "total_tests": 40,
    "correct_tests": 30,
    "wrong_tests": 5
  }'
```

**Expected Response**: HTTP 201
```json
{
  "id": "...",
  "chapter_id": "...",
  "test_format": "EVEN",
  "test_method": "FEEDBACK",
  "total_tests": 40,
  "correct_tests": 30,
  "wrong_tests": 5,
  "untested_tests": 5,
  "percentage": 70.83
}
```

**Validation**: Verify calculation:
- `untested_tests = 40 - 30 - 5 = 5` ✅
- `percentage = ((30*3 - 5) / (40*3)) * 100 = 70.83` ✅

2. **Set mastery level**:
```bash
curl -X POST http://localhost:8000/api/planner/conclusion-plan/mastery/ \
  -H "Authorization: Bearer {access_token}" \
  -H "Content-Type: application/json" \
  -d '{
    "chapter_id": "{graph_chapter_uuid}",
    "level": 75
  }'
```

**Expected Response**: HTTP 201
```json
{
  "id": "...",
  "chapter_id": "...",
  "level": 75
}
```

3. **Test upsert logic** (submit same chapter/format/method again):
```bash
# Submit again with different values
curl -X POST http://localhost:8000/api/planner/conclusion-plan/test-records/ \
  -H "Authorization: Bearer {access_token}" \
  -H "Content-Type: application/json" \
  -d '{
    "chapter_id": "{graph_chapter_uuid}",
    "test_format": "EVEN",
    "test_method": "FEEDBACK",
    "total_tests": 45,
    "correct_tests": 35,
    "wrong_tests": 3
  }'
```

**Expected**: HTTP 200 (updated, not 201), existing record updated, not duplicated.

4. **Test validation** (invalid mastery level):
```bash
curl -X POST http://localhost:8000/api/planner/conclusion-plan/mastery/ \
  -H "Authorization: Bearer {access_token}" \
  -H "Content-Type: application/json" \
  -d '{
    "chapter_id": "{graph_chapter_uuid}",
    "level": 105
  }'
```

**Expected Response**: HTTP 400
```json
{
  "level": ["Mastery level must be between 1 and 100."]
}
```

### Success Criteria
✅ Test record created with correct calculations
✅ Mastery level set (1-100 validation enforced)
✅ Upsert logic prevents duplicates
✅ Validation rejects invalid inputs

---

## Validation Scenario 3: View Aggregated Performance (P2)

**User Story**: Students view consolidated read-only report combining time and test data.

### Test Steps

1. **Request performed weekly plan**:
```bash
curl http://localhost:8000/api/planner/weekly-performance/?week_start=2026-09-20 \
  -H "Authorization: Bearer {access_token}"
```

**Expected Response**:
```json
{
  "week_start": "2026-09-20",
  "week_end": "2026-09-26",
  "total_read_time_minutes": 120,
  "total_review_time_minutes": 60,
  "total_test_count": 1,
  "chapter_records": [
    {
      "chapter_id": "...",
      "chapter_title": "Graph Theory",
      "source_material_title": "Discrete Mathematics",
      "read_time_minutes": 120,
      "review_time_minutes": 60,
      "test_count": 1
    }
  ]
}
```

2. **Verify read-only** (no POST/PUT/PATCH/DELETE endpoints exist):
```bash
# Should return 405 Method Not Allowed
curl -X POST http://localhost:8000/api/planner/weekly-performance/ \
  -H "Authorization: Bearer {access_token}"
```

**Expected Response**: HTTP 405

3. **Verify aggregation accuracy**:
- total_read_time_minutes matches SUM of READING activities ✅
- total_review_time_minutes matches SUM of REVIEW activities ✅
- total_test_count matches COUNT of TestRecords ✅

### Success Criteria
✅ Aggregated data correctly combines StudyActivity and TestRecord
✅ Response structure matches contract
✅ No modification endpoints available (read-only)
✅ Frontend shows clear CTAs to edit sources

---

## Validation Scenario 4: Dashboard Hub (P2)

**User Story**: Students see centralized dashboard with records, notes, and widgets.

### Test Steps

1. **Fetch dashboard summary**:
```bash
curl http://localhost:8000/api/planner/dashboard/summary/ \
  -H "Authorization: Bearer {access_token}"
```

**Expected Response**:
```json
{
  "quote": "شروع کردن و تسلیم نشدن...",
  "countdown": {
    "target_name": "آزمون ارشد",
    "days": 227,
    "hours": 7,
    "minutes": 15
  },
  "records": {
    "total_study_hours": "03:00",
    "max_daily_study": "03:00",
    "total_tests": 1,
    "max_daily_tests": 1
  },
  "today_tasks": {
    "has_reviews": false,
    "has_studies": false
  }
}
```

2. **Save daily note**:
```bash
curl -X POST http://localhost:8000/api/planner/dashboard/notes/ \
  -H "Authorization: Bearer {access_token}" \
  -H "Content-Type: application/json" \
  -d '{
    "text": "Finished Graph Theory chapter today"
  }'
```

**Expected Response**: HTTP 201

3. **Test upsert** (save note again on same day):
```bash
curl -X POST http://localhost:8000/api/planner/dashboard/notes/ \
  -H "Authorization: Bearer {access_token}" \
  -H "Content-Type: application/json" \
  -d '{
    "text": "Updated: Finished Graph Theory AND started OS"
  }'
```

**Expected**: HTTP 200 (updated existing note, not duplicated)

4. **Book consultation**:
```bash
curl -X POST http://localhost:8000/api/planner/dashboard/consultations/ \
  -H "Authorization: Bearer {access_token}" \
  -H "Content-Type: application/json" \
  -d '{
    "day_of_week": 1,
    "time_slot": "09:00:00"
  }'
```

**Expected Response**: HTTP 201

### Success Criteria
✅ Dashboard summary shows aggregated records
✅ Daily note upsert works (no duplicates for same date)
✅ Consultation booking created successfully
✅ Response time < 2 seconds

---

## Validation Scenario 5: Generate Reports (P3)

**User Story**: Students generate structured reports in JSON or PDF format.

### Test Steps

1. **Generate JSON report**:
```bash
curl http://localhost:8000/api/planner/reports/full/?week_start=2026-09-20&format=json \
  -H "Authorization: Bearer {access_token}"
```

**Expected Response**: HTTP 200, Content-Type: application/json
```json
{
  "report_title": "گزارش کامل",
  "week_start": "2026-09-20",
  "week_end": "2026-09-26",
  "generated_at": "2026-09-23T11:00:00Z",
  "scheduled_data": {},
  "performed_data": {},
  "conclusion_data": {}
}
```

2. **Generate PDF report**:
```bash
curl http://localhost:8000/api/planner/reports/full/?week_start=2026-09-20&format=pdf \
  -H "Authorization: Bearer {access_token}" \
  --output report.pdf
```

**Expected Response**: HTTP 200, Content-Type: application/pdf, binary PDF file

3. **Verify PDF rendering**:
```bash
# Open report.pdf and verify:
# - RTL Persian text renders correctly (not inverted)
# - IRANSans font is used
# - Tables and data display properly
```

4. **Test performance**:
```bash
# Measure response time for 12-week full report
time curl http://localhost:8000/api/planner/reports/full/?start_date=2026-07-01&end_date=2026-09-23&format=pdf \
  -H "Authorization: Bearer {access_token}" \
  --output large_report.pdf
```

**Expected**: Response time < 5 seconds (FR requirement)

### Success Criteria
✅ JSON report returns structured data
✅ PDF report generates successfully
✅ RTL Persian text renders correctly with IRANSans font
✅ 12-week report completes in < 5 seconds

---

## Validation Scenario 6: Analytics Charts (P3)

**User Story**: Students view interactive charts showing study trends.

### Test Steps

1. **Fetch total activity chart data**:
```bash
curl "http://localhost:8000/api/planner/analytics/total-activity/?interval=weekly&start_date=2026-07-01&end_date=2026-09-23" \
  -H "Authorization: Bearer {access_token}"
```

**Expected Response**:
```json
{
  "summary": {
    "total_read_minutes": 120,
    "total_review_minutes": 60,
    "total_test_minutes": 0,
    "total_overall_minutes": 180
  },
  "line_chart": {
    "labels": ["هفته ۱", "هفته ۲", ...],
    "datasets": {
      "total": [3.0, ...],
      "read": [2.0, ...],
      "review": [1.0, ...],
      "test": [0, ...]
    }
  },
  "pie_chart": {
    "read": 66.67,
    "review": 33.33,
    "test": 0
  }
}
```

2. **Test caching** (make same request twice):
```bash
# First request (cache miss)
time curl "http://localhost:8000/api/planner/analytics/total-activity/?interval=weekly&start_date=2026-07-01&end_date=2026-09-23" \
  -H "Authorization: Bearer {access_token}"

# Second request (cache hit)
time curl "http://localhost:8000/api/planner/analytics/total-activity/?interval=weekly&start_date=2026-07-01&end_date=2026-09-23" \
  -H "Authorization: Bearer {access_token}"
```

**Expected**: Second request < 500ms (cached response)

3. **Test division by zero handling**:
```bash
# For a chapter with zero tests
curl "http://localhost:8000/api/planner/analytics/course-averages/?metric_type=time_per_test" \
  -H "Authorization: Bearer {access_token}"
```

**Expected**: Response with `0` or `null` for chapters with no tests (no crash)

### Success Criteria
✅ Chart data returns in correct format for Chart.js
✅ Cached requests respond in < 500ms
✅ Division by zero handled gracefully
✅ Data matches database aggregations

---

## Validation Scenario 7: Community & Leaderboard (P3)

**User Story**: Students engage with leaderboard and community opinions.

### Test Steps

1. **Submit community opinion**:
```bash
curl -X POST http://localhost:8000/api/community/opinions/ \
  -H "Authorization: Bearer {access_token}" \
  -H "Content-Type: application/json" \
  -d '{
    "text": "Six key lessons from my week...",
    "is_anonymous": true
  }'
```

**Expected Response**: HTTP 201
```json
{
  "id": "...",
  "message": "Opinion submitted successfully and is pending approval.",
  "status": "PENDING"
}
```

2. **Approve opinion** (as MODERATOR):
```bash
curl -X PATCH http://localhost:8000/api/community/opinions/{opinion_id}/ \
  -H "Authorization: Bearer {moderator_token}" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "APPROVED"
  }'
```

3. **Test concurrent voting** (simulate race condition):
```python
# Use Python script to simulate 100 concurrent votes
import requests
import concurrent.futures

def vote(session_id):
    response = requests.post(
        f'http://localhost:8000/api/community/opinions/{opinion_id}/vote/',
        headers={'Authorization': f'Bearer {tokens[session_id]}'},
        json={'value': 1}
    )
    return response.status_code

with concurrent.futures.ThreadPoolExecutor(max_workers=50) as executor:
    results = list(executor.map(vote, range(100)))

# Verify final count
response = requests.get(
    f'http://localhost:8000/api/community/opinions/{opinion_id}/',
    headers={'Authorization': f'Bearer {token}'}
)
assert response.json()['likes'] == 100  # Must be accurate
```

**Expected**: Final `likes` count = 100 (no lost updates)

4. **Check leaderboard**:
```bash
curl http://localhost:8000/api/community/leaderboard/?period=week \
  -H "Authorization: Bearer {access_token}"
```

**Expected Response**: HTTP 200, response time < 50ms
```json
{
  "total_active_users": 1,
  "period": "week",
  "results": [
    {
      "rank": 1,
      "user_id": "...",
      "username": "test_student",
      "total_study_hours": "03:00",
      "average_daily_hours": "00:25",
      "total_tests": 1,
      "average_daily_tests": 0
    }
  ]
}
```

5. **Verify anonymity**:
```bash
curl http://localhost:8000/api/community/opinions/?sort=recent \
  -H "Authorization: Bearer {access_token}"
```

**Expected**: Opinion with `is_anonymous=true` shows `"author": null`

### Success Criteria
✅ Opinion submitted and enters PENDING status
✅ MODERATOR can approve/reject
✅ 100 concurrent votes result in accurate count (no race conditions)
✅ Leaderboard responds from Redis in < 50ms
✅ Anonymous opinions hide author data

---

## Performance Validation

### Response Time Targets

Run these commands and measure response times:

```bash
# Dashboard summary: < 2s
time curl http://localhost:8000/api/planner/dashboard/summary/ -H "Authorization: Bearer {token}"

# Leaderboard: < 50ms (from Redis)
time curl http://localhost:8000/api/community/leaderboard/?period=week -H "Authorization: Bearer {token}"

# Analytics (cached): < 500ms
time curl "http://localhost:8000/api/planner/analytics/total-activity/?interval=weekly" -H "Authorization: Bearer {token}"

# PDF generation (12 weeks): < 5s
time curl "http://localhost:8000/api/planner/reports/full/?start_date=2026-07-01&end_date=2026-09-23&format=pdf" -H "Authorization: Bearer {token}" -o report.pdf
```

**Success Criteria**:
- All response times meet or beat targets
- No N+1 query issues (check Django Debug Toolbar)
- Redis cache hit rate > 90% for analytics/leaderboard

---

## Integration Validation

### Cross-Module Data Flow

Verify data flows correctly between modules:

1. **Time Tracking → Performed Plan**:
   - Log activities in Sub-module 5
   - Verify they appear in Sub-module 1 aggregation ✅

2. **Time + Tests → Dashboard**:
   - Log activities and tests
   - Verify records update in dashboard summary ✅

3. **Time + Tests → Leaderboard**:
   - Wait for Celery Beat hourly task
   - Verify leaderboard reflects new data ✅

4. **All Data → Reports & Analytics**:
   - Verify reports pull from CoreAnalyticsEngine
   - Verify analytics use same aggregation logic
   - Numbers should match between reports and analytics ✅

---

## Cleanup

```bash
# Stop services
# Ctrl+C in all terminals

# Drop test database (optional)
python manage.py flush --no-input

# Remove test files
rm report.pdf large_report.pdf
```

---

## Next Steps

After successful validation:
1. ✅ All 7 sub-modules validated end-to-end
2. ⚠️ Address curriculum app blocking issue (requires author approval)
3. 🔄 Proceed to `/speckit-tasks` to generate implementation tasks
4. 📋 Begin implementation following task sequence

For detailed implementation tasks, run:
```bash
/speckit-tasks
```
