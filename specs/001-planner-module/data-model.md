# Data Model: Planner Module

**Feature**: Planner Module (7 Sub-modules)
**Date**: 2026-09-23
**Phase**: Phase 1 - Data Model Design

## Overview

This document defines all database models for the Planner Module across two Django apps: `planner` (time tracking, analytics, reports) and `community` (social features, leaderboard). All models use `curriculum.SourceMaterialChapter` as the standardized granularity level for content hierarchy.

---

## Django App: `curriculum` (MUST BE CREATED FIRST)

### SourceMaterialChapter

**Purpose**: Standardized chapter-level granularity for all planner modules.

**Fields:**
- `id` (UUID, PK, auto-generated)
- `source_material` (ForeignKey → `qna.SourceMaterial`, CASCADE, related_name='chapters')
- `title` (CharField, max_length=255)
- `chapter_number` (PositiveIntegerField)
- `page_count` (PositiveIntegerField, null=True, blank=True)
- `created_at` (DateTimeField, auto_now_add=True)

**Constraints:**
- `unique_together = ['source_material', 'chapter_number']`

**Indexes:**
- Index on (`source_material`, `chapter_number`) for efficient lookups

**Validation:**
- `chapter_number` must be > 0
- `title` cannot be blank

**Relationships:**
- One SourceMaterial has many Chapters (1:N)
- One Chapter belongs to one SourceMaterial

**String Representation:**
```python
"{source_material.title} - Chapter {chapter_number}: {title}"
```

**Example:**
```
"Discrete Mathematics - Chapter 3: Graph Theory"
```

---

## Django App: `planner`

### 1. DailyStudyLog (Sub-module 5: Weekly Study Hours)

**Purpose**: Represents a student's log for a single date, tracking sleep and finalization status.

**Fields:**
- `id` (UUID, PK, auto-generated)
- `student` (ForeignKey → `accounts.User`, CASCADE, related_name='daily_study_logs')
- `date` (DateField)
- `sleep_duration_minutes` (PositiveIntegerField, default=0)
- `is_finalized` (BooleanField, default=False)
- `created_at` (DateTimeField, auto_now_add=True)
- `updated_at` (DateTimeField, auto_now=True)

**Constraints:**
- `unique_together = ['student', 'date']` (one log per student per day)

**Indexes:**
- Composite index on (`student`, `date`) for temporal queries
- Index on `date` for week boundary filtering

**Validation:**
- `sleep_duration_minutes` must be between 0 and 1440 (24 hours)
- `date` must pass temporal locking validation (current week + previous week only)

**Temporal Locking:**
- Enforced via `TimeLockService.validate_or_raise(date)` in serializer and view
- Returns 403 for dates older than previous week

**Jalali Support:**
- Expose `date_jalali` via serializer using `JalaliDateField` from `core.utils`

**Relationships:**
- One Student has many DailyStudyLogs (1:N)
- One DailyStudyLog has many StudyActivities (1:N)

**State Transitions:**
- Draft → Finalized (`is_finalized = False` → `True`)
- Finalized → Draft (can be un-finalized if within temporal window)

---

### 2. StudyActivity (Sub-module 5: Weekly Study Hours)

**Purpose**: Represents a single study session within a DailyStudyLog, linked to a specific chapter.

**Fields:**
- `id` (UUID, PK, auto-generated)
- `daily_log` (ForeignKey → `DailyStudyLog`, CASCADE, related_name='activities')
- `chapter` (ForeignKey → `curriculum.SourceMaterialChapter`, CASCADE, related_name='study_activities')
- `activity_type` (CharField, max_length=20, choices=ActivityType)
- `duration_minutes` (PositiveIntegerField, default=0)
- `created_at` (DateTimeField, auto_now_add=True)

**Enums:**
```python
class ActivityType(models.TextChoices):
    READING = 'READING', 'Reading'
    REVIEW = 'REVIEW', 'Review'
    CLASS = 'CLASS', 'Class Attendance'
```

**Note:** `TEST` activity type is NOT included (tests tracked in TestRecord model)

**Indexes:**
- Foreign key indexes on `daily_log` and `chapter` (auto-created)
- Composite index on (`chapter`, `activity_type`) for aggregation queries

**Validation:**
- `duration_minutes` must be > 0
- `activity_type` must be one of enum values

**Relationships:**
- One DailyStudyLog has many StudyActivities (1:N)
- One Chapter has many StudyActivities (1:N)

**Aggregation Usage:**
- Sub-module 1 (Performed Weekly Plan): aggregates by week + chapter
- Sub-module 3 (Dashboard): aggregates for total hours, max daily study
- Sub-module 7 (Analytics): time-series aggregations

