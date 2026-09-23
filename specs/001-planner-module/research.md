# Research: Planner Module Implementation

**Feature**: Planner Module (7 Sub-modules)
**Date**: 2026-09-23
**Phase**: Phase 0 - Research & Decision Documentation

## Overview

This document consolidates research findings for all technical unknowns and technology choices required for implementing the Planner Module. Each decision is documented with rationale, alternatives considered, and implementation guidance.

---

## 1. Curriculum App & Chapter Granularity Model

### Decision: Create new `curriculum` Django app with `SourceMaterialChapter` model

### Rationale
**Current State:**
- ❌ No `curriculum` app exists in backend
- ❌ No chapter-level granularity model exists
- ✓ Only `SourceMaterial` (book/course level) exists in `qna.models`

**Requirement:**
- All 7 planner sub-modules depend on `curriculum.SourceMaterialChapter` for foreign key references
- FR-023 mandates chapter-level granularity across all planner modules
- Without this model, no planner features can be implemented

**Impact:**
- **Blocking dependency** for entire planner module
- Requires explicit approval from both project authors per constitution (destructive-like change affecting data model hierarchy)

### Alternatives Considered
1. **Use existing `SourceMaterial` directly** 
   - ❌ Rejected: Too coarse granularity (book level, not chapter level)
   - ❌ Violates spec requirement for chapter-level tracking

2. **Create `Chapter` model in `planner` app**
   - ❌ Rejected: Violates domain boundaries (curriculum hierarchy should be in dedicated app)
   - ❌ Would create coupling between planner and curriculum concerns

3. **Create `curriculum` app with proper hierarchy** ✅ **CHOSEN**
   - ✓ Clean domain separation
   - ✓ Allows future expansion (sections, topics, etc.)
   - ✓ Matches architectural pattern (dedicated app per domain)

### Implementation Guidance

**Step 1: Create curriculum app**
```bash
cd backend
python manage.py startapp curriculum
```

**Step 2: Define models in `backend/curriculum/models.py`**
```python
from django.db import models

class SourceMaterialChapter(models.Model):
    """
    Represents a chapter within a source material (book/course).
    This is the standardized granularity level for all planner modules.
    """
    source_material = models.ForeignKey(
        'qna.SourceMaterial',
        on_delete=models.CASCADE,
        related_name='chapters'
    )
    title = models.CharField(max_length=255)
    chapter_number = models.PositiveIntegerField()
    page_count = models.PositiveIntegerField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'curriculum_sourcematerialchapter'
        ordering = ['source_material', 'chapter_number']
        unique_together = ['source_material', 'chapter_number']
        verbose_name = 'Source Material Chapter'
        verbose_name_plural = 'Source Material Chapters'
    
    def __str__(self):
        return f"{self.source_material.title} - Chapter {self.chapter_number}: {self.title}"
```

**Step 3: Register in settings.py**
```python
INSTALLED_APPS = [
    # ... existing apps ...
    'curriculum.apps.CurriculumConfig',  # Add before planner/community
    # ... rest ...
]
```

**Step 4: Create and run migrations**
```bash
python manage.py makemigrations curriculum
python manage.py migrate curriculum
```

**Step 5: Document rollback plan**
Migration rollback plan must include:
- Reversal SQL (drop table, restore constraints)
- Data preservation: export chapter data if populated
- Estimated downtime: minimal (new table, no foreign key from existing models yet)

---

## 2. Celery Beat Configuration for Leaderboard

### Decision: Use manual `CELERY_BEAT_SCHEDULE` in settings.py

### Rationale
**Current State:**
- ✓ Celery configured (`backend/core/celery.py` exists)
- ✓ Redis configured as broker/backend
- ❌ Celery Beat schedule not configured

**Requirement:**
- FR-018: Hourly task to calculate and cache top 10 students in Redis
- Fixed schedule (not dynamic)
- Single periodic task required

**Why Manual Schedule:**
- ✓ Simple, no additional dependencies
- ✓ Perfect for static schedules defined at deployment
- ✓ No database overhead
- ❌ django-celery-beat adds migrations, DB tables, admin overhead (overkill for single task)

