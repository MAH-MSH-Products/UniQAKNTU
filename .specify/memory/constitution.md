# UniQAKNTU Constitution
<!-- Crowdsourced Academic Q&A Platform — Instructor-Led Exam Wiki -->

## Core Principles

### I. Public API Compatibility (NON-NEGOTIABLE)
- All existing public API endpoints, request/response shapes, and status codes defined in `API.md` and `backend/schema.yml` **must** remain backward-compatible.
- New fields may be added to responses; existing fields must **never** be removed or renamed without a versioned migration plan approved by both frontend and backend authors.
- Deprecated endpoints listed in `API.md § Deprecated / Removed Endpoints` must **never** be re-introduced; frontend code referencing them must be removed or redirected to their replacements.
- The orphan attachment upload pattern (POST `/api/attachments/` → collect IDs → include `attachment_ids` in JSON payload) is the **only** file-upload mechanism. Multipart form-data on question/answer creation is forbidden.

### II. Service Boundary Integrity
- **Backend** (Django/DRF) and **Frontend** are independently deployable units. Neither may import from or directly depend on the other's internals.
- All communication crosses the HTTP API boundary defined in `API.md` and `backend/schema.yml`. No shared database access, no server-side template rendering for frontend views.
- Backend commits must carry the backend author's git identity; frontend commits must carry the frontend author's identity (`mahajialirezaei`). Amend authorship before pushing if incorrect.

### III. Role-Based Access Control (NON-NEGOTIABLE)
- The system uses a **role enum** (`STUDENT | MODERATOR | ADMIN`), not boolean flags. Frontend must check `user.role`, not `is_instructor`/`is_student`.
- All sensitive actions **must** be verified server-side. Never trust client-side role checks.
- Permission matrix (authoritative source: `schema.yml`):

| Capability | STUDENT | MODERATOR | ADMIN |
|---|:---:|:---:|:---:|
| Create questions/answers | ✅ | ✅ | ✅ |
| Edit own posts directly | ❌ (use `suggest_edit`) | ✅ | ✅ |
| Delete any post | ❌ | ✅ | ✅ |
| Approve/Reject content | ❌ | ✅ | ✅ |
| Change user roles | ❌ | ❌ | ✅ |
| List all users | ❌ | ✅ | ✅ |

### IV. Database Schema Integrity (NON-NEGOTIABLE)
- `backend/schema.yml` is the **single source of truth** for API contracts. Any schema change requires updating this file and all downstream documentation.
- The `Answer` model enforces `unique_together = ['question', 'author']`. This constraint must **never** be removed.
- `AnswerRevision` is strictly personal revision history, **not** community-wide wiki edits.
- Attachments are **immutable** after upload — create + retrieve + delete only, no PUT/PATCH.
- Comment deletion: hard delete if no replies, **soft delete** if replies exist (preserves thread integrity).
- Content status lifecycle: `PENDING → APPROVED` or `PENDING → REJECTED`. All user-submitted content defaults to `PENDING`.

### V. Database Migrations — Rollback Plans Required (NON-NEGOTIABLE)
- Every database migration **must** include a documented rollback plan before it can be merged.
- Rollback plans must cover: reversal SQL/migration, data preservation strategy, and estimated downtime.
- Destructive migrations (column drops, table drops, type changes) require explicit approval from both authors.

### VI. Test-Driven Verification
- The project's existing test suite (`pytest` for backend) **must** pass before any merge to `develop` or `main`.
- CI workflows (`pytest` + `flake8`/`black` for backend, UI validation/JS linting for frontend) are **hard gates** — merging is blocked on failure.
- New features and bug fixes must include tests that exercise the changed behavior. Completed tasks must include expected result + verification artifact, or be tagged "باید چک شود" (needs verification).

### VII. File-Centric Documentation (NON-NEGOTIABLE)
- Every new or modified `.py` file **must** have a corresponding `.md` in `documentations/`.
- Documentation is **file-centric**, not task-centric. Never create `documentation/task_X_summary.md`.
- Each doc follows the structure: Purpose → Key Components → Usage → Integration → Change Log (optional).
- Config-only changes (YAML, env) don't require separate docs unless they introduce a new system pattern.