---

### 3. TestRecord (Sub-module 2: Conclusion Plan & Test Analytics)

**Purpose**: Represents test performance for a chapter with specific format and method.

**Fields:**
- `id` (UUID, PK, auto-generated)
- `student` (ForeignKey → `accounts.User`, CASCADE, related_name='test_records')
- `chapter` (ForeignKey → `curriculum.SourceMaterialChapter`, CASCADE, related_name='test_records')
- `test_format` (CharField, max_length=20, choices=TestFormat)
- `test_method` (CharField, max_length=20, choices=TestMethod)
- `total_tests` (PositiveIntegerField)
- `correct_tests` (PositiveIntegerField)
- `wrong_tests` (PositiveIntegerField)
- `untested_tests` (PositiveIntegerField, editable=False) *Backend-calculated*
- `percentage` (DecimalField, max_digits=5, decimal_places=2, editable=False) *Backend-calculated*
- `created_at` (DateTimeField, auto_now_add=True)
- `updated_at` (DateTimeField, auto_now=True)

**Enums:**
```python
class TestFormat(models.TextChoices):
    ALL = 'ALL', 'All Questions'
    EVEN = 'EVEN', 'Even Questions'
    ODD = 'ODD', 'Odd Questions'
    THREE_K = '3K', '3K Format'
    THREE_K_1 = '3K_1', '3K Part 1'
    THREE_K_2 = '3K_2', '3K Part 2'
    FOUR_K = '4K', '4K Format'
    FOUR_K_1 = '4K_1', '4K Part 1'
    FOUR_K_2 = '4K_2', '4K Part 2'
    FOUR_K_3 = '4K_3', '4K Part 3'
    HALF_1 = 'HALF_1', 'First Half'
    HALF_2 = 'HALF_2', 'Second Half'
    IMPORTANT = 'IMPORTANT', 'Important Questions'
    THIRD_1 = 'THIRD_1', 'First Third'
    THIRD_2 = 'THIRD_2', 'Second Third'
    THIRD_3 = 'THIRD_3', 'Third Third'

class TestMethod(models.TextChoices):
    FEEDBACK = 'FEEDBACK', 'Feedback Method'
    WASHBACK = 'WASHBACK', 'Washback Method'
```

**Constraints:**
- `unique_together = ['student', 'chapter', 'test_format', 'test_method']` (upsert pattern)

**Indexes:**
- Composite index on (`student`, `chapter`) for conclusion grid queries
- Index on `created_at` for temporal analytics

**Validation:**
- `correct_tests + wrong_tests` must be ≤ `total_tests`
- All test counts must be ≥ 0

**Calculated Fields (on save):**
```python
def save(self, *args, **kwargs):
    # FR-003: Calculation formula
    self.untested_tests = self.total_tests - self.correct_tests - self.wrong_tests
    if self.total_tests > 0:
        self.percentage = ((self.correct_tests * 3) - self.wrong_tests) / (self.total_tests * 3) * 100
    else:
        self.percentage = 0
    super().save(*args, **kwargs)
```

**Upsert Logic:**
- FR-004: Serializer uses `get_or_create` + `update` pattern
- Prevents duplicate records violating unique constraint

**Relationships:**
- One Student has many TestRecords (1:N)
- One Chapter has many TestRecords (1:N)

---

### 4. ChapterMastery (Sub-module 2: Conclusion Plan & Test Analytics)

**Purpose**: Student's self-assessed mastery level for a chapter.

**Fields:**
- `id` (UUID, PK, auto-generated)
- `student` (ForeignKey → `accounts.User`, CASCADE, related_name='chapter_masteries')
- `chapter` (ForeignKey → `curriculum.SourceMaterialChapter`, CASCADE, related_name='masteries')
- `level` (PositiveSmallIntegerField) *1 to 100*
- `created_at` (DateTimeField, auto_now_add=True)
- `updated_at` (DateTimeField, auto_now=True)

**Constraints:**
- `unique_together = ['student', 'chapter']`

**Validation:**
- FR-006: `level` must be between 1 and 100 inclusive

**Upsert Logic:**
- FR-005: Serializer uses `get_or_create` + `update` pattern

**Relationships:**
- One Student has many ChapterMasteries (1:N)
- One Chapter has many ChapterMasteries (1:N)
- Independent from TestRecords (self-assessment, not calculated)

---

### 5. DailyNote (Sub-module 3: Dashboard & Student Tools)

**Purpose**: Personal note for a specific date.

**Fields:**
- `id` (UUID, PK, auto-generated)
- `student` (ForeignKey → `accounts.User`, CASCADE, related_name='daily_notes')
- `date` (DateField)
- `text` (TextField)
- `created_at` (DateTimeField, auto_now_add=True)
- `updated_at` (DateTimeField, auto_now=True)