### Alternatives Considered
1. **django-celery-beat (database-backed)**
   - ❌ Rejected: Adds complexity for single static schedule
   - ❌ Requires migrations, DB queries per schedule check
   - ✓ Good for: dynamic schedules managed via admin

2. **Manual CELERY_BEAT_SCHEDULE** ✅ **CHOSEN**
   - ✓ Zero additional dependencies
   - ✓ Configuration as code (version controlled)
   - ✓ Perfect for fixed hourly schedule
   - ❌ Cannot change schedule without deployment (acceptable for this use case)

### Implementation Guidance

**Add to `backend/core/settings.py`:**
```python
from celery.schedules import crontab

# Celery Beat Schedule
CELERY_BEAT_SCHEDULE = {
    'recalculate-leaderboard-hourly': {
        'task': 'community.tasks.recalculate_leaderboard',
        'schedule': crontab(minute=0),  # Every hour at :00
        'options': {
            'expires': 3300,  # Task expires after 55 minutes
        },
    },
}

CELERY_TIMEZONE = 'Asia/Tehran'  # Match Django TIME_ZONE
CELERY_TASK_TRACK_STARTED = True
CELERY_TASK_SEND_SENT_EVENT = True
CELERY_BEAT_SCHEDULER = 'celery.beat:PersistentScheduler'
```

**Task implementation pattern (`backend/community/tasks.py`):**
```python
from celery import shared_task
from celery.utils.log import get_task_logger
from django.db import transaction
from django.apps import apps

logger = get_task_logger(__name__)

@shared_task(
    bind=True,
    max_retries=3,
    soft_time_limit=1800,  # 30 minutes
    time_limit=1900,
)
def recalculate_leaderboard(self):
    try:
        logger.info("Starting leaderboard recalculation")
        
        # Safe cross-app read-only query
        StudyActivity = apps.get_model('planner', 'StudyActivity')
        TestRecord = apps.get_model('planner', 'TestRecord')
        
        # Aggregate data for each period (day, week, month, three_months)
        # Calculate top 10 students
        # Store in Redis as JSON
        
        logger.info("Leaderboard recalculation completed")
    except Exception as exc:
        logger.error(f"Leaderboard recalculation failed: {exc}")
        raise self.retry(exc=exc, countdown=300)
```

**Deployment:**
- Worker process: `celery -A core worker --loglevel=info`
- Beat process: `celery -A core beat --loglevel=info`
- Both must run as supervised processes (systemd/Docker)

---

## 3. Chart Library for Analytics

### Decision: Use **react-chartjs-2 v5.3.1** with **Chart.js v4.5.1**

### Rationale
**Current State:**
- ❌ No existing Chart.js implementation found in frontend
- ❌ No chart libraries in current package.json
- ✓ Spec mentions "migration from vanilla Chart.js" but this is aspirational - **fresh implementation required**

**Compatibility:**
- ✓ react-chartjs-2 v5.3.1 fully supports React 19.2
- ✓ Actively maintained, Chart.js v4.x is latest stable
- ✓ Well-documented, large community

**Why react-chartjs-2:**
- ✓ Native React component API (no DOM manipulation)
- ✓ Hooks support for responsive charts
- ✓ TypeScript definitions available
- ✓ Battle-tested in production applications

### Alternatives Considered

1. **Recharts**
   - ✓ Pure React, no dependencies
   - ❌ Limited RTL support
   - ❌ Less flexible for complex customizations
   - ❌ Smaller ecosystem

2. **Victory**
   - ✓ React-native compatible
   - ❌ Larger bundle size
   - ❌ Steeper learning curve
   - ❌ Overkill for this use case

3. **Native Chart.js with vanilla DOM**
   - ❌ Requires manual ref management in React
   - ❌ Lifecycle issues (cleanup, re-renders)
   - ❌ Not idiomatic React

### RTL Support Configuration

**Chart.js requires manual RTL configuration for Persian:**

