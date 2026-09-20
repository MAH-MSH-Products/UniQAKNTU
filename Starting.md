# SYSTEM CONTEXT: UniQAKNTU (AzmoonHub Nasir) Project Setup & Guidelines

## 1. Project Overview

**Name:** UniQAKNTU / AzmoonHub Nasir (آزمون‌هاب نصیر)
**Type:** Crowdsourced open exam wiki and collaborative learning platform.
**Target Audience:** Students and Instructors at K. N. Toosi University of Technology (KNTU).
**Core Purpose:** Centralized archiving of Source Materials (exams/courses), crowdsourcing markdown-based Questions and Answers with MathJax support, and peer-reviewed collaboration.

## 2. Technology Stack & Architecture

* **Architecture:** Decoupled Monorepo (REST API + SPA).
* **Backend:** Django, Django REST Framework (DRF), PostgreSQL, Redis, Celery (Background tasks).
* **Frontend:** React, Vite, React Router, Context API (`AuthContext`, `SourceMaterialsContext`).
* **Authentication:** Stateless JWT with Refresh Token Rotation.
* **Security:** Email OTP Verification (Registration/Password Reset), Brute-Force protection (IP/User lockouts).
* **Internationalization (i18n):** `react-i18next` supporting dual configurations: English (LTR) and Persian (RTL).
* **Styling:** Custom CSS Variables, native Bootstrap 5 overrides, Glassmorphism UI (2026 trends).

## 3. Core Entities & Workflows

* **User Roles (RBAC):**
* `STUDENT`: Can ask questions, answer, vote, comment, and *suggest* edits.
* `MODERATOR` / `ADMIN`: Can create Source Materials, directly edit/delete posts, approve/reject pending content, and manage Support Tickets.


* **Content Lifecycle:**
* **Source Materials:** The root entities (e.g., "Fall 2023 Midterm"). Created by Admins. Contain optional PDF attachments.
* **Questions/Answers:** Submitted as `PENDING`. Require Admin `Approve` to become public.
* **Wiki-style Edits:** Students cannot directly edit after creation. They submit via `POST /api/.../{id}/suggest_edit/`. Admins review and approve. Admins/Moderators can perform direct `PATCH` edits.


* **Attachment Handling (Orphan Claiming & Declarative Syncing):**
1. Files are uploaded immediately to `POST /api/attachments/`.
2. The frontend receives an `id` and a `file` (URL).
3. The Markdown editor strictly inserts **Relative Paths** (e.g., `![Alt](attachments/file.jpg)`) to maintain infrastructure independence.
4. On render, a custom React Markdown component maps relative paths to live absolute URLs provided in the `attachments` array of the post.
5. The post form submits `attachment_ids: [1, 2, 3]` to claim the orphans. Dropped IDs are automatically garbage-collected by the backend.



## 4. Frontend Structure & State Management

* **State Management:** Avoid Redux. Use Context API for global states (`AuthContext.jsx` for user/RBAC, `SourceMaterialsContext.jsx` for caching exams).
* **API Interceptors:** `src/services/api.js` automatically injects Bearer tokens and handles `401 Unauthorized` by triggering the refresh token endpoint seamlessly.
* **Translations (`src/locales/`):** Every hardcoded string must be localized in `en/translation.json` and `fa/translation.json`. Use `useTranslation()` hook.

## 5. UI/UX & Styling Guidelines (Strict Rules)

* **Design Language:** Modern 2026 UI, Soft UI, Glassmorphism.
* **Colors:** Deep Ocean Blue (`#023E8A`), Vibrant Turquoise (`#00B4D8`), and Sky Blue. Support Native Dark Mode via `[data-theme="dark"]` overrides in `src/index.css`.
* **Spacing & Layout (Universal Spacing System):**
* NO "magic numbers" (e.g., `margin: 17px`). Use strict 8px (0.5rem) grid utility classes or CSS variables (`--space-sm`, `--space-md`).
* NO physical directional properties (`margin-left`, `padding-right`). Exclusively use Logical Properties (`margin-inline-start`, `padding-block`, `ms-`, `pe-`) to ensure perfect RTL/LTR compatibility.
* Prefer Flexbox/Grid `gap` over explicit margins to prevent margin collapse.


* **Hover Effects:** Global translation of `-2px` to `-4px` upward on Y-axis with diffused shadows. Interactive elements utilize `box-shadow: inset` for accent indicators.

## 6. Upcoming Modules (Sprint 2 Integration)

* **Gamification:** Token economy for approved contributions.
* **Marketplace:** Premium packages created by instructors bundling source materials.
* **Custom Exams:** Shopping-cart style exam builder combining isolated questions.
* **AI Tooling:** Automated answering and Markdown/MathJax enhancement endpoints.

## 7. AI Assistant Coding Directives

When generating code or advising on this project:

1. **No Fluff:** Output pure logic, configurations, and component code. Omit greetings and closings.
2. **English Technical Terms:** Keep domain-specific terminology (e.g., Process, Markdown, Routing, Redux, Context, Pull-up resistor, etc.) strictly in English, even in Persian contexts.
3. **i18n First:** Never hardcode UI strings in JSX. Always provide the updated `translation.json` blocks alongside component changes.
4. **Security & RBAC:** Always verify user roles (`userRole`, `canModerate`, `isAuthenticated`) from `AuthContext` before exposing UI elements or API calls.
5. **Strict Error Handling:** Use try/catch blocks for all API calls. Extract backend error messages properly mapping to `err.response?.data?.message` or specific field arrays.