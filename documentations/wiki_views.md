# Wiki App Views Documentation

## Overview
The `wiki` app views handle the presentation logic for the Q&A functionality, including the bulk answer upload feature for instructors. This document details the `ExamBulkAnswerView` with its file upload support and access control mechanisms.

## Views

### ExamBulkAnswerView (`exam_bulk_answer_view`)
**Location:** `apps/wiki/views.py`

A function-based view that allows instructors to submit answers for an entire exam at once using a Django ModelFormSet.

#### URL Pattern
```python
path('exams/<int:exam_id>/bulk-answer/', exam_bulk_answer_view, name='exam_bulk_answer')
```

#### Authorization Requirements
This view implements strict Role-Based Access Control (RBAC):

1. **Login Required**: The `@login_required` decorator ensures only authenticated users can access this view
2. **Instructor-Only Access**: Explicit check for `request.user.is_instructor == True`
3. **403 Forbidden Response**: Non-instructors receive an HTTP 403 error with the message "Only instructors can access this page."

```python
@login_required
def exam_bulk_answer_view(request, exam_id):
    # Authorization check - only instructors can access
    if not request.user.is_instructor:
        return HttpResponseForbidden("Only instructors can access this page.")
```

#### Parameters
| Parameter | Type | Description |
|-----------|------|-------------|
| `request` | HttpRequest | The HTTP request object containing POST data and FILES |
| `exam_id` | int | Primary key of the Exam object |

#### Logic Flow

##### 1. Fetch Related Objects
```python
exam = get_object_or_404(Exam, pk=exam_id)
questions = Question.objects.filter(exam=exam).order_by('question_number')
```
- Retrieves the Exam object or returns 404 if not found
- Fetches all Questions for that exam, ordered by question number

##### 2. Create ModelFormSet Factory
```python
AnswerFormSet = modelformset_factory(
    Answer,
    fields=['current_body', 'image', 'pdf_file'],  # Includes file upload fields
    extra=0,
    can_delete=False
)
```
- Creates a FormSet factory for the Answer model
- **Fields included**:
  - `current_body`: Markdown text content (optional, can be empty if files are uploaded)
  - `image`: ImageField for uploading solution images
  - `pdf_file`: FileField for uploading PDF documents
- `extra=0`: No extra blank forms; only shows existing answers
- `can_delete=False`: Prevents deletion of answers through this form

##### 3. Handle POST Request (Form Submission)
```python
if request.method == 'POST':
    # Filter existing answers for this user and these questions
    existing_answers = Answer.objects.filter(
        question__in=questions,
        author=request.user
    )
    
    # CRITICAL: Pass request.FILES to handle file uploads
    formset = AnswerFormSet(request.POST, request.FILES, queryset=existing_answers)
    
    if formset.is_valid():
        # Save all answers
        instances = formset.save(commit=False)
        for instance in instances:
            instance.author = request.user
            instance.save()
        return redirect('exam_detail', exam_id=exam_id)
```

**Key Implementation Details:**

1. **QuerySet Filtering**: Only fetches answers that belong to the current instructor for the questions in this exam
   - `question__in=questions`: Filters by the exam's questions
   - `author=request.user`: Ensures instructor only sees/edits their own answers

2. **File Upload Handling** (CRITICAL):
   ```python
   formset = AnswerFormSet(request.POST, request.FILES, queryset=existing_answers)
   ```
   - **Must pass `request.FILES`** as the second argument to properly handle multipart/form-data
   - Without `request.FILES`, uploaded images and PDFs will not be processed
   - The form expects `enctype="multipart/form-data"` on the HTML form element

3. **Save Process**:
   - `formset.save(commit=False)` returns unsaved instances
   - Loop through instances to set `author = request.user` (ensures ownership)
   - Call `instance.save()` to commit to database
   - Redirects to exam detail page on success

##### 4. Handle GET Request (Display Form)
```python
else:
    # Pre-populate with existing answers or empty forms for new ones
    existing_answers = Answer.objects.filter(
        question__in=questions,
        author=request.user
    )
    formset = AnswerFormSet(queryset=existing_answers)
```
- Displays the formset with existing answers pre-filled
- If no answers exist, shows empty forms for each question

#### Template Context
The view passes the following context to the template (`wiki/exam_bulk_answer.html`):

```python
context = {
    'exam': exam,              # The Exam object
    'questions': questions,    # QuerySet of Question objects
    'formset': formset,        # The AnswerFormSet instance
}
```

#### HTML Form Requirements
The template must include:
1. **enctype attribute**: `<form method="post" enctype="multipart/form-data">`
2. **CSRF token**: `{% csrf_token %}`
3. **Formset rendering**: Display all forms in the formset
4. **Submit button**: To submit the answers

Example template structure:
```html
<form method="post" enctype="multipart/form-data">
    {% csrf_token %}
    {{ formset.management_form }}
    
    {% for form in formset %}
        <div class="question-answer">
            <h3>{{ questions.forloop.counter0 }}</h3>
            {{ form.current_body }}
            {{ form.image }}
            {{ form.pdf_file }}
        </div>
    {% endfor %}
    
    <button type="submit">Save All Answers</button>
</form>
```

#### Security Considerations

1. **Authorization**: 
   - Only authenticated instructors can access
   - Students receive 403 Forbidden

2. **Data Isolation**:
   - Instructors can only see/edit their own answers
   - `author=request.user` ensures ownership is correctly assigned

3. **File Upload Validation**:
   - Django's `ImageField` automatically validates image files
   - `FileField` accepts any file type (consider adding validation if needed)
   - Files are stored in configured `MEDIA_ROOT` subdirectories

4. **CSRF Protection**:
   - Standard Django CSRF token required for POST requests

#### Error Handling

| Scenario | Behavior |
|----------|----------|
| Non-instructor access | Returns `HttpResponseForbidden` |
| Invalid exam_id | Returns 404 via `get_object_or_404` |
| Invalid form data | Re-renders form with validation errors |
| File too large | Django's FILE_UPLOAD_MAX_MEMORY_SIZE limit applies |

#### Related Documentation
- See `wiki_models.md` for Answer model fields (`current_body`, `image`, `pdf_file`)
- See `accounts_models.md` for `is_instructor` field and RBAC
- See `API.md` for REST API endpoints with multipart/form-data support
- See `Document-Constraints.md` for documentation requirements

## Best Practices

1. **Always pass `request.FILES`** when handling forms with file uploads
2. **Set `enctype="multipart/form-data"`** on the HTML form element
3. **Validate file types** if specific formats are required
4. **Provide feedback** to users about successful uploads or errors
5. **Consider file size limits** and communicate them to instructors
6. **Use `unique_together` constraint** in models to prevent duplicate answers