---

## Security Constraints

### Credentials & Secrets
- **NEVER** commit `SECRET_KEY`, database passwords, API keys, or any credentials.
- Secrets go in `.env` files (git-ignored). The following must always be in `.gitignore`: `db.sqlite3`, `media/`, `.env*`, `__pycache__/`, `*.pyc`, `venv/`, `node_modules/`.

### Authentication Protocol
- JWT Bearer authentication (`Authorization: Bearer <access_token>`) is the sole auth mechanism.
- Refresh token rotation: old refresh token is blacklisted on each refresh; frontend must always store the newly returned token.
- Brute-force protection: 5 failed login attempts → 15-minute IP/username lockout (`429`).
- Password change: 5 wrong `current_password` attempts → 15-minute lockout.

### Rate Limiting
- OTP send: 3 requests/hour per user/email/type combination.
- OTP verification: 5 wrong attempts permanently invalidates the OTP (`429`); user must request a new one.
- Email change request: 3 requests/hour.

### Email Verification
- New accounts start as `is_email_verified = False` and cannot log in until verified.
- Registration auto-sends the first OTP; the `send-otp` endpoint is only for "Resend Code" flows.

---

## Git & Branching Workflow

### Branch Strategy
- **`main`**: Production-ready, stable, tested. **Direct commits strictly forbidden.**
- **`develop`**: Integration branch. All features merge here first.
- **`feature/*`**: Short-lived feature branches forked from `develop`.

### Branch Naming (MANDATORY)
- Frontend features: `feature/fe-<kebab-case-name>`
- Backend features: `feature/be-<kebab-case-name>`
- Frontend bugfixes: `bugfix/fe-<kebab-case-name>`
- Backend bugfixes: `bugfix/be-<kebab-case-name>`

### Merge Rules
1. Branch from `develop`
2. Use conventional commits
3. Open PR to `develop`
4. CI must pass (hard gate)
5. Code review required
6. Merge
7. Release: merge `develop` → `main` via PR

---

## API Contract Rules

### Pagination
- All list endpoints return `{ count, next, previous, results }` (page size = 20).
- Frontend **must** extract `response.data.results` for rendering.

### Timestamps & Localization
- Every model exposes ISO 8601 (`created_at`/`updated_at`) **and** Persian Shamsi (`*_jalali`) timestamps.
- Frontend **must** render `*_jalali` in UI; use ISO only for sorting/computation.

### Content Visibility
- Public list queries **must** append `?status=APPROVED` by default.
- `PENDING` content is visible only to author + moderators.
- `REJECTED` content is visible only to moderators.

### Error Handling Contract
| Status | Meaning | Frontend Action |
|---|---|---|
| `400` | Validation error | Show field-level errors from `response.data` |
| `401` | Token expired/invalid | Trigger refresh interceptor |
| `403` | Permission denied | Hide action / show toast |
| `404` | Not found | Show empty state |
| `429` | Rate limited | Backoff & retry |

---

## Progress Reporting

- Use the `[PHASE-X] <Task Name> - Status` format.
- Reports must include: documentation, verification, references, and blockers sections.
- Priority levels: 🔴 CRITICAL (file-centric docs, RBAC, no credentials, git identity), 🟠 HIGH (proof of work, `unique_together`), 🟡 MEDIUM (branch naming).

---

## Governance

- This constitution **supersedes** all other development practices when conflicts arise.
- The authoritative sources for this constitution are: `RULES.md`, `AGENT_CONSTRAINTS.md`, `documentations/Document-Constraints.md`, `API.md`, `backend/authentication_api_docs.md`, and `backend/schema.yml`.
- Amendments require:
  1. Written justification documenting the reason for change
  2. Approval from both the frontend author and the backend author
  3. A migration plan for any existing code/data affected by the change
  4. Update to this constitution document
- All PRs and code reviews **must** verify compliance with this constitution.
- When in doubt, `backend/schema.yml` is the single source of truth for data models and API contracts.

**Version**: 1.0.0 | **Ratified**: 2026-09-23 | **Last Amended**: 2026-09-23
