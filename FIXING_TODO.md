# `fixing_TODO.md`

## 📌 Overview
This document provides a phased, file-by-file migration plan to align the React frontend with the finalized Django REST Framework backend. **The backend is strictly immutable.** All modifications must be applied exclusively to frontend components, services, and state management layers. An AI agent can execute these steps sequentially without prior project knowledge.

---

## 🟦 Phase 1: API Client & Authentication Layer
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
- **Add Response Interceptor (Auto-Refresh):**
  ```javascript
  api.interceptors.response.use(
    response => response,
    async error => {
      const originalRequest = error.config;
      if (error.response?.status === 401 && !originalRequest._retry) {
        originalRequest._retry = true;
        try {
          const refresh = localStorage.getItem('refreshToken');
          const { data } = await api.post('/auth/token/refresh/', { refresh });
          localStorage.setItem('accessToken', data.access);
          originalRequest.headers.Authorization = `Bearer ${data.access}`;
          return api(originalRequest);
        } catch (refreshError) {
          localStorage.clear();
          window.location.href = '/login';
        }
      }
      return Promise.reject(error);
    }
  );
  ```

### Step 1.3: Refactor Authentication Flow
- **File:** `context/AuthContext.jsx`
- **Replace Login Logic:**
  - Endpoint: `POST /api/auth/token/`
  - Payload: `{ username, password }`
  - Response: `{ access, refresh }`
  - Store both in `localStorage`: `accessToken`, `refreshToken`.
  - **User Extraction:** Backend does not return user object. Decode JWT locally or fetch `/api/users/{user_id}/`. Recommended: Use `jwt-decode` library to extract `user_id` and `role` from `access` token immediately after login. Set `user` state accordingly.
  - Update `logout()` to clear both tokens.

### Step 1.4: Map Role-Based Access Control
- **Files:** `context/AuthContext.jsx`, `components/RequireInstructor.jsx`
- **Replace:** `user?.is_instructor` and `user?.is_staff`
- **Implement:** 
  ```javascript
  const userRole = user?.role || 'STUDENT';
  export const canModerate = ['MODERATOR', 'ADMIN'].includes(userRole);
  export const isAdmin = userRole === 'ADMIN';
  ```
- Update `RequireInstructor.jsx` to check `canModerate` instead of `is_instructor`.

---

## 🟨 Phase 2: Data Contract & Pagination Adapter
**Objective:** Standardize response parsing, pagination handling, and date/status field mapping.
**Target Files:** `services/api.js`, `components/QuestionExplorer.jsx`, `components/AnswerCard.jsx`, `components/Home.jsx`

### Step 2.1: Implement Response Transformer
- **File:** `services/api.js` or a dedicated `utils/adapter.js`
- **Logic:** All `GET` list endpoints return `{ count, next, previous, results }`. Create a wrapper:
  ```javascript
  export const extractResults = (response) => response.data.results || [];
  export const getPaginationMeta = (response) => ({
    count: response.data.count,
    next: response.data.next,
    previous: response.data.previous,
  });
  ```

### Step 2.2: Update List Fetching Components
- **Files:** `QuestionExplorer.jsx`, `Home.jsx`
- Replace direct `response.data` usage with `extractResults(response)`.
- Bind pagination UI to `next`/`previous` URLs. Do not implement client-side pagination.

### Step 2.3: Field Mapping
- **Files:** `AnswerCard.jsx`, `QuestionCard.jsx`, any component rendering timestamps/status
- **Status:** Replace `is_verified` with `status`. 
  - Public visibility filter: Append `?status=APPROVED` to all list requests.
  - UI Badge: Show `Pending Review` if `status === 'PENDING'`, `Approved` if `status === 'APPROVED'`.
- **Dates:** Replace `created_at`, `last_updated`, `updated_at` with `created_at_jalali`, `updated_at_jalali`.
- **Votes:** Use `user_vote` (returns `1`, `-1`, or `0`) to style vote buttons. Do not calculate client-side.

---

## 🟧 Phase 3: Content Submission & Attachment Workflow
**Objective:** Replace `multipart/form-data` uploads with the two-step Orphan Claiming pattern.
**Target Files:** `components/AnswerForm.jsx`, `components/MarkdownEditor.jsx`, `components/QuestionForm.jsx`

### Step 3.1: Remove Multipart Submission Logic
- **File:** `AnswerForm.jsx` (and `QuestionForm.jsx`)
- **Delete:** `formData.append('image')`, `formData.append('pdf_file')`, `formData.append('current_body')`.
- **Change Content-Type:** Ensure all `POST/PATCH` requests use `application/json` (default for Axios).

### Step 3.2: Implement Orphan Upload & Markdown Injection
- **File:** `MarkdownEditor.jsx` or `AnswerForm.jsx`
- **On File Drop/Paste:**
  1. Upload immediately to `POST /api/attachments/` with `FormData` containing only `file`.
  2. On success, extract `id` and `file` (URL).
  3. Insert `![attachment](url)` into markdown editor state.
  4. Store `id` in a local state array: `attachmentIds: [1, 2, 3]`.