```javascript
// Shared chart configuration
const rtlChartOptions = {
  rtl: true,
  locale: 'fa-IR',
  plugins: {
    legend: {
      rtl: true,
      textDirection: 'rtl'
    },
    tooltip: {
      rtl: true,
      textDirection: 'rtl'
    }
  }
};
```

**CSS Override:**
```css
/* frontend/src/index.css */
.chartjs-container {
  direction: rtl;
}
```

**Known Issues:**
- Tooltips may render incorrectly without explicit `rtl: true`
- Mixed Persian text + numbers need custom callbacks
- Default tooltip positioning needs adjustment for RTL

### Persian Number Formatting

**No native support - custom utility required:**

```javascript
// frontend/src/utils/persianNumbers.js
export const toPersianNumber = (num) => {
  const persianDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
  return String(num).replace(/\d/g, d => persianDigits[d]);
};
```

**Apply to chart elements via callbacks:**
```javascript
options: {
  scales: {
    y: {
      ticks: {
        callback: (value) => toPersianNumber(value)
      }
    }
  },
  plugins: {
    tooltip: {
      callbacks: {
        label: (context) => toPersianNumber(context.parsed.y)
      }
    }
  }
}
```

### Implementation Guidance

**Add to `frontend/package.json`:**
```json
{
  "dependencies": {
    "react-chartjs-2": "^5.3.1",
    "chart.js": "^4.5.1"
  }
}
```

**Install:**
```bash
cd frontend
npm install react-chartjs-2 chart.js
```

**Create shared chart utilities:**
```javascript
// frontend/src/utils/chartConfig.js
import { toPersianNumber } from './persianNumbers';

export const getBaseRTLConfig = () => ({
  rtl: true,
  locale: 'fa-IR',
  plugins: {
    legend: {
      rtl: true,
      textDirection: 'rtl'
    },
    tooltip: {
      rtl: true,
      textDirection: 'rtl',
      callbacks: {
        label: (context) => {
          const label = context.dataset.label || '';
          const value = toPersianNumber(context.parsed.y);
          return `${label}: ${value}`;
        }
      }
    }
  },
  scales: {
    y: {
      ticks: {
        callback: (value) => toPersianNumber(value)
      }
    }
  }
});
```

**Example chart component:**
```jsx
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';
import { getBaseRTLConfig } from '../../utils/chartConfig';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

export const TotalActivityChart = ({ data }) => {
  const options = {
    ...getBaseRTLConfig(),
    responsive: true,
    maintainAspectRatio: false
  };

  return (
    <div className="chartjs-container" style={{ height: '400px' }}>
      <Line data={data} options={options} />
    </div>
  );
};
```

**Chart components to create:**
- `TotalActivityChart.jsx` - Line + Pie charts
- `CourseAverageChart.jsx` - Bar chart
- `TimeAllocationChart.jsx` - Bar + Table
- `StackedActivityChart.jsx` - Stacked bar chart
- `DateRangeFilter.jsx` - Date picker with interval tabs

**Best Practices:**
1. Register Chart.js components once globally (in main App.jsx or index.jsx)
2. Create wrapper component to abstract RTL/Persian config
3. Separate data fetching from chart rendering
4. Use React Query or SWR for chart data caching
5. Test mixed Persian text + numbers in tooltips thoroughly

---

## 4. PDF Generation Library

### Decision: Use **WeasyPrint** for PDF generation

### Rationale
**Comparison Summary:**

| Criteria | WeasyPrint | wkhtmltopdf | ReportLab |
|----------|-----------|-------------|-----------|
| RTL Persian Support | ✅ Native | ✅ Native | ❌ Requires preprocessing |
| IRANSans Font | ✅ CSS @font-face | ✅ CSS @font-face | ⚠️ Manual registration |
| HTML/CSS Conversion | ✅ Excellent | ✅ Excellent | ❌ No (programmatic API) |
| Installation | ✅ Low (pip + libs) | ❌ High (binary + xvfb) | ✅ Low (pip only) |
| Performance (<5s) | ✅ Expected to meet | ✅ Likely faster | ✅ Fast but irrelevant |
| Active Maintenance | ✅ Yes | ❌ Maintenance mode | ✅ Yes |
| Docker-Friendly | ✅ Yes | ⚠️ Requires work | ✅ Yes |

