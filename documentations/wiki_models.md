# Wiki App Models Documentation

## Overview
The `wiki` app manages the core content of the UniQAKNTU platform: questions from exams and instructor-provided answers. The architecture has been refactored from a Wiki-style single-answer model to an **Instructor-led Multi-Answer system** where multiple instructors can provide different solutions to the same question.

## Models

### 1. Question Model
**Location:** `apps/wiki/models.py`

Represents a question from an exam. Questions are tied to specific exams and have a sequential number within that exam.

#### Fields

| Field | Type | Description |
|-------|------|-------------|
| `exam` | ForeignKey (curriculum.Exam) | Reference to the parent Exam. On delete: CASCADE. Related name: `questions`. |
| `text` | TextField | The full text of the question. |
| `image` | ImageField (optional) | Optional image associated with the question (e.g., diagrams). Uploads to `questions/`. |
| `question_number` | IntegerField | Sequential number of the question within the exam. |

#### Meta Options
- `verbose_name = 'Question'`
- `verbose_name_plural = 'Questions'`
- `ordering = ['exam', 'question_number']`
- `unique_together = ['exam', 'question_number']` - Ensures each question number is unique per exam.

#### Relationships
- **One-to-Many with Exam:** Each exam can have multiple questions.
- **One-to-Many with Answer:** Each question can have multiple answers from different instructors (via `related_name='answers'`).

---

### 2. Answer Model
**Location:** `apps/wiki/models.py`

Represents an instructor's answer to a question. Multiple instructors can provide different answers to the same question, but each instructor can only submit one answer per question.

#### Fields

| Field | Type | Description |
|-------|------|-------------|
| `question` | ForeignKey (Question) | Reference to the parent Question. On delete: CASCADE. Related name: `answers`. |
| `current_body` | TextField | The current content of the answer (Markdown format). |
| `author` | ForeignKey (User) | Reference to the instructor who authored this answer. On delete: CASCADE. Related name: `authored_answers`. |
| `is_verified` | BooleanField | Default: `False`. Indicates if this answer has been verified/marked as correct by an admin. |

#### Meta Options
- `verbose_name = 'Answer'`
- `verbose_name_plural = 'Answers'`
- `unique_together = ['question', 'author']` - **Critical constraint:** Prevents the same instructor from submitting multiple distinct answers to the same question.

#### Key Architectural Changes
1. **ForeignKey instead of OneToOneField:** Changed from `question = models.OneToOneField(...)` to `question = models.ForeignKey(...)`. This allows multiple answers per question.
2. **Added `is_verified` field:** Allows marking certain answers as verified/correct.
3. **Unique Together Constraint:** The `unique_together = ['question', 'author']` constraint ensures data integrity by preventing duplicate answers from the same author.

#### Example Usage
```python
from apps.wiki.models import Question, Answer

# Get all answers for a question
question = Question.objects.get(pk=1)
all_answers = question.answers.all()  # Returns QuerySet of all instructor answers

# Check if an instructor already answered
existing_answer = Answer.objects.filter(
    question=question,
    author=request.user
).first()

if not existing_answer and request.user.is_instructor:
    # Allow creating new answer
    Answer.objects.create(
        question=question,
        current_body="Solution here...",
        author=request.user
    )
```

---

### 3. AnswerRevision Model
**Location:** `apps/wiki/models.py`

Tracks the revision history of an instructor's answer. Unlike the previous Wiki-style model where revisions represented community edits, this model now serves as **personal revision history** for each instructor's own answer.

#### Fields

| Field | Type | Description |
|-------|------|-------------|
| `answer` | ForeignKey (Answer) | Reference to the parent Answer. On delete: CASCADE. Related name: `revisions`. |
| `body` | TextField | The content of this revision (snapshot of the answer at this point in time). |
| `editor` | ForeignKey (User) | Reference to the user who made this revision. Typically the same as `answer.author`. On delete: CASCADE. Related name: `answer_revisions`. |
| `created_at` | DateTimeField | Auto-set on creation (`auto_now_add=True`). Timestamp of when this revision was created. |
| `edit_summary` | CharField (optional) | Optional brief description of what changed in this revision. Max length: 255. |

#### Meta Options
- `verbose_name = 'Answer Revision'`
- `verbose_name_plural = 'Answer Revisions'`
- `ordering = ['-created_at']` (Newest revisions first)

#### Behavioral Notes
- **Personal History:** Revisions now track changes made by an instructor to their own answer, not community-wide edits.
- **No Rollback Conflicts:** Since each instructor manages their own isolated answer, there's no risk of concurrent edit conflicts between different users.
- **Audit Trail:** Provides a complete history of how an answer evolved over time.

#### Example Usage
```python
from apps.wiki.models import Answer, AnswerRevision

# Create a revision before updating an answer
answer = Answer.objects.get(pk=1)
AnswerRevision.objects.create(
    answer=answer,
    body=answer.current_body,  # Save old content
    editor=request.user,
    edit_summary="Updating algorithm explanation"
)

# Now update the answer
answer.current_body = "New solution..."
answer.save()
```

---

## Database Schema Summary

### wiki_question table
- `id` (INTEGER, PRIMARY KEY)
- `exam_id` (INTEGER, FOREIGN KEY -> curriculum_exam.id)
- `text` (TEXT)
- `image` (VARCHAR, NULL)
- `question_number` (INTEGER)
- **Unique Index:** `(exam_id, question_number)`

### wiki_answer table
- `id` (INTEGER, PRIMARY KEY)
- `question_id` (INTEGER, FOREIGN KEY -> wiki_question.id)
- `current_body` (TEXT)
- `author_id` (INTEGER, FOREIGN KEY -> auth_user.id)
- `is_verified` (BOOLEAN)
- **Unique Index:** `(question_id, author_id)` - Prevents duplicate answers from same author

### wiki_answerrevision table
- `id` (INTEGER, PRIMARY KEY)
- `answer_id` (INTEGER, FOREIGN KEY -> wiki_answer.id)
- `body` (TEXT)
- `editor_id` (INTEGER, FOREIGN KEY -> auth_user.id)
- `created_at` (DATETIME)
- `edit_summary` (VARCHAR(255), NULL)

---

## Access Control Rules

1. **Read Access:** All users (authenticated or not) can view questions and answers.
2. **Create Answer:** Only users with `is_instructor=True` can create answers.
3. **Edit Answer:** Only the original author (`answer.author`) can edit their own answer.
4. **Delete Answer:** Only the original author or admin/staff can delete an answer.
5. **View Revisions:** All users can view the revision history of any answer.

---

## Migration Notes

When migrating from the old Wiki-style model:
1. The `OneToOneField` on `Answer.question` was changed to `ForeignKey`.
2. Existing data will be preserved; each existing answer becomes one of potentially many answers for its question.
3. The `unique_together` constraint must be enforced after migration to prevent future duplicates.
