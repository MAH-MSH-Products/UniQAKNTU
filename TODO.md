# TODO - UniQAKNTU Project Tasks

## Overview
This document outlines the tasks required for the successful completion of the UniQAKNTU Open Exam Wiki project. The work is divided into Frontend (Mohammad Amin Haji Alirezaei) and Backend (Mohammad Sajjad Hamidifard) responsibilities.

## General Project Setup (Both)
- [ ] Initialize the Git repository and push the base project structure (completed).
- [ ] Set up a unified virtual environment requirement list (`requirements.txt`) including Django, Markdown/MathJax libraries, and PostgreSQL connector (if moving from SQLite).
- [ ] Define the exact branch strategy (e.g., `main`, `develop`, `feature/backend/...`, `feature/frontend/...`).

## Backend Tasks (Mohammad Sajjad Hamidifard)

### 1. Database & Models
- [ ] Transition from SQLite to PostgreSQL for production readiness. Update `settings.py` and `requirements.txt` (psycopg2).
- [ ] Add indexing to frequently queried fields (e.g., `Exam.year`, `Question.text`, `Answer.author`).
- [ ] Implement robust `clean()` methods on models to enforce data integrity (e.g., ensure `question_number` is positive, an answer isn't submitted for a non-existent question).

### 2. Views & Logic (Wiki Core)
- [ ] Create `QuestionListView` and `QuestionDetailView` to list and show individual questions.
- [ ] Implement `AnswerCreateView` and `AnswerUpdateView`.
    - **Crucial Logic:** When an answer is updated, the view must automatically create a new `AnswerRevision` instance capturing the old state before saving the new state.
- [ ] Implement `RevisionHistoryView` to display the history of changes for a specific answer.
- [ ] Implement a Rollback feature: A view that allows an Admin or Editor to revert an `Answer` to a specific `AnswerRevision`.

### 3. Permissions & Security
- [ ] Implement Object-Level Permissions or strict View-level checks:
    - Only Admins/Staff can add `Course`, `Exam`, and `Question`.
    - Authenticated users can Add/Edit `Answer`.
    - Unauthenticated users can only Read.
- [ ] Set up CSRF protection on all forms and secure Session configurations.

### 4. API & Integration (Optional but recommended)
- [ ] If the frontend requires dynamic loading, implement simple Django REST Framework (DRF) serializers and ViewSets for fetching question lists or rendering markdown asynchronously.

## Frontend Tasks (Mohammad Amin Haji Alirezaei)

### 1. Base Layout & Theming
- [ ] Finalize the color palette and typography (using Bootstrap 5 or Tailwind CSS). The current `base.html` needs a polished, academic UI.
- [ ] Create a responsive Sidebar for easy navigation between `Courses` -> `Exams` -> `Questions`.
- [ ] Design custom Error Pages (404, 403, 500) that match the theme.

### 2. Markdown & MathJax Integration (Critical)
- [ ] Integrate a robust Markdown Editor (e.g., EasyMDE or Toast UI Editor) into the `AnswerUpdateView` form.
- [ ] Ensure the editor supports split-pane preview (writing Markdown on the left, seeing MathJax/HTML on the right).
- [ ] Verify that MathJax correctly parses `$$...$$` (block equations) and `$...$` (inline equations) dynamically as the user types in the editor.

### 3. Template Implementation
- [ ] `curriculum/course_list.html`: Card-based layout displaying available courses.
- [ ] `curriculum/exam_detail.html`: A clean list of questions belonging to a specific exam, with visual indicators if a question has an answer or not.
- [ ] `wiki/question_detail.html`: The most important page. Needs to cleanly display the Question text/image, the current Answer, and clearly visible "Edit" or "Improve this answer" buttons.
- [ ] `wiki/revision_history.html`: A timeline or table view showing who edited the answer, when, and their `edit_summary`.

### 4. User Experience (UX) Enhancements
- [ ] Add client-side form validation (e.g., preventing empty answer submissions).
- [ ] Implement loading spinners for form submissions to prevent double-clicking.
- [ ] Style the Django messages (alerts) to be toast notifications that auto-dismiss.

## Testing & Deployment (Both)
- [ ] Write unit tests for critical paths (Backend: Revision creation logic. Frontend: Editor rendering).
- [ ] Prepare `Dockerfile` and `docker-compose.yml` for containerized deployment (PostgreSQL, Django, Gunicorn, Nginx).
- [ ] Deploy a staging instance to test real-world Wiki collaboration.