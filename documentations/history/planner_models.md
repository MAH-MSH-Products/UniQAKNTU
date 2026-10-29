# Planner Models Documentation

## Purpose
`backend/planner/models.py` defines the domain entities for the educational study planning system. In Sub-module 1 (Performed Weekly Plan), these models provide the database foundation for tracking educational chapters, daily study logs, individual study activities, and test assessment records.

## Key Components

### 1. `Chapter` Model
- **Inherits from**: `core.models.BaseModel` (UUID primary key, created_at, updated_at).
- **Fields**:
  - `title` (`CharField(max_length=255)`): Title of the chapter/topic (e.g., "گراف", "مشتق").
  - `source_material` (`ForeignKey('source_materials.SourceMaterial', on_delete=CASCADE, related_name='chapters')`): Link to parent course source material.
  - `order` (`PositiveIntegerField(default=0)`): Sequential order of the chapter within the course material.
  - `description` (`TextField(blank=True, default='')`): Detailed topic objectives and syllabus notes.
- **Methods**:
  - `__str__()`: Returns `"{source_material.title} - {title}"`.

### 2. `DailyStudyLog` Model
- **Inherits from**: `core.models.BaseModel`.
- **Fields**:
  - `student` (`ForeignKey(settings.AUTH_USER_MODEL, on_delete=CASCADE, related_name='daily_study_logs')`): The student executing the study log.
  - `log_date` (`DateField()`): Calendar date of the recorded session.
- **Meta**:
  - Unique constraint on `('student', 'log_date')`.
  - Ordering: `['-log_date']`.

### 3. `StudyActivity` Model
- **Inherits from**: `core.models.BaseModel`.
- **Fields**:
  - `daily_log` (`ForeignKey(DailyStudyLog, on_delete=CASCADE, related_name='activities')`): Associated daily log.
  - `chapter` (`ForeignKey(Chapter, on_delete=CASCADE, related_name='study_activities')`): Associated chapter.
  - `activity_type` (`CharField(max_length=20, choices=ActivityType.choices, default=ActivityType.READING)`):
    - Choices: `READING` (خواندن), `REVIEW` (مرور), `SUMMARY` (خلاصه‌نویسی).
  - `duration_minutes` (`PositiveIntegerField()`): Study session duration in minutes.
- **Meta**:
  - Ordering: `['created_at']`.

### 4. `TestRecord` Model
- **Inherits from**: `core.models.BaseModel`.
- **Fields**:
  - `daily_log` (`ForeignKey(DailyStudyLog, on_delete=CASCADE, related_name='test_records')`): Associated daily log.
  - `chapter` (`ForeignKey(Chapter, on_delete=CASCADE, related_name='test_records')`): Associated chapter.
  - `total_tests` (`PositiveIntegerField(default=0)`): Total number of test items attempted.
  - `correct_tests` (`PositiveIntegerField(default=0)`): Total number of questions answered correctly.
  - `incorrect_tests` (`PositiveIntegerField(default=0)`): Total number of questions answered incorrectly.
- **Meta**:
  - Ordering: `['created_at']`.

## Usage
Used by Django ORM queries, migrations, admin panels, and aggregation services (such as `PerformedPlanAggregationService`).

## Integration
- Interacts with `backend/source_materials/models.py` via `Chapter.source_material`.
- Consumed by `PerformedPlanAggregationService` to calculate weekly totals for reading, reviewing, and testing.
