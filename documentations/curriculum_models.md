# Curriculum Models Documentation

**File**: `backend/curriculum/models.py`  
**Created**: 2026-09-23  
**Last Updated**: 2026-09-23

---

## Purpose

This module defines the data models for the curriculum management system, specifically providing chapter-level granularity for source materials (books/courses). The primary purpose is to enable the planner module to track student activities and test performance at the chapter level rather than just at the book/course level.

**Key Responsibility**: Provide standardized chapter-level granularity across all planner modules to ensure consistent data tracking and reporting.

---

## Key Components

### SourceMaterialChapter Model

Represents a chapter within a source material (book/course). This is the foundational granularity level for all planner module tracking.

#### Fields

- **source_material** (ForeignKey → `qna.SourceMaterial`)
  - The parent source material (book/course) this chapter belongs to
  - CASCADE deletion: if a source material is deleted, all its chapters are also deleted
  - Related name: `chapters` (access via `source_material.chapters.all()`)

- **title** (CharField, max_length=255)
  - Chapter title (e.g., "Graph Theory", "Binary Trees")
  - Cannot be blank (validated in `clean()` method)
  - Searchable in admin interface

- **chapter_number** (PositiveIntegerField)
  - Chapter number within the source material (e.g., 1, 2, 3)
  - Must be ≥ 1 (enforced via `MinValueValidator`)
  - Used for ordering chapters sequentially

- **page_count** (PositiveIntegerField, optional)
  - Number of pages in this chapter
  - Nullable (not all source materials have page counts)
  - Used for time allocation calculations in planner

- **created_at** (DateTimeField, auto_now_add)
  - Timestamp when the chapter was created
  - Read-only, automatically set on creation

#### Constraints

- **Unique Together**: `(source_material, chapter_number)`
  - Prevents duplicate chapter numbers within the same source material
  - Enforced at database level via unique constraint
  - Example: Cannot have two "Chapter 3" entries for the same book

#### Indexes

- **Composite Index**: `(source_material, chapter_number)`
  - Optimizes queries that filter or order by source material and chapter number
  - Critical for planner module performance when fetching chapters

#### Methods

- **`__str__()`**: Returns human-readable representation
  - Format: `"{source_material.title} - Chapter {chapter_number}: {title}"`
  - Example: `"Discrete Mathematics - Chapter 3: Graph Theory"`

- **`clean()`**: Validates model data before saving
  - Ensures `chapter_number` ≥ 1
  - Ensures `title` is not blank or whitespace-only
  - Raises `ValidationError` with field-specific error messages

#### Meta Options

- **db_table**: `curriculum_sourcematerialchapter`
- **ordering**: `['source_material', 'chapter_number']` (chapters sorted by book, then by number)
- **verbose_name**: "Source Material Chapter"
- **verbose_name_plural**: "Source Material Chapters"

---

## Usage

### Creating a Chapter

```python
from curriculum.models import SourceMaterialChapter
from qna.models import SourceMaterial

# Get or create source material
discrete_math = SourceMaterial.objects.get(title='Discrete Mathematics')

# Create chapter
chapter = SourceMaterialChapter.objects.create(
    source_material=discrete_math,
    title='Graph Theory',
    chapter_number=3,
    page_count=50
)
```

### Querying Chapters

```python
# Get all chapters for a source material (ordered automatically)
chapters = discrete_math.chapters.all()

# Get specific chapter by number
chapter_3 = discrete_math.chapters.get(chapter_number=3)

# Filter chapters with page counts
chapters_with_pages = SourceMaterialChapter.objects.filter(
    page_count__isnull=False
)

# Get chapter with related source material (avoid N+1)
chapter = SourceMaterialChapter.objects.select_related('source_material').get(id=chapter_id)
```

### Validation

```python
# Validation is automatic when using forms or serializers
# For manual validation:
chapter = SourceMaterialChapter(
    source_material=discrete_math,
    title='   ',  # Invalid: blank title
    chapter_number=0  # Invalid: must be ≥ 1
)

try:
    chapter.full_clean()  # Triggers validation
except ValidationError as e:
    print(e.message_dict)
    # {'title': ['Chapter title cannot be blank.'],
    #  'chapter_number': ['Chapter number must be greater than 0.']}
```

