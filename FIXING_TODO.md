# `FIXING_TODO.md`

## Overview
This document provides a phased, file-by-file migration plan to align the React frontend with the finalized Django REST Framework backend.
**The backend is strictly immutable.** All modifications must be applied exclusively to frontend components, services, and state management layers. An AI agent can execute these steps sequentially without prior project knowledge.

---

## Phase 1: API Client & Authentication Layer
**Objective:** Align base URL, implement JWT lifecycle, and replace boolean role flags with enum-based RBAC.
**Target Files:** `services/api.js`, `context/AuthContext.jsx`, `components/RequireAuth.jsx`, `components/RequireInstructor.jsx`, `components/Navbar.jsx`

### Step 1.1: Update API Client Configuration
- **File:** `services/api.js`
- **Change:** 
  - Replace `baseURL: 'http://<domain>/api/v1/'` with `baseURL: '/api/'` (or environment variable).
  - Remove hardcoded `Authorization: Token <...>` headers. JWT will be handled via interceptors.
  - Add `withCredentials: false` (JWT is stateless; CORS handles cross-origin).

### Step 1.2: Implement JWT Interceptors & Token Refresh
- **File:** `services/api.js`
- **Add Request Interceptor:**
  ```javascript
  api.interceptors.request.use(config => {
    const token = localStorage.getItem('accessToken');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  });

```

* **Add Response Interceptor (Auto-Refresh):**
Implement automatic 401 handling, calling `POST /api/auth/token/refresh/` with the `refreshToken` and retrying the original request.

### Step 1.3: Refactor Authentication Flow

* **File:** `context/AuthContext.jsx`
* **Replace Login Logic:**
* Endpoint: `POST /api/auth/token/`
* Payload: `{ username, password }`
* Response: `{ access, refresh }`
* **User Extraction:** Decode JWT locally (using `jwt-decode`) to extract `user_id` and `role` from the `access` token. Set `user` state accordingly.



### Step 1.4: Map Role-Based Access Control

* **Files:** `context/AuthContext.jsx`, auth wrapper components.
* **Replace:** `user?.is_instructor` and `user?.is_staff`
* **Implement:**
```javascript
const userRole = user?.role || 'STUDENT';
export const canModerate = ['MODERATOR', 'ADMIN'].includes(userRole);
export const isAdmin = userRole === 'ADMIN';

```



---

## Phase 2: Data Contract & Pagination Adapter

**Objective:** Standardize response parsing, pagination handling, and date/status field mapping.
**Target Files:** `services/api.js`, `components/QuestionExplorer.jsx`, `components/AnswerCard.jsx`

### Step 2.1: Implement Response Transformer

* **Logic:** All `GET` list endpoints return `{ count, next, previous, results }`. Create wrapper functions (`extractResults`, `getPaginationMeta`) to parse `response.data.results`.

### Step 2.2: Field Mapping

* **Status:** Replace `is_verified` with `status`.
* Public visibility filter: Append `?status=APPROVED` to all public list requests.


* **Dates:** Replace `created_at`, `last_updated` with `created_at_jalali`, `updated_at_jalali`.

---

## Phase 3: Content Submission & Attachment Workflow

**Objective:** Replace `multipart/form-data` uploads with the two-step Orphan Claiming pattern.

### Step 3.1: Remove Multipart Submission Logic

* **File:** `AnswerForm.jsx` and `QuestionForm.jsx`
* Change Content-Type to `application/json`.

### Step 3.2: Implement Orphan Upload & Markdown Injection

* On File Drop/Paste: Upload immediately to `POST /api/attachments/` with `FormData` containing only `file`. Extract `id` and `file` (URL). Store `id` in a local state array (`attachmentIds`).

### Step 3.3: Update Submit Handler

* **Payload Structure:**
```json
{
  "question": 42,
  "body": "markdown text...",
  "attachment_ids": [105, 106]
}

```



---

## Phase 4: Routing & Query Parameter Alignment

**Objective:** Replace nested REST paths with flat endpoints + query parameters.

### Step 4.1: Route Mapping

* `/curriculum/courses/` -> `/api/source-materials/`
* `/wiki/questions/{id}/answers/` -> `/api/answers/?question={id}`

---

## Phase 5: Edit Workflow & RBAC Enforcement