**Why WeasyPrint:**
- ✓ Native RTL support via CSS `direction: rtl` with proper bidirectional text handling (Pango library)
- ✓ Works with existing HTML templates (spec states "templates exist as HTML")
- ✓ Pure Python, pip-installable (easier deployment)
- ✓ Active development (unlike wkhtmltopdf in maintenance mode)
- ✓ Should meet <5s performance target for tabular reports

### Alternatives Considered

1. **wkhtmltopdf (via pdfkit)**
   - ❌ Rejected: Project in maintenance mode, not actively developed
   - ❌ Complex deployment (external binary + xvfb for headless)
   - ✓ Faster rendering, but not worth operational overhead

2. **ReportLab**
   - ❌ Rejected: No native BiDi/RTL support (requires arabic-reshaper + python-bidi preprocessing)
   - ❌ Not HTML-based (requires rewriting templates in ReportLab API)
   - ❌ Incompatible with "templates exist as HTML" requirement

### Implementation Guidance

**Add to `backend/requirements.txt`:**
```txt
weasyprint>=60.0
```

**System Dependencies (Linux server):**
```bash
# Debian/Ubuntu
sudo apt-get install python3-cffi python3-brotli libpango-1.0-0 libpangoft2-1.0-0 libharfbuzz-subset0

# Alpine (Docker)
apk add cairo pango gdk-pixbuf
```

**Required libraries:**
- Cairo (≥1.15.4) - graphics rendering
- Pango - text layout and RTL handling
- GdkPixbuf - image support
- HarfBuzz - text shaping for complex scripts

**Font Installation:**
Place IRANSans fonts in:
```
backend/apps/planner/static/fonts/IRANSans/
├── IRANSans-Regular.ttf
├── IRANSans-Bold.ttf
└── IRANSans-Light.ttf
```

**CSS Configuration in HTML templates:**
```css
@font-face {
    font-family: 'IRANSans';
    src: url('file:///absolute/path/to/IRANSans-Regular.ttf') format('truetype');
    font-weight: normal;
}

@font-face {
    font-family: 'IRANSans';
    src: url('file:///absolute/path/to/IRANSans-Bold.ttf') format('truetype');
    font-weight: bold;
}

body {
    font-family: 'IRANSans', Tahoma, Arial, sans-serif;
    direction: rtl;
    text-align: right;
}
```

**Python Service Implementation:**
```python
# backend/apps/planner/services/pdf_export_service.py
from weasyprint import HTML, CSS
from weasyprint.text.fonts import FontConfiguration
from django.conf import settings
import os

class PdfExportService:
    def __init__(self):
        self.font_config = FontConfiguration()
        self.base_url = os.path.join(settings.BASE_DIR, 'apps', 'planner')
    
    def generate_pdf(self, html_content, css_content=None):
        html = HTML(string=html_content, base_url=self.base_url)
        
        stylesheets = []
        if css_content:
            css = CSS(string=css_content, font_config=self.font_config)
            stylesheets.append(css)
        
        pdf_bytes = html.write_pdf(
            stylesheets=stylesheets,
            font_config=self.font_config
        )
        return pdf_bytes
```

**RTL Rendering Best Practices:**
1. Always set `lang="fa"` and `dir="rtl"` on HTML element or container divs
2. Use absolute `file://` URLs for font paths in production
3. Include fallback fonts (Tahoma, Arial) for missing glyphs
4. For mixed LTR/RTL content, wrap in `<span dir="ltr">` where needed
5. Tables need explicit `direction: rtl` on both `<table>` and `<td>` elements
6. Reuse `FontConfiguration` instance across PDF generations for performance (caches font data)

---

## 5. Temporal Locking Pattern

### Decision: Use **Service Class with Serializer + View Validation**

### Rationale
**Pattern Comparison:**

