# Agent Constraints and Guidelines
## Instructor-Led Exam Q&A Platform

> **Project**: UniQAKNTU Open Exam Wiki
> **Repository**: `github.com/MAH-MSH-Products/UniQAKNTU`
> **Primary Frontend Author**: Mohammad Amin Haji Alirezaei (`mahajialirezaei`)
> **Primary Backend Author**: Mohammad Sajjad Hamidifard
> **Supervising Professor**: Dr. Hamed Khanmirza
> **Domain**: Full-Stack Web Development / Educational Platforms / Django

---

## Git Configuration Requirements

### Author Identity
All commits MUST be authored by the designated developer for their respective domain (Frontend or Backend).

**Required Git Configuration (Frontend - Amin):**
```bash
git config --global user.name "mahajialirezaei"
git config --global user.email "m.a.hajialirezaei05@gmail.com"

```

*(Backend developer must configure their respective identity similarly)*

**Commit Authorship Rules:**

* Frontend feature commits must show `mahajialirezaei` as the author.
* Backend feature commits must show the backend developer's identity.
* If a commit shows incorrect authorship, amend immediately before pushing:

```bash
git commit --amend --reset-author --no-edit
git push --force-with-lease

```

---

## Security & Architecture Constraints

### Credential & Data Management

* **NEVER** commit `SECRET_KEY`, database passwords, or any sensitive API keys.
* The SQLite database (`db.sqlite3`) and any media uploads (`media/`) must remain `.gitignore`d.
* Use environment variables for sensitive configurations:

```bash
# .env (git-ignored)
DJANGO_SECRET_KEY=your_secret_key_here
DEBUG=True
DB_NAME=postgres
DB_USER=postgres
DB_PASSWORD=secret

```

### Architectural Integrity (RBAC & Multi-Answer)

* **RBAC Enforcement**: The system relies on `is_instructor` and `is_student` flags. **Never** trust client-side role checks. All sensitive actions (creating/editing answers, bulk uploads) MUST be verified server-side.
* **Multi-Answer Constraints**: The `Answer` model uses a `ForeignKey` to `Question` and a `unique_together = ['question', 'author']` constraint. This structure must be preserved to prevent duplicate answers from the same instructor.
* **Revision History**: `AnswerRevision` is strictly for *personal* revision history, not community-wide wiki edits.

### File Restrictions

```gitignore
# Critical ignores (DO NOT REMOVE)
db.sqlite3
media/
.env*
__pycache__/
*.pyc
venv/
node_modules/

```

---

## Branch Management (GitFlow)

### Branch Naming Convention

All branches must explicitly indicate the working domain (Frontend or Backend).

| Type | Pattern | Example |
| --- | --- | --- |
| Frontend Feature | `feature/fe-<description>` | `feature/fe-markdown-editor` |
| Backend Feature | `feature/be-<description>` | `feature/be-bulk-upload-view` |
| Frontend Bugfix | `bugfix/fe-<issue>` | `bugfix/fe-mathjax-rendering` |
| Backend Bugfix | `bugfix/be-<issue>` | `bugfix/be-rbac-permissions` |

**Workflow Rules:**

* All branches fork from `develop`.
* Pull Requests (PRs) are required for merging into `develop`.
* CI/CD pipelines (GitHub Actions) MUST pass before merging.
* `main` contains only stable, tested code ready for production deployment.

---

## Documentation & Verification Requirements

### Core Documentation Files (File-Centric Principle)

Adhering to `Document-Constraints.md`, **every modified or newly created `.py` file must have a corresponding `.md` documentation file** updated or created in the `documentations/` folder.

| File/Folder | Purpose | Update Trigger |
| --- | --- | --- |
| `documentations/<filename>.md` | Detailed explanation of logic, models, views, or endpoints for a specific file. | Whenever a source code file is modified or created. |
| `TODO.md` | Phase-based milestone planning and immediate task tracking. | Task completion / phase updates. |
| `API.md` | REST API specifications (endpoints, payloads, responses). | Whenever backend API endpoints change. |
| `README.md` | Project overview, installation, usage. | When public interface or setup changes. |
| `RULES.md` | GitFlow and repository rules. | (Static, unless workflow changes) |

### Task Verification & Proof of Work

When a task is marked as complete, it must be accompanied by evidence.

1. **Functional Proof:** Provide visual or technical evidence (e.g., screenshot of UI, API response payload, test logs) demonstrating the feature works as intended.
2. **Pending Verification Tag:** If the task cannot be immediately tested (e.g., waiting on a backend endpoint to finish frontend integration), it **MUST** be explicitly tagged with **"باید چک شود"** (Needs verification) in the documentation and PR notes.

---

## Task Verification: Expected Results & Visual Proof

To ensure every task is properly validated and demonstrable, each completed task **MUST** include the following two components:

1. **Expected Result** – A clear description of what the successful completion of the task achieves. (e.g., *"The `exam_bulk_answer_view` successfully processes `request.FILES` and saves both the Markdown text and the uploaded PDF to the database, redirecting to the exam detail page."*)
2. **Verification Artifact** – Evidence of successful implementation. Depending on the task, this could be:
* **Frontend:** A screenshot of the new UI component (e.g., the Markdown editor rendering math formulas).
* **Backend:** A snippet of the successful JSON response from Postman or terminal output from running unit tests.
* If unable to produce the artifact, the task **MUST** be tagged with **"باید چک شود"**.



**Checklist for Task Completion**:

* [ ] Expected result is documented in the task description or PR notes.
* [ ] Appropriate verification artifact (screenshot, API response) is provided or referenced.
* [ ] If unable to verify, task is tagged with **"باید چک شود"**.
* [ ] Corresponding file-centric documentation (`documentations/<filename>.md`) has been updated/created.

---

## Communication & Collaboration Protocol

### Progress Reporting Format

When reporting task completion:

```
[PHASE-X] <Task Name> - ✅ Complete / 🔄 In Progress / ⚠️ Blocked

📁 Documentation:
- documentations/wiki_views.md updated.
- documentations/wiki_models.md updated.

📊 Verification (Proof of Work):
- [Screenshot/API Response] OR [⚠️ باید چک شود]

🔗 References:
- Branch: feature/be-file-upload
- API Spec: API.md#Endpoint-3

⚠️ Blockers / Decisions Needed:
- [If any: describe + tag collaborator]

```

### Team Communication

* Ensure cross-functional tasks (e.g., API endpoints needed for frontend) are clearly communicated and tracked in `TODO.md`.
* Review PRs carefully to ensure RBAC constraints and GitFlow rules are maintained.

---

## Critical Constraints Summary

| Constraint | Priority | Enforcement Point |
| --- | --- | --- |
| File-centric documentation (`documentations/`) | 🔴 CRITICAL | PR Review / Every Code Change |
| Strict RBAC (`is_instructor`) enforcement on server | 🔴 CRITICAL | Backend logic / API endpoints |
| Single author git identity per domain | 🔴 CRITICAL | Commit review |
| Sensitive credentials & media never committed | 🔴 CRITICAL | `.gitignore` |
| Proof of Work OR **"باید چک شود"** tag | 🟠 HIGH | Task completion checklist |
| Domain-specific Branch Naming (`fe-`, `be-`) | 🟡 MEDIUM | PR creation |
| Maintain `unique_together` constraint on Answers | 🟠 HIGH | Database Migrations |

```

```