### Admin Interface

The model is registered in Django admin with:
- **List display**: chapter_number, title, source_material, page_count, created_at
- **Filters**: source_material, created_at
- **Search**: title, source_material__title
- **Ordering**: source_material, chapter_number
- **Read-only fields**: created_at

---

## Integration

### Dependencies

**Required**:
- `qna.SourceMaterial` model (must exist before curriculum app)
- Django core validators (`MinValueValidator`)

**Dependent Apps**:
- `planner` app (references SourceMaterialChapter in StudyActivity, TestRecord, ChapterMastery)
- `community` app (indirectly via planner data aggregations)

### Foreign Key Relationships

**Incoming (models that reference SourceMaterialChapter)**:
- `planner.StudyActivity.chapter` → SourceMaterialChapter
- `planner.TestRecord.chapter` → SourceMaterialChapter
- `planner.ChapterMastery.chapter` → SourceMaterialChapter

**Outgoing (models this references)**:
- `curriculum.SourceMaterialChapter.source_material` → qna.SourceMaterial

### Usage in Planner Module

The planner module uses SourceMaterialChapter as the standardized granularity for:

1. **Time Tracking** (StudyActivity):
   ```python
   from curriculum.models import SourceMaterialChapter
   from planner.models import StudyActivity
   
   chapter = SourceMaterialChapter.objects.get(id=chapter_id)
   activity = StudyActivity.objects.create(
       daily_log=daily_log,
       chapter=chapter,
       activity_type='READING',
       duration_minutes=120
   )
   ```

2. **Test Performance** (TestRecord):
   ```python
   test_record = TestRecord.objects.create(
       student=student,
       chapter=chapter,
       test_format='EVEN',
       total_tests=40,
       correct_tests=30
   )
   ```

3. **Mastery Tracking** (ChapterMastery):
   ```python
   mastery = ChapterMastery.objects.create(
       student=student,
       chapter=chapter,
       level=85
   )
   ```

### Migration Strategy

**Initial Setup**:
1. Apply curriculum migration first: `python manage.py migrate curriculum`
2. Seed chapters (if needed): `python manage.py loaddata initial_chapters.json`
3. Apply planner migrations (these depend on curriculum)

**Rollback Strategy** (documented in migration 0001_initial.py):
- Planner models must be removed BEFORE rolling back curriculum
- Export chapter data before rollback: `python manage.py dumpdata curriculum`
- Rollback command: `python manage.py migrate curriculum zero`

---

## Change Log

### 2026-09-23 - Initial Creation
- Created SourceMaterialChapter model
- Added unique constraint on (source_material, chapter_number)
- Added composite index for query optimization
- Implemented custom validation in clean() method
- Registered model in Django admin
- Created initial migration (0001_initial.py) with documented rollback plan
- **Status**: Awaiting approval from both project authors per constitution section V

### Future Enhancements
- **Chapter Prerequisites**: Track prerequisite relationships between chapters
- **Chapter Resources**: Link to supplementary materials (PDFs, videos)
- **Chapter Tags**: Categorize chapters by topics/difficulty
- **Chapter Progress**: Track completion percentage per student (may belong in planner)

---

## Notes

- **Constitutional Compliance**: This is an additive-only change; no existing models modified
- **Blocking Dependency**: Planner module implementation cannot proceed without this model
- **Performance**: Composite index on (source_material, chapter_number) ensures efficient queries
- **Data Integrity**: Unique constraint prevents duplicate chapter numbers per source material
- **Validation**: Both database-level (constraints) and application-level (clean method) validation
- **Cascade Deletion**: If a SourceMaterial is deleted, all its chapters are automatically deleted
  - **Important**: Deleting chapters will cascade to planner data (StudyActivity, TestRecord, ChapterMastery)
  - Use soft deletion or archive pattern if historical data must be preserved