**Objective:** Replace direct editing with Wiki-style suggestions and enforce strict role boundaries.

### Step 5.1: Disable Direct Editing for Students

* If `user.role === 'STUDENT'`, hide/disable `Edit` button on posts.

### Step 5.2: Implement Suggest Edit Flow

* **Endpoint:** `POST /api/questions/{id}/suggest_edit/`
* **Payload:** `{ "proposed_text": "...", "attachment_ids": [] }`
* **UI:** Replace edit form with a modal for students.

### Step 5.3: Accept Answer Restriction

* **Endpoint:** `POST /api/answers/{id}/accept/`
* **Constraint:** Only callable by the original question author.

---

## Phase 6: Feature Decommissioning & Mock Fallbacks

**Objective:** Handle endpoints that do not exist in the backend without breaking the UI.

### Step 6.1: Support Tickets and Widgets

* The `/support/tickets/` and `/widgets/*` endpoints do not exist in the backend.
* **Action:** Keep the Support Ticket UI and WidgetsPanel functional by continuing to use **mock data only** for these specific sections. Display a small "Mocked Feature" badge on these panels. Do NOT attempt to integrate them with the backend.

---

## Phase 7: Voting & Comments System Integration

**Objective:** Implement the interactive features that exist in the backend but are missing in the frontend UI.
**Target Files:** `AnswerCard.jsx`, `QuestionDetail.jsx`, `CommentSection.jsx` (New)

### Step 7.1: Implement Voting API

* **Endpoint:** `POST /api/questions/{id}/vote/` & `POST /api/answers/{id}/vote/`
* **Payload:** `{"value": 1}` or `{"value": -1}`
* **Action:** When user clicks upvote/downvote, trigger the API and dynamically update the UI using the returned `{ "new_score": N }`.

### Step 7.2: Build Comments UI

* **Endpoints:** `GET` & `POST /api/questions/{id}/comments/` (and answers).
* **Action:** Create a new `CommentSection.jsx` component to display a list of comments and a text input for authenticated users to submit new comments. Render this component at the bottom of `AnswerCard` and Question details.

---

## Phase 8: Tags & Categories Integration

**Objective:** Utilize the backend's tagging system for questions.
**Target Files:** `QuestionForm.jsx`, `QuestionExplorer.jsx`

### Step 8.1: Fetch Tags & Categories

* **Endpoints:** `GET /api/tags/categories/` and `GET /api/tags/`.
* **Action:** In the Question creation/editing form, fetch these lists to populate a multi-select dropdown.

### Step 8.2: Submit Tags

* Modify the Question `POST` payload to include `"tag_ids": [id1, id2]`.
* Display selected tags visually on the `QuestionExplorer` cards using the `tags` array returned from the backend.

---

## Phase 9: Real Moderation & User Management Dashboards

**Objective:** Replace the placeholder `AdminSupportPanel` with real moderation tools based on backend RBAC.
**Target Files:** `ModerationDashboard.jsx` (New), `UserManagement.jsx` (New)

### Step 9.1: Content Moderation Queue

* **Endpoints:**
* `GET /api/questions/?status=PENDING`
* `GET /api/answers/?status=PENDING`
* `GET /api/suggested-edits/`


* **Action:** Build a dashboard strictly for `MODERATOR` and `ADMIN` roles to view pending content and suggested edits. Include buttons to hit the respective `/approve/` or `/reject/` endpoints.

### Step 9.2: Admin User Management

* **Endpoints:** `GET /api/users/` & `PATCH /api/users/{id}/role/`
* **Action:** Build a user grid (strictly for `ADMIN` role) to list all users, view their current roles, and allow the admin to promote a `STUDENT` to `MODERATOR` (replacing the old mock "Role Request" flow).

---

## Phase 10: Source Material Enhancements

**Objective:** Fully utilize the `SourceMaterial` model attributes in the UI.
**Target Files:** `SourceMaterialList.jsx`, `QuestionExplorer.jsx`

### Step 10.1: Display Associated PDFs

* The `SourceMaterial` object contains `question_pdf`, `answer_pdf`, and `year`.
* **Action:** Update the UI where Source Materials (Exams/Courses) are listed or explored to display the `year` and provide direct download buttons for the `question_pdf` and `answer_pdf` if they are not null.
