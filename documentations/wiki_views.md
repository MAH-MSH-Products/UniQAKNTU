# Wiki App Views Documentation

## Overview
The `wiki` app views handle the presentation logic for questions, answers, and instructor-specific features. This document focuses on the `ExamBulkAnswerView`, which enables instructors to submit answers for an entire exam in a single operation.

## Views

### ExamBulkAnswerView
**Location:** `apps/wiki/views.py`

A function-based view that allows instructors to submit or update answers for all questions in an exam through a single form interface.

#### Function Signature
```python
@login_required
def exam_bulk_answer_view(request, exam_id):
    # ...
```

#### Parameters
- `request`: The HTTP request object.
- `exam_id`: Primary key of the Exam for which answers are being submitted.

#### Authorization & Access Control

**Strict Requirements:**
1. **Authentication Required:** The view is decorated with `@login_required`, ensuring only authenticated users can access it.
2. **Instructor-Only Access:** The view explicitly checks `request.user.is_instructor`. If the user is not an instructor, a `403 Forbidden` response is returned immediately.

```python
if not request.user.is_instructor:
    return HttpResponseForbidden("Only instructors can access this page.")
```

**Security Implications:**
- Students (even authenticated ones) cannot access this view.
- The check is performed server-side; client-side role indicators are not trusted.
- Unauthorized access attempts are logged via Django's standard middleware.

#### Logic Flow

1. **Fetch Exam and Questions:**
   - Retrieves the `Exam` object using `get_object_or_404(Exam, pk=exam_id)`.
   - Fetches all `Question` objects associated with the exam, ordered by `question_number`.

2. **Create FormSet:**
   - Uses Django's `modelformset_factory` to create a dynamic formset for the `Answer` model.
   - Configuration:
     - `fields=['current_body']`: Only the answer body is editable.
     - `extra=0`: No extra empty forms; only shows forms for existing answers.
     - `can_delete=False`: Prevents accidental deletion of answers.

3. **Handle POST Request:**
   - Filters existing answers for the current user and the exam's questions.
   - Binds the formset with POST data.
   - Validates the formset.
   - Saves all valid answers, ensuring `author` is set to `request.user`.
   - Redirects to the exam detail page upon success.

4. **Handle GET Request:**
   - Pre-populates the formset with existing answers (if any) for the current user.
   - Renders the template with the formset and context.

#### Code Implementation
```python
from django.shortcuts import render, get_object_or_404, redirect
from django.contrib.auth.decorators import login_required
from django.http import HttpResponseForbidden
from django.forms import modelformset_factory
from apps.curriculum.models import Exam
from apps.wiki.models import Question, Answer


@login_required
def exam_bulk_answer_view(request, exam_id):
    """
    View for instructors to submit answers for an entire exam at once.
    
    Authorization: Strictly requires request.user.is_authenticated AND 
                   request.user.is_instructor == True. Returns 403 Forbidden otherwise.
    
    Logic: Receives an exam_id. Fetches all Question objects for that exam.
           Renders a Django modelformset_factory for the Answer model, pre-filtered
           for the current user and the specific questions of that exam.
    """
    # Authorization check - only instructors can access
    if not request.user.is_instructor:
        return HttpResponseForbidden("Only instructors can access this page.")
    
    exam = get_object_or_404(Exam, pk=exam_id)
    questions = Question.objects.filter(exam=exam).order_by('question_number')
    
    # Create a formset factory for Answer model
    AnswerFormSet = modelformset_factory(
        Answer,
        fields=['current_body'],
        extra=0,
        can_delete=False
    )
    
    if request.method == 'POST':
        # Filter existing answers for this user and these questions
        existing_answers = Answer.objects.filter(
            question__in=questions,
            author=request.user
        )
        
        formset = AnswerFormSet(request.POST, queryset=existing_answers)
        
        if formset.is_valid():
            # Save all answers
            instances = formset.save(commit=False)
            for instance in instances:
                instance.author = request.user
                instance.save()
            return redirect('exam_detail', exam_id=exam_id)
    else:
        # Pre-populate with existing answers or empty forms for new ones
        existing_answers = Answer.objects.filter(
            question__in=questions,
            author=request.user
        )
        formset = AnswerFormSet(queryset=existing_answers)
    
    context = {
        'exam': exam,
        'questions': questions,
        'formset': formset,
    }
    return render(request, 'wiki/exam_bulk_answer.html', context)
```

#### Template Context
The view passes the following context to the template (`wiki/exam_bulk_answer.html`):

| Variable | Type | Description |
|----------|------|-------------|
| `exam` | Exam | The Exam object being answered. |
| `questions` | QuerySet[Question] | All questions for the exam, ordered by number. |
| `formset` | ModelFormSet | The formset containing forms for each answer. |

#### URL Configuration
To use this view, add the following URL pattern to your `urls.py`:

```python
from apps.wiki.views import exam_bulk_answer_view

urlpatterns = [
    path('exams/<int:exam_id>/bulk-answer/', exam_bulk_answer_view, name='exam_bulk_answer'),
]
```

#### Security Considerations

1. **Authorization Enforcement:**
   - Always verify `is_instructor` on the server side.
   - Never rely on hidden form fields or JavaScript for access control.

2. **Data Integrity:**
   - The `unique_together` constraint on `Answer` (question, author) prevents duplicate submissions.
   - The formset is filtered to only show answers belonging to the current user.

3. **CSRF Protection:**
   - Django's built-in CSRF protection applies to all POST requests.
   - Templates must include `{% csrf_token %}` in the form.

4. **Input Validation:**
   - The formset automatically validates all input according to model field constraints.
   - Invalid submissions are re-rendered with error messages.

#### Usage Example

**Scenario:** An instructor wants to provide solutions for all 10 questions in a midterm exam.

1. Instructor navigates to `/exams/5/bulk-answer/`.
2. The view displays a form with 10 text areas (one per question), pre-filled if the instructor has previously saved drafts.
3. Instructor fills in all answers and clicks "Submit".
4. The view validates and saves all answers atomically.
5. Instructor is redirected to the exam detail page to review the submitted answers.

---

## Future Enhancements

Potential improvements to consider:
1. **Pagination:** For exams with many questions, paginate the formset.
2. **Draft Saving:** Add a "Save Draft" button that doesn't finalize the submission.
3. **Progress Tracking:** Show visual indicators for which questions have been answered.
4. **Import/Export:** Allow importing answers from a file (e.g., Markdown files).
