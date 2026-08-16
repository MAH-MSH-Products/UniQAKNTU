# TODO - UniQAKNTU Project Tasks (Phased Approach)

## Phase 1: Infrastructure & Foundation
**Goal:** Set up a robust, production-ready development environment.
- [ ] **[Backend - Mohammad Sajjad]** Configure PostgreSQL database in `settings.py` and `docker-compose.yml`.
- [ ] **[Backend - Mohammad Sajjad]** Set up Redis for caching and session management.
- [ ] **[Frontend - Mohammad Amin]** Configure Frontend build tools (if using Vite/Webpack) or setup static asset pipeline in Django (`STATICFILES_DIRS`, `django-compressor`).
- [ ] **[Both]** Implement CI/CD pipeline (GitHub Actions) for automated linting (Flake8/Black for Python, ESLint/Prettier for JS).

## Phase 2: Database Modeling & Permissions
**Goal:** Establish the schema and access control.
- [ ] **[Backend - Mohammad Sajjad]** Finalize models: `Course`, `Exam`, `Question`, `Answer`, `AnswerRevision`.
- [ ] **[Backend - Mohammad Sajjad]** Add Database Indexes on `Question.exam_id`, `Answer.question_id`, and `AnswerRevision.created_at`.
- [ ] **[Backend - Mohammad Sajjad]** Implement Custom Permissions:
  - `Can_add_exam`, `Can_edit_any_answer` (Admin/TA).
  - Students can edit answers but requires logging the revision.
- [ ] **[Backend - Mohammad Sajjad]** Configure Django Admin panels with inline models (e.g., editing Questions directly inside Exam view).

## Phase 3: Core API Development (REST & AJAX)
**Goal:** Build endpoints for dynamic frontend interactions without page reloads.
- [ ] **[Backend - Mohammad Sajjad]** `POST /api/v1/markdown/preview/`: Endpoint to render Markdown to HTML server-side (preventing XSS).
- [ ] **[Backend - Mohammad Sajjad]** `GET /api/v1/questions/{id}/revisions/`: Fetch revision history for a specific answer.
- [ ] **[Backend - Mohammad Sajjad]** `POST /api/v1/questions/{id}/answer/`: Create or update an answer. Must handle concurrent edits (Optimistic Concurrency Control using a `last_modified` timestamp).
- [ ] **[Backend - Mohammad Sajjad]** `POST /api/v1/revisions/{id}/rollback/`: Admin endpoint to revert an answer to a previous state.

## Phase 4: Frontend UI & Wiki Integration
**Goal:** Build the user interface and integrate the Markdown/MathJax editor.
- [ ] **[Frontend - Mohammad Amin]** Design Base Layout: Responsive Sidebar (Course -> Exam navigation), Navbar, Footer.
- [ ] **[Frontend - Mohammad Amin]** Implement `EasyMDE` or `Toast UI Editor` via JavaScript.
- [ ] **[Frontend - Mohammad Amin]** Integrate `MathJax` with the Markdown editor for real-time LaTeX formula rendering (`$$...$$` and `$...$`).
- [ ] **[Frontend - Mohammad Amin]** Develop AJAX wrapper functions (`fetch` API) handling CSRF tokens seamlessly for all API calls.
- [ ] **[Frontend - Mohammad Amin]** Build the "Revision History" UI (Modal or Drawer) displaying chronological edits and author information.

## Phase 5: Wiki Versioning & Diff System
**Goal:** Allow users to see exact changes between revisions.
- [ ] **[Backend - Mohammad Sajjad]** Implement a text-diff utility function (using Python's `difflib`) to compute added/removed lines between two `AnswerRevision` objects.
- [ ] **[Backend - Mohammad Sajjad]** Expose diff data via API `GET /api/v1/revisions/{id}/diff/?compare_to={id2}`.
- [ ] **[Frontend - Mohammad Amin]** Render the diff on the frontend using HTML styling (e.g., green for additions, red for deletions).

## Phase 6: QA, Security & Deployment
**Goal:** Secure the application and deploy to production.
- [ ] **[Backend - Mohammad Sajjad]** Implement Rate Limiting on the Answer submission API to prevent spam.
- [ ] **[Backend - Mohammad Sajjad]** Sanitize all Markdown input using `bleach` before saving to the database to prevent Stored XSS.
- [ ] **[Frontend - Mohammad Amin]** Test UI on mobile devices (responsive tables, code blocks, and math formulas).
- [ ] **[Both]** Write Unit Tests for revision creation logic and API endpoints.
- [ ] **[Both]** Deploy via Docker Swarm or standalone Docker Compose on the production server (Nginx reverse proxy + Gunicorn).