**Constraints:**
- `unique_together = ['student', 'date']`

**Validation:**
- `text` cannot be blank

**Upsert Logic:**
- FR-009: Multiple saves on same date update existing note (not duplicate)

**Jalali Support:**
- Expose `date_jalali` via serializer

**Relationships:**
- One Student has many DailyNotes (1:N)

---

### 6. ConsultationBooking (Sub-module 3: Dashboard & Student Tools)

**Purpose**: Weekly recurring consultation booking.

**Fields:**
- `id` (UUID, PK, auto-generated)
- `student` (ForeignKey → `accounts.User`, CASCADE, related_name='consultation_bookings')
- `day_of_week` (PositiveSmallIntegerField) *1=Monday to 7=Sunday*
- `time_slot` (TimeField)
- `created_at` (DateTimeField, auto_now_add=True)

**Validation:**
- `day_of_week` must be between 1 and 7
- `time_slot` format: HH:MM:SS

**Relationships:**
- One Student has many ConsultationBookings (1:N)

**Note:** No unique constraint (students can book multiple slots)

---

## Django App: `community`

### 7. StudentOpinion (Sub-module 4: Community & Leaderboard)

**Purpose**: User-submitted motivational opinion/review with moderation workflow.

**Fields:**
- `id` (UUID, PK, auto-generated)
- `author` (ForeignKey → `accounts.User`, CASCADE, related_name='opinions')
- `text` (TextField)
- `is_anonymous` (BooleanField, default=False)
- `status` (CharField, max_length=20, choices=OpinionStatus, default='PENDING')
- `likes` (PositiveIntegerField, default=0)
- `dislikes` (PositiveIntegerField, default=0)
- `created_at` (DateTimeField, auto_now_add=True)
- `updated_at` (DateTimeField, auto_now=True)

**Enums:**
```python
class OpinionStatus(models.TextChoices):
    PENDING = 'PENDING', 'Pending Approval'
    APPROVED = 'APPROVED', 'Approved'
    REJECTED = 'REJECTED', 'Rejected'
```

**Indexes:**
- Index on `status` for filtering approved opinions
- Composite index on (`status`, `created_at`) for sorting
- Index on (`likes`, `dislikes`) for top sorting

**Validation:**
- `text` cannot be blank
- `likes` and `dislikes` must be ≥ 0

**State Transitions:**
- PENDING → APPROVED (by MODERATOR/ADMIN)
- PENDING → REJECTED (by MODERATOR/ADMIN)
- No transitions from APPROVED or REJECTED

**Visibility Rules:**
- APPROVED: visible to all authenticated users
- PENDING: visible only to author + MODERATOR/ADMIN
- REJECTED: visible only to MODERATOR/ADMIN

**Anonymity:**
- FR-022: When `is_anonymous=True`, serializer must strip `author` field (return null to frontend)

**Counter Updates:**
- FR-021: Use Django F() expressions for atomic updates (prevent race conditions)

**Relationships:**
- One User (author) has many StudentOpinions (1:N)
- One StudentOpinion has many OpinionVotes (1:N)

---

### 8. OpinionVote (Sub-module 4: Community & Leaderboard)

**Purpose**: User's vote on an opinion (like/dislike).

**Fields:**
- `id` (UUID, PK, auto-generated)
- `opinion` (ForeignKey → `StudentOpinion`, CASCADE, related_name='votes')
- `user` (ForeignKey → `accounts.User`, CASCADE, related_name='opinion_votes')
- `vote_type` (SmallIntegerField) *1=like, -1=dislike*
- `created_at` (DateTimeField, auto_now_add=True)
- `updated_at` (DateTimeField, auto_now=True)

**Constraints:**
- `unique_together = ['opinion', 'user']` (one vote per user per opinion)

**Validation:**
- `vote_type` must be 1 or -1

**Vote Toggle Logic:**
- User can change vote (like → dislike, dislike → like)
- User can remove vote (delete OpinionVote record)
- Counter updates must be atomic using F() expressions

**Relationships:**
- One Opinion has many OpinionVotes (1:N)
- One User has many OpinionVotes (1:N)

---

## Virtual Entities (No Database Tables)

### WeeklyPerformanceSummary (Sub-module 1)

**Purpose**: Read-only aggregation of StudyActivity + TestRecord per chapter for a given week.

**Computed Fields:**
- `week_start` (Date)
- `week_end` (Date)
- `total_read_time_minutes` (Integer, aggregated)
- `total_review_time_minutes` (Integer, aggregated)
- `total_test_count` (Integer, aggregated)
- `chapter_records` (List of ChapterPerformance)

