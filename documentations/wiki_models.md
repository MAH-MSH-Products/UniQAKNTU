# Wiki App Models Documentation

## Overview
The `wiki` app manages the core Q&A functionality of the UniQAKNTU platform. It handles questions from exams and instructor-provided answers with support for file uploads (images and PDFs). The system uses a multi-answer architecture where multiple instructors can provide different solutions to the same question.

## Models

### Question Model
**Location:** `apps/wiki/models.py`

Represents a question from an exam.

#### Fields

| Field Name | Type | Description |
|------------|------|-------------|
| `exam` | ForeignKey (Exam) | Reference to the parent Exam. On delete: CASCADE. Related name: `questions` |
| `text` | TextField | The full text content of the question |
| `image` | ImageField | Optional image associated with the question (e.g., diagrams). Upload path: `questions/` |
| `question_number` | IntegerField | The sequential number of the question within the exam |

#### Meta Options
- `verbose_name`: `'Question'`
- `verbose_name_plural`: `'Questions'`
- `ordering`: `['exam', 'question_number']`
- `unique_together`: `['exam', 'question_number']` - Ensures each question number is unique per exam

#### Methods
- `__str__()`: Returns `f"Question {self.question_number} - {self.exam}"`

---

### Answer Model
**Location:** `apps/wiki/models.py`

Represents an instructor's answer to a question. Multiple instructors can provide different answers to the same question.

#### Fields

| Field Name | Type | Default | Description |
|------------|------|---------|-------------|
| `question` | ForeignKey (Question) | - | Reference to the Question being answered. On delete: CASCADE. Related name: `answers` (allows `question.answers.all()`) |
| `current_body` | TextField | `null`, blank | The Markdown-formatted text content of the answer. Can be empty if the answer consists only of uploaded files. |
| `author` | ForeignKey (User) | - | Reference to the instructor who authored the answer. On delete: CASCADE. Related name: `authored_answers` |
| `is_verified` | BooleanField | `False` | Indicates if the answer has been verified by an admin or course supervisor |
| `image` | ImageField | `null`, blank | Optional image upload for the answer (e.g., hand-written solution photos). Upload path: `answers/images/` |
| `pdf_file` | FileField | `null`, blank | Optional PDF file upload for the answer (e.g., typed solution documents). Upload path: `answers/pdfs/` |

#### Meta Options
- `verbose_name`: `'Answer'`
- `verbose_name_plural`: `'Answers'`
- `unique_together`: `['question', 'author']` - **Critical constraint** that prevents the same instructor from posting multiple distinct answers to the same question

#### Methods
- `__str__()`: Returns `f"Answer by {self.author.username} to {self.question}"`

#### Key Constraints and Behavior

##### ForeignKey Relationship (Multi-Answer System)
- The `question` field is a **ForeignKey**, NOT a OneToOneField
- This allows multiple instructors to provide different answers to the same question
- Each instructor can only have ONE answer per question (enforced by `unique_together`)

##### unique_together Constraint
```python
unique_together = ['question', 'author']
```
This constraint ensures:
1. An instructor cannot submit multiple separate answers to the same question
2. If an instructor wants to modify their answer, they must edit the existing one (creating an `AnswerRevision`)
3. Different instructors CAN each have their own answer for the same question

##### File Upload Support
- **`image` field**: Stores uploaded images (PNG, JPG, etc.) in `MEDIA_ROOT/answers/images/`
  - Use case: Hand-written solutions, diagrams, graphs
  - Access via: `answer.image.url` or `answer.image.path`
  
- **`pdf_file` field**: Stores uploaded PDF documents in `MEDIA_ROOT/answers/pdfs/`
  - Use case: Typed solutions, formal documents
  - Access via: `answer.pdf_file.url` or `answer.pdf_file.path`

- **`current_body` field**: Now optional (blank=True, null=True) to allow answers that consist solely of file uploads

#### Usage Examples

```python
# Get all answers for a question
question = Question.objects.get(pk=1)
all_answers = question.answers.all()  # Returns QuerySet of Answer objects

# Check if an instructor already has an answer for a question
existing_answer = Answer.objects.filter(
    question=question,
    author=request.user
).first()

# Create an answer with file uploads
answer = Answer.objects.create(
    question=question,
    author=user,
    current_body="## Solution\nUsing dynamic programming...",
    image=request.FILES.get('solution_image'),
    pdf_file=request.FILES.get('solution_pdf')
)

# Access uploaded files
if answer.image:
    image_url = answer.image.url  # /media/answers/images/solution_1.png
    
if answer.pdf_file:
    pdf_url = answer.pdf_file.url  # /media/answers/pdfs/solution_1.pdf
```

---

### AnswerRevision Model
**Location:** `apps/wiki/models.py`

Tracks the revision history of an instructor's answer. This serves as personal revision history for an instructor's own answer, not community history.

#### Fields

| Field Name | Type | Description |
|------------|------|-------------|
| `answer` | ForeignKey (Answer) | Reference to the Answer being revised. On delete: CASCADE. Related name: `revisions` |
| `body` | TextField | The Markdown content of this specific revision |
| `editor` | ForeignKey (User) | Reference to the user who made this revision. On delete: CASCADE. Related name: `answer_revisions` |
| `created_at` | DateTimeField | Auto-set timestamp when the revision was created (`auto_now_add=True`) |
| `edit_summary` | CharField | Optional summary describing the changes made in this revision (max 255 chars) |

#### Meta Options
- `verbose_name`: `'Answer Revision'`
- `verbose_name_plural`: `'Answer Revisions'`
- `ordering`: `['-created_at']` - Most recent revisions first

#### Methods
- `__str__()`: Returns `f"Revision of {self.answer} by {self.editor.username} at {self.created_at}"`

#### Usage Notes
- Created automatically when an instructor updates their answer
- The `editor` should typically be the same as `answer.author` (instructors can only edit their own answers)
- The `body` field captures the state of `answer.current_body` at the time of revision
- File uploads (`image`, `pdf_file`) are NOT tracked in revisions - only the text body history is maintained

## Admin Configuration

### QuestionAdmin
- Displays `question_number`, `text`, and `exam` in list view
- Filters by `exam`
- Searchable by `text` and `question_number`

### AnswerAdmin
- Displays `question`, `author`, `current_body`, `is_verified`, `image`, and `pdf_file` in list view
- Filters by `author` and `is_verified`
- Searchable by question text and author username
- `image` and `pdf_file` are readonly fields (display only)

### AnswerRevisionAdmin
- Displays `answer`, `editor`, `created_at`, and `edit_summary` in list view
- Filters by `editor` and `created_at`
- Searchable by answer question text and editor username
- Ordered by most recent first

## Related Documentation
- See `accounts_models.md` for User model and RBAC fields
- See `wiki_views.md` for `ExamBulkAnswerView` with file upload handling
- See `API.md` for endpoints supporting multipart/form-data uploads