| Approach | Reusability | Testability | Separation of Concerns | Our Use Case Fit |
|----------|-------------|-------------|------------------------|------------------|
| Service Class | ✅ High | ✅ Easy | ✅ Excellent | ✅ Perfect |
| Validator Class | ⚠️ Medium | ✅ Easy | ✅ Good | ⚠️ Limited scope |
| View Mixin | ❌ View-only | ⚠️ Harder | ⚠️ Couples views | ❌ Not flexible |
| Middleware | ❌ Too broad | ❌ Complex | ❌ Wrong layer | ❌ Overkill |

**Why Service Class:**
- ✓ Matches existing project pattern (already uses services for OTP, email)
- ✓ Reusable across views, serializers, model methods, Celery tasks
- ✓ Centralizes temporal logic in one place
- ✓ Easy to test with frozen time (pytest monkeypatch or freezegun)
- ✓ Defense in depth: can be called at serializer AND view level

**Week Calculation Logic:**
- Sunday-Saturday boundaries (isoweekday % 7)
- Timezone-aware (uses Django's timezone utilities with Asia/Tehran)
- Handles both `date` and `datetime` objects
- Returns microsecond-precise boundaries for edge case testing

### Alternatives Considered

1. **Validator Class (Django/DRF validator)**
   - ❌ Rejected: Limited to serializer/form validation context
   - ❌ Cannot be easily used in Celery tasks or model methods
   - ✓ Good for: simple field-level validation

2. **View Mixin**
   - ❌ Rejected: Requires mixing into every view that touches DailyStudyLog
   - ❌ Doesn't help with serializer validation
   - ❌ Less testable (must test through HTTP layer)

3. **Middleware**
   - ❌ Rejected: Too broad scope (would check every request)
   - ❌ Wrong layer of abstraction for business rule
   - ❌ Complex to test and debug

### Implementation Guidance

**Create service class:**
```python
# backend/apps/planner/services/time_lock_service.py
from datetime import datetime, timedelta
from django.utils import timezone
from django.conf import settings
from zoneinfo import ZoneInfo
from rest_framework.exceptions import PermissionDenied

class TimeLockService:
    """
    Temporal validation service for DailyStudyLog records.
    Enforces FR-002: Students can only modify logs within current week 
    (Sunday-Saturday) or immediately preceding week.
    """
    
    @staticmethod
    def get_week_boundaries(date_obj):
        """
        Calculate Sunday-Saturday week boundaries for a given date.
        Returns: (week_start: datetime, week_end: datetime) both timezone-aware
        """
        tz = ZoneInfo(settings.TIME_ZONE)  # 'Asia/Tehran'
        
        if isinstance(date_obj, datetime):
            dt = date_obj.astimezone(tz)
        else:
            dt = datetime.combine(date_obj, datetime.min.time())
            dt = timezone.make_aware(dt, tz)
        
        # isoweekday: Monday=1, Sunday=7
        days_since_sunday = dt.isoweekday() % 7
        week_start = (dt - timedelta(days=days_since_sunday)).replace(
            hour=0, minute=0, second=0, microsecond=0
        )
        week_end = (week_start + timedelta(days=6)).replace(
            hour=23, minute=59, second=59, microsecond=999999
        )
        
        return week_start, week_end
    
    @staticmethod
    def is_date_editable(target_date):
        """
        Check if date falls within current week or previous week.
        Returns: bool
        """
        now = timezone.now()
        current_week_start, current_week_end = TimeLockService.get_week_boundaries(now)
        prev_week_start = current_week_start - timedelta(days=7)
        prev_week_end = current_week_start - timedelta(microseconds=1)
        
        tz = ZoneInfo(settings.TIME_ZONE)
        if isinstance(target_date, datetime):
            target_dt = target_date.astimezone(tz)
        else:
            target_dt = datetime.combine(target_date, datetime.min.time())
            target_dt = timezone.make_aware(target_dt, tz)
        
        in_current_week = current_week_start <= target_dt <= current_week_end
        in_previous_week = prev_week_start <= target_dt <= prev_week_end
        
        return in_current_week or in_previous_week
    
    @staticmethod
    def validate_or_raise(target_date):
        """
        Validate date editability and raise PermissionDenied (HTTP 403) if outside range.
        """
        if not TimeLockService.is_date_editable(target_date):
            raise PermissionDenied(
                "Cannot edit logs older than the previous week."
            )
```

**Integrate in serializer:**
```python
# backend/apps/planner/serializers.py
class DailyStudyLogSerializer(serializers.ModelSerializer):
    def validate_date(self, value):
        # For updates: check if date is changing
        if self.instance and self.instance.date != value:
            TimeLockService.validate_or_raise(value)
        
        # For creates: validate the new date
        if not self.instance:
            TimeLockService.validate_or_raise(value)
        
        return value
```

**Integrate in views (defense in depth):**
```python
# backend/apps/planner/views/weekly_hours_views.py
class DailyStudyLogViewSet(viewsets.ModelViewSet):
    def update(self, request, *args, **kwargs):
        instance = self.get_object()
        TimeLockService.validate_or_raise(instance.date)
        return super().update(request, *args, **kwargs)
```

**Testing approach:**
```python
# backend/apps/planner/tests/test_temporal_locking.py
import pytest
from datetime import date
from django.utils import timezone

@pytest.fixture
def fixed_now(monkeypatch):
    """Freeze time at Wednesday, Sep 23, 2026, 10:52 Asia/Tehran"""
    from zoneinfo import ZoneInfo
    from datetime import datetime
    
    tz = ZoneInfo('Asia/Tehran')
    fixed_time = datetime(2026, 9, 23, 10, 52, 0, tzinfo=tz)
    
    class FrozenTimezone:
        @staticmethod
        def now():
            return fixed_time
    
    monkeypatch.setattr('django.utils.timezone.now', FrozenTimezone.now)
    return fixed_time

def test_current_week_is_editable(fixed_now):
    """Sep 20-26 should be editable (current week)"""
    for day in range(20, 27):
        test_date = date(2026, 9, day)
        assert TimeLockService.is_date_editable(test_date) is True

def test_previous_week_is_editable(fixed_now):
    """Sep 13-19 should be editable (previous week)"""
    for day in range(13, 20):
        test_date = date(2026, 9, day)
        assert TimeLockService.is_date_editable(test_date) is True

def test_older_than_previous_week_not_editable(fixed_now):
    """Sep 12 and older should NOT be editable"""
    old_date = date(2026, 9, 12)
    assert TimeLockService.is_date_editable(old_date) is False
```

**Edge cases handled:**
- Exact boundary conditions (Sunday 00:00, Saturday 23:59:59.999999)
- Timezone conversions (Asia/Tehran)
- Both `date` and `datetime` object types
- Week-spanning months (e.g., week starting in August, ending in September)

---

## 6. Atomic Counter Updates (Voting)

### Decision: Use **Django F() expressions with @transaction.atomic()**

### Rationale
**How F() Expressions Prevent Race Conditions:**
- Without F(): Python reads value → modifies in memory → writes back (vulnerable to lost updates)
- With F(): Database executes `UPDATE table SET likes = likes + 1` atomically in single operation
- No window for race conditions even with 100+ simultaneous requests

**Why This Pattern:**
- ✓ Built-in Django feature (no external dependencies)
- ✓ Database-level atomicity (works across all Django-supported databases)
- ✓ Prevents race conditions without explicit locking
- ✓ High performance (single UPDATE query regardless of load)
- ✓ Meets SC-009 requirement (100 simultaneous votes → accurate counts)

### Alternatives Considered

1. **select_for_update() (row-level locking)**
   - ❌ Rejected: Requires explicit transaction management
   - ❌ Can cause deadlocks under high concurrency
   - ❌ Slower than F() expressions (locks entire row)
   - ✓ Good for: complex validation logic requiring consistent reads

2. **Optimistic locking (version field)**
   - ❌ Rejected: Requires retry logic in application
   - ❌ Poor user experience (votes can fail and require retry)
   - ❌ Adds complexity (version field management)
   - ✓ Good for: infrequent updates with complex business rules

3. **Redis atomic increments**
   - ❌ Rejected: Adds complexity (sync between Redis and PostgreSQL)
   - ❌ Redis is cache, not source of truth
   - ❌ Complicates data consistency
   - ✓ Good for: pure counters with no relational needs

### Implementation Guidance

**Vote toggle logic (all transitions):**
```python
# backend/apps/community/views.py
from django.db import transaction
from django.db.models import F
from rest_framework import status
from rest_framework.decorators import action
from rest_framework.response import Response

@action(detail=True, methods=['post'])
@transaction.atomic()
def vote(self, request, pk=None):
    """
    Vote on an opinion. Handles all transitions:
    - Neutral → Like/Dislike
    - Like → Neutral/Dislike
    - Dislike → Neutral/Like
    """
    opinion = self.get_object()
    vote_value = request.data.get('value')  # 1 (like), -1 (dislike), 0 (remove)
    
    try:
        existing_vote = OpinionVote.objects.get(
            opinion=opinion,
            user=request.user
        )
        
        # Revert old vote's counter effect
        if existing_vote.vote_type == 1:  # was like
            opinion.likes = F('likes') - 1
        elif existing_vote.vote_type == -1:  # was dislike
            opinion.dislikes = F('dislikes') - 1
        
        if vote_value == 0:
            # Remove vote entirely
            existing_vote.delete()
        else:
            # Change vote type
            existing_vote.vote_type = vote_value
            existing_vote.save()
            
            # Apply new vote's counter effect
            if vote_value == 1:
                opinion.likes = F('likes') + 1
            elif vote_value == -1:
                opinion.dislikes = F('dislikes') + 1
        
        opinion.save()
        
    except OpinionVote.DoesNotExist:
        # New vote
        if vote_value != 0:
            OpinionVote.objects.create(
                opinion=opinion,
                user=request.user,
                vote_type=vote_value
            )
            
            if vote_value == 1:
                opinion.likes = F('likes') + 1
            elif vote_value == -1:
                opinion.dislikes = F('dislikes') + 1
            
            opinion.save()
    
    # Refresh to get actual counter values for response
    opinion.refresh_from_db()
    
    return Response({
        'likes': opinion.likes,
        'dislikes': opinion.dislikes,
        'user_vote': vote_value
    })
```

**Critical F() gotchas:**
1. **Cannot use F() values in Python logic immediately**: After `F('likes') + 1`, field contains F() expression object, not integer. Always call `refresh_from_db()` if you need actual value.
2. **Refresh behavior varies by database**: PostgreSQL auto-refreshes, MySQL may not. Always explicitly refresh for portability.
3. **Serialization**: F() objects cannot be serialized. Refresh before returning in API responses.

**Testing concurrent updates:**
```python
# backend/apps/community/tests/test_voting_atomicity.py
from django.test import TransactionTestCase
from concurrent.futures import ThreadPoolExecutor

class VoteRaceConditionTest(TransactionTestCase):
    def test_100_simultaneous_votes_accurate_counts(self):
        """SC-009: 100 simultaneous users voting must result in accurate counts"""
        opinion = StudentOpinion.objects.create(likes=0, dislikes=0)
        users = [User.objects.create(username=f'user{i}') for i in range(100)]
        
        def vote_like(user):
            # Simulate API call
            self.client.force_authenticate(user=user)
            self.client.post(f'/api/community/opinions/{opinion.id}/vote/', {'value': 1})
        
        # 100 concurrent requests
        with ThreadPoolExecutor(max_workers=50) as executor:
            list(executor.map(vote_like, users))
        
        # Verify accuracy - no lost updates
        opinion.refresh_from_db()
        self.assertEqual(opinion.likes, 100)
        self.assertEqual(opinion.dislikes, 0)
        self.assertEqual(OpinionVote.objects.filter(opinion=opinion).count(), 100)
```

**Performance note:** F() expressions are highly efficient - generate single UPDATE queries regardless of counter value, work correctly under heavy concurrent load (100+ simultaneous updates).

---

## 7. Persian Calendar Integration (Frontend)

### Decision: Use existing `jdatetime` backend utilities + React calendar library

### Rationale
**Current State:**
- ✓ Backend has `jdatetime` library (v4.1.1)
- ✓ Custom serializer fields exist (`JalaliDateField`, `JalaliDateTimeField` in `backend/core/utils.py`)
- ✓ Pattern: store Gregorian in DB, expose both ISO 8601 and Jalali via API

**Requirement:**
- FR-024: Frontend must render `*_jalali` fields in UI
- Dashboard needs Persian calendar widget (client-side, no backend)

**Frontend Approach:**
- Backend: Continue using existing `jdatetime` serializers (no changes needed)
- Frontend: Add `react-multi-date-picker` with Persian locale for calendar widgets
- Display: Use `*_jalali` fields from API responses directly (already formatted)

### Implementation Guidance

**Add to `frontend/package.json`:**
```json
{
  "dependencies": {
    "react-multi-date-picker": "^4.3.0"
  }
}
```

**Example usage:**
```jsx
import DatePicker from "react-multi-date-picker";
import persian from "react-date-object/calendars/persian";
import persian_fa from "react-date-object/locales/persian_fa";

<DatePicker
  calendar={persian}
  locale={persian_fa}
  value={selectedDate}
  onChange={setSelectedDate}
/>
```

**For display-only dates:** Use `*_jalali` fields from API directly (no conversion needed).

---

## Summary of Research Findings

### All Research Complete ✅

| Research Area | Decision | Status | Blocking? |
|---------------|----------|--------|-----------|
| Curriculum App & Chapter Model | Create new `curriculum` app with `SourceMaterialChapter` | ✅ Complete | ❌ **CRITICAL BLOCKER** |
| Celery Beat Configuration | Manual `CELERY_BEAT_SCHEDULE` in settings.py | ✅ Complete | ⚠️ High Priority |
| Chart Library | react-chartjs-2 v5.3.1 + Chart.js v4.5.1 | ✅ Complete | ⚠️ Medium Priority |
| PDF Generation | WeasyPrint (≥60.0) | ✅ Complete | ⚠️ Medium Priority |
| Temporal Locking | Service class with serializer + view validation | ✅ Complete | ⚠️ High Priority |
| Atomic Voting | Django F() expressions with @transaction.atomic() | ✅ Complete | ⚠️ High Priority |
| Persian Calendar (Frontend) | react-multi-date-picker + existing jdatetime backend | ✅ Complete | ⚠️ Low Priority |

### Critical Path Dependencies

**BLOCKING ISSUE - Must Resolve Before Implementation:**

1. **Curriculum App Creation** (Priority: CRITICAL)
   - Current State: ❌ App does not exist
   - Impact: Blocks ALL 7 planner sub-modules
   - Action Required: Create `curriculum` app with `SourceMaterialChapter` model
   - Approval Needed: Both project authors (per constitution, affects data model hierarchy)
   - Estimated Effort: 2-3 hours (app creation, model, migrations, tests)

**Implementation-Ready Decisions:**

2. **Celery Beat** - Ready to configure (add CELERY_BEAT_SCHEDULE to settings.py)
3. **Chart Library** - Ready to install (npm install react-chartjs-2 chart.js)
4. **PDF Generation** - Ready to install (pip install weasyprint, configure fonts)
5. **Temporal Locking** - Ready to implement (service class pattern documented)
6. **Atomic Voting** - Ready to implement (F() expression pattern documented)
7. **Persian Calendar** - Ready to install (npm install react-multi-date-picker)

### Dependencies to Add

**Backend (`backend/requirements.txt`):**
```txt
weasyprint>=60.0
```

**Frontend (`frontend/package.json`):**
```json
{
  "dependencies": {
    "react-chartjs-2": "^5.3.1",
    "chart.js": "^4.5.1",
    "react-multi-date-picker": "^4.3.0"
  }
}
```

### Next Steps

1. ✅ **Phase 0 Complete** - All research findings documented
2. ⚠️ **Curriculum App Blocker** - Requires approval from both authors before proceeding
3. 🔄 **Proceed to Phase 1** - Generate data-model.md, contracts/, quickstart.md (can design models that reference SourceMaterialChapter, even though it doesn't exist yet)
4. 📋 **Post-Phase 1** - Implementation phase (/speckit-tasks) will create the curriculum app first, then planner/community apps