### Step 3.3: Update Submit Handler
- **File:** `AnswerForm.jsx`
- **Payload Structure:**
  ```json
  {
    "question": 42,
    "body": "markdown text with ![img](url)...",
    "attachment_ids": [105, 106]
  }
  ```
- **Question Form Payload:** Add `source_material` (integer ID) and `tag_ids` (array of integers).
- **Validation:** Ensure `attachment_ids` matches the IDs stored during upload.

---

## 🟥 Phase 4: Routing & Query Parameter Alignment
**Objective:** Replace nested REST paths with flat endpoints + query parameters.
**Target Files:** `App.jsx`, `services/api.js`, `components/QuestionExplorer.jsx`, `components/AnswerForm.jsx`

### Step 4.1: Route Mapping Table
| Old Frontend Route | New Backend Endpoint | Query Parameter |
|-------------------|----------------------|-----------------|
| `/curriculum/courses/` | `/api/source-materials/` | None |
| `/curriculum/courses/{id}/exams/` | `/api/source-materials/` | `?id={id}` (retrieve single) |
| `/wiki/questions/{id}/answers/` | `/api/answers/` | `?question={id}` |
| `/wiki/answers/{id}/` | `/api/answers/{id}/` | None (path param) |

### Step 4.2: Update Service Calls
- Replace `GET /wiki/questions/${qid}/answers/` with `GET /api/answers/?question=${qid}`.
- Replace `GET /curriculum/courses/` with `GET /api/source-materials/`.
- Cache `source-materials` list in a global store or context to populate dropdowns in `QuestionForm`.

---

## 🟪 Phase 5: Edit Workflow & RBAC Enforcement
**Objective:** Replace direct editing with Wiki-style suggestions and enforce strict role boundaries.
**Target Files:** `AnswerCard.jsx`, `QuestionDetail.jsx`, `components/SuggestEditModal.jsx` (create if missing)

### Step 5.1: Disable Direct Editing for Students
- **Logic:** If `user.role === 'STUDENT'`, hide/disable `Edit` button on posts.
- **Backend Constraint:** `PUT/PATCH` to `/api/questions/{id}/` or `/api/answers/{id}/` will return `403 Forbidden` for students.

### Step 5.2: Implement Suggest Edit Flow
- **Endpoint:** `POST /api/questions/{id}/suggest_edit/` or `POST /api/answers/{id}/suggest_edit/`
- **Payload:** 
  ```json
  {
    "proposed_text": "updated markdown",
    "attachment_ids": [1, 2]
  }
  ```
- **UI:** Replace edit form with a modal. On submit, show `201 Created` response and display "Edit Pending Review" badge.

### Step 5.3: Accept Answer Restriction
- **Endpoint:** `POST /api/answers/{id}/accept/`
- **Constraint:** Only callable by the original question author. Frontend must verify `question.author.id === currentUser.id` before rendering the accept button.

---

## ⬛ Phase 6: Feature Decommissioning & Mock Fallbacks
**Objective:** Handle endpoints that do not exist in the backend without breaking the UI.
**Target Files:** `components/SupportCenter.jsx`, `components/WidgetsPanel.jsx`, `App.jsx`

### Step 6.1: Remove/Disable Non-Existent Endpoints
- `/support/tickets/`, `/auth/role-request/`, `/widgets/recent-answers/`, `/widgets/popular-courses/`
- **Action:** 
  - Comment out or remove route imports in `App.jsx`.
  - In `SupportCenter.jsx`, replace the "Request Instructor Role" tab with a static notice: `"Role changes are managed by administrators. Contact support offline."`
  - In `WidgetsPanel.jsx`, replace API calls with mock data or remove the panel until backend support is added.

### Step 6.2: UI Fallbacks
- Add `?mock=true` flag or conditional rendering:
  ```jsx
  {process.env.REACT_APP_ENABLE_MOCK_WIDGETS === 'true' ? <MockWidgets /> : <EmptyState />}
  ```

---

## ✅ Final Verification Checklist
- [ ] All `POST /auth/login/` calls replaced with `POST /api/auth/token/` (JWT).
- [ ] `Authorization` header uses `Bearer <accessToken>`.
- [ ] `401` responses trigger automatic token refresh.
- [ ] List responses parsed via `response.data.results`.
- [ ] All dates use `*_jalali` fields.
- [ ] Public lists include `?status=APPROVED`.
- [ ] File uploads use two-step orphan pattern (`attachment_ids` array).
- [ ] Nested routes replaced with flat endpoints + query params.
- [ ] Student users cannot trigger `PUT/PATCH` on posts.
- [ ] `/support/` and `/widgets/` routes hidden or mocked.
- [ ] No backend files modified.

**Execution Order:** Phase 1 → 2 → 3 → 4 → 5 → 6. Test each phase independently before proceeding.