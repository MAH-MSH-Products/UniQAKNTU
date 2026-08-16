# TODO - UniQAKNTU Project Tasks (Phased Approach)

## Phase 1: Infrastructure & Foundation
**Goal:** Set up a robust, production-ready development environment.
- [ ] **[Backend - Mohammad Sajjad]** Configure PostgreSQL database in `settings.py` and `docker-compose.yml`.
- [ ] **[Backend - Mohammad Sajjad]** Set up Redis for caching and session management.
- [ ] **[Frontend - Mohammad Amin]** Configure Frontend build tools (if using Vite/Webpack) or setup static asset pipeline in Django (`STATICFILES_DIRS`, `django-compressor`).
- [ ] **[Both]** Implement CI/CD pipeline (GitHub Actions) for automated linting (Flake8/Black for Python, ESLint/Prettier for JS).

## Phase 2: Database Modeling & Permissions
**Goal:** Establish the schema and access control.
- [x] **[Backend - Mohammad Sajjad]** Finalize models: `Course`, `Exam`, `Question`, `Answer`, `AnswerRevision`.
- [x] **[Backend - Mohammad Sajjad]** Implement RoleRequest model and is_instructor RBAC.
- [ ] **[Backend - Mohammad Sajjad]** Add Database Indexes on `Question.exam_id`, `Answer.question_id`, and `AnswerRevision.created_at`.
- [ ] **[Backend - Mohammad Sajjad]** Implement Custom Permissions:
  - `Can_add_exam`, `Can_edit_any_answer` (Admin/TA).
  - Students have Read-Only access; Instructors manage their own solutions.
- [ ] **[Backend - Mohammad Sajjad]** Configure Django Admin panels with inline models (e.g., editing Questions directly inside Exam view).

## Phase 3: Core API Development (REST & AJAX)
**Goal:** Build endpoints for dynamic frontend interactions without page reloads.
- [ ] **[Backend - Mohammad Sajjad]** `POST /api/v1/markdown/preview/`: Endpoint to render Markdown to HTML server-side (preventing XSS).
- [ ] **[Backend - Mohammad Sajjad]** `GET /api/v1/questions/{id}/answers/`: Fetch all answers for a question (multi-answer system).
- [ ] **[Backend - Mohammad Sajjad]** `POST /api/v1/questions/{id}/answers/`: Create a new answer (Instructors only, requires `is_instructor = True`).
- [ ] **[Backend - Mohammad Sajjad]** `PUT /api/v1/answers/{id}/update/`: Update an answer (Author only).
- [ ] **[Backend - Mohammad Sajjad]** `POST /api/v1/users/request-instructor/`: Endpoint for students to request instructor status.

## Phase 4: Frontend UI & Multi-Answer Integration
**Goal:** Build the user interface and integrate the Markdown/MathJax editor.
- [ ] **[Frontend - Mohammad Amin]** Design Base Layout: Responsive Sidebar (Course -> Exam navigation), Navbar, Footer.
- [ ] **[Frontend - Mohammad Amin]** Implement `EasyMDE` or `Toast UI Editor` via JavaScript.
- [ ] **[Frontend - Mohammad Amin]** Integrate `MathJax` with the Markdown editor for real-time LaTeX formula rendering (`$$...$$` and `$...$`).
- [ ] **[Frontend - Mohammad Amin]** Develop AJAX wrapper functions (`fetch` API) handling CSRF tokens seamlessly for all API calls.
- [ ] **[Frontend - Mohammad Amin]** Implement Instructor Bulk Upload Dashboard for submitting answers for entire exams.
- [ ] **[Frontend - Mohammad Amin]** Build the Multi-Answer UI representation showing all instructor answers for each question.
- [ ] **[Frontend - Mohammad Amin]** Build the "Revision History" UI (Modal or Drawer) displaying chronological edits and author information.

## Phase 5: QA, Security & Deployment
**Goal:** Secure the application and deploy to production.
- [ ] **[Backend - Mohammad Sajjad]** Implement Rate Limiting on the Answer submission API to prevent spam.
- [ ] **[Backend - Mohammad Sajjad]** Sanitize all Markdown input using `bleach` before saving to the database to prevent Stored XSS.
- [ ] **[Frontend - Mohammad Amin]** Test UI on mobile devices (responsive tables, code blocks, and math formulas).
- [ ] **[Both]** Write Unit Tests for revision creation logic and API endpoints.
- [ ] **[Both]** Deploy via Docker Swarm or standalone Docker Compose on the production server (Nginx reverse proxy + Gunicorn).