**ChapterPerformance Structure:**
- `chapter_id` (UUID)
- `chapter_title` (String)
- `source_material_title` (String)
- `read_time_minutes` (Integer)
- `review_time_minutes` (Integer)
- `test_count` (Integer)

**Aggregation Source:**
- StudyActivity: filtered by date range, grouped by chapter, activity_type
- TestRecord: filtered by created_at date range, counted by chapter

---

### DashboardSummary (Sub-module 3)

**Purpose**: Aggregated data for dashboard top-level statistics.

**Computed Fields:**
- `quote` (String, hardcoded or random Persian motivational quote)
- `countdown` (Object: days, hours, minutes to target exam date)
- `records.total_study_hours` (String, HH:MM format)
- `records.max_daily_study` (String, HH:MM format)
- `records.total_tests` (Integer)
- `records.max_daily_tests` (Integer)
- `today_tasks.has_reviews` (Boolean)
- `today_tasks.has_studies` (Boolean)

**Aggregation Source:**
- StudyActivity: SUM(duration_minutes) for total hours
- TestRecord: COUNT(*) for total tests
- Daily maximums: GROUP BY date, MAX()

---

### LeaderboardEntry (Sub-module 4)

**Purpose**: Cached top-10 student rankings stored in Redis.

**Redis Key Pattern:**
- `leaderboard:day`
- `leaderboard:week`
- `leaderboard:month`
- `leaderboard:three_months`

**Structure (JSON in Redis):**
```json
{
  "total_active_users": 3972,
  "period": "week",
  "results": [
    {
      "rank": 1,
      "user_id": "uuid",
      "username": "فاطمه",
      "avatar_url": "https://...",
      "major": "مهندسی فناوری اطلاعات",
      "total_study_hours": "62:15",
      "average_daily_hours": "08:54",
      "total_tests": 150,
      "average_daily_tests": 21
    }
  ]
}
```

**Calculation (Celery Task):**
- Aggregates StudyActivity and TestRecord data
- Sorts by total_study_hours DESC, then total_tests DESC
- Top 10 per period
- Updated hourly via Celery Beat

**TTL:** No TTL (persists until next hourly update)

---

## Model Relationships Diagram

```
accounts.User (EXISTING)
    ├── 1:N → DailyStudyLog
    ├── 1:N → TestRecord
    ├── 1:N → ChapterMastery
    ├── 1:N → DailyNote
    ├── 1:N → ConsultationBooking
    ├── 1:N → StudentOpinion
    └── 1:N → OpinionVote

qna.SourceMaterial (EXISTING)
    └── 1:N → curriculum.SourceMaterialChapter (NEW)
            ├── 1:N → StudyActivity
            ├── 1:N → TestRecord
            └── 1:N → ChapterMastery

DailyStudyLog
    └── 1:N → StudyActivity

StudentOpinion
    └── 1:N → OpinionVote
```

---

## Migration Strategy

### Phase 1: Curriculum App (BLOCKING)
1. Create `curriculum` app
2. Create `SourceMaterialChapter` model
3. Run migrations
4. Seed with sample chapters for testing

### Phase 2: Planner App
1. Create all 6 planner models (DailyStudyLog, StudyActivity, TestRecord, ChapterMastery, DailyNote, ConsultationBooking)
2. Run migrations
3. Add database indexes
4. Add CHECK constraints for validation

### Phase 3: Community App
1. Create 2 community models (StudentOpinion, OpinionVote)
2. Run migrations
3. Add database indexes

### Rollback Plans
- Each migration must document rollback SQL
- Additive-only migrations (no destructive operations on existing tables)
- Foreign key to SourceMaterialChapter added in separate migration after curriculum app creation

---

## Performance Considerations

**Indexes:**
- All foreign keys auto-indexed
- Composite indexes on frequently-queried combinations:
  - (`student`, `date`) on DailyStudyLog
  - (`chapter`, `activity_type`) on StudyActivity
  - (`student`, `chapter`) on TestRecord
  - (`status`, `created_at`) on StudentOpinion

**Aggregation Optimization:**
- Use `select_related()` for foreign key traversal
- Use `prefetch_related()` for reverse relationships
- Use `annotate()` + `aggregate()` for computed values
- Cache heavy aggregations in Redis (analytics, leaderboard)

**N+1 Query Prevention:**
- Always use `select_related('chapter__source_material')` when fetching StudyActivity/TestRecord
- Prefetch activities when fetching DailyStudyLog list

**Database Constraints:**
- `unique_together` prevents duplicate data
- CHECK constraints for range validation (e.g., `level BETWEEN 1 AND 100`)
