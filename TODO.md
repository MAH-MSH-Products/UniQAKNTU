# TODO - UniQAKNTU Project Tasks (Phased Approach)

## Phase 1: Infrastructure & Foundation
**Goal:** Set up a robust, production-ready development environment.
- [x] **[Backend - Mohammad Sajjad]** Configure PostgreSQL database in `settings.py` and `docker-compose.yml`.
- [x] **[Backend - Mohammad Sajjad]** Set up Redis for caching and session management.
- [x] **[Frontend - Mohammad Amin]** Configure Frontend build tools (if using Vite/Webpack) or setup static asset pipeline in Django (`STATICFILES_DIRS`, `django-compressor`).
  - Created `static/css/base.css` with custom styles and CSS variables
  - Created `static/js/utils.js` with AJAX utilities, CSRF handling, and MathJax integration
  - Updated `templates/base.html` to include static assets via `{% load static %}`
  - Documented all frontend infrastructure files in `documentations/`
- [x] **[Both]** Implement CI/CD pipeline (GitHub Actions) for automated linting (Flake8/Black for Python, ESLint/Prettier for JS).
  - Created `.github/workflows/python-ci.yml` for Python linting and testing
  - Created `.github/workflows/frontend-ci.yml` for JavaScript linting and validation
  - Created `.gitignore` with comprehensive ignore rules

## Phase 2: Database Modeling & Permissions
**Goal:** Establish the schema and access control.
- [x] **[Backend - Mohammad Sajjad]** Finalize models: `Course`, `Exam`, `Question`, `Answer`, `AnswerRevision`.
- [x] **[Backend - Mohammad Sajjad]** Implement RoleRequest model and is_instructor RBAC with introduction field.
- [x] **[Backend - Mohammad Sajjad]** Add instructor profile fields (title, bio) to User model.
- [x] **[Backend - Mohammad Sajjad]** Add file upload support (image, pdf_file) to Answer model.
- [ ] **[Backend - Mohammad Sajjad]** Add Database Indexes on `Question.exam_id`, `Answer.question_id`, and `AnswerRevision.created_at`.
- [ ] **[Backend - Mohammad Sajjad]** Implement Custom Permissions:
  - `Can_add_exam`, `Can_edit_any_answer` (Admin/TA).
  - Students have Read-Only access; Instructors manage their own solutions.
- [ ] **[Backend - Mohammad Sajjad]** Configure Django Admin panels with inline models (e.g., editing Questions directly inside Exam view).

## Phase 3: Core API Development (REST & AJAX)
**Goal:** Build endpoints for dynamic frontend interactions without page reloads.
- [ ] **[Backend - Mohammad Sajjad]** `POST /api/v1/markdown/preview/`: Endpoint to render Markdown to HTML server-side (preventing XSS).
- [ ] **[Backend - Mohammad Sajjad]** `GET /api/v1/questions/{id}/answers/`: Fetch all answers for a question (multi-answer system with file URLs).
- [ ] **[Backend - Mohammad Sajjad]** `POST /api/v1/questions/{id}/answers/`: Create a new answer with multipart/form-data support for file uploads (Instructors only).
- [ ] **[Backend - Mohammad Sajjad]** `PUT /api/v1/answers/{id}/update/`: Update an answer with file upload support (Author only).
- [ ] **[Backend - Mohammad Sajjad]** `POST /api/v1/users/request-instructor/`: Endpoint for students to request instructor status with introduction field.

## Phase 4: Frontend UI & Multi-Answer Integration
**Goal:** Build the user interface and integrate the Markdown/MathJax editor.
- [ ] **[Frontend - Mohammad Amin]** Design Base Layout: Responsive Sidebar (Course -> Exam navigation), Navbar, Footer.
- [ ] **[Frontend - Mohammad Amin]** Implement `EasyMDE` or `Toast UI Editor` via JavaScript.
- [ ] **[Frontend - Mohammad Amin]** Integrate `MathJax` with the Markdown editor for real-time LaTeX formula rendering (`$$...$$` and `$...$`).
- [ ] **[Frontend - Mohammad Amin]** Develop AJAX wrapper functions (`fetch` API) handling CSRF tokens seamlessly for all API calls.
- [ ] **[Frontend - Mohammad Amin]** Implement Instructor Bulk Upload Dashboard with file upload support for submitting answers for entire exams.
- [ ] **[Frontend - Mohammad Amin]** Build the Multi-Answer UI representation showing all instructor answers with file attachments for each question.
- [ ] **[Frontend - Mohammad Amin]** Build the "Revision History" UI (Modal or Drawer) displaying chronological edits and author information.
- [ ] **[Frontend - Mohammad Amin]** Build Instructor Profile display showing title and bio.

## Phase 5: QA, Security & Deployment
**Goal:** Secure the application and deploy to production.
- [ ] **[Backend - Mohammad Sajjad]** Implement Rate Limiting on the Answer submission API to prevent spam.
- [ ] **[Backend - Mohammad Sajjad]** Sanitize all Markdown input using `bleach` before saving to the database to prevent Stored XSS.
- [ ] **[Frontend - Mohammad Amin]** Test UI on mobile devices (responsive tables, code blocks, and math formulas).
- [ ] **[Both]** Write Unit Tests for revision creation logic and API endpoints.
- [ ] **[Both]** Deploy via Docker Swarm or standalone Docker Compose on the production server (Nginx reverse proxy + Gunicorn).

