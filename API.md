# 📄 `API.md` — UniQAKNTU Frontend API Reference

> **Status:** ✅ Final (Aligned with Backend `schema.yml`)
> **Base URL:** `/api/`
> **Auth Scheme:** `Authorization: Bearer <JWT_ACCESS_TOKEN>`
> **API Docs (Swagger):** `/api/docs/`

---

## 1️⃣ Global Conventions

### 1.1 Pagination
All list endpoints return a paginated response (page size = 20):

```json
{
  "count": 142,
  "next": "http://.../api/questions/?page=2",
  "previous": null,
  "results": [ { ... }, { ... } ]
}
```

➡️ **Frontend MUST** extract `response.data.results` for rendering and use `next`/`previous` URLs directly for navigation.

### 1.2 Date Fields
Every model exposes two versions of timestamps:
- `created_at` / `updated_at` → ISO 8601 (UTC)
- `created_at_jalali` / `updated_at_jalali` → Persian Shamsi string (e.g., `"1403/08/15 14:32"`)

➡️ **Frontend MUST** render `*_jalali` fields in UI. Use ISO fields only for sorting/computation.

### 1.3 Status Lifecycle
`Question`, `Answer`, and `SuggestedEdit` share a status enum:

| Status | Visibility | Description |
|--------|-----------|-------------|
| `PENDING` | Only author + moderators | Default on creation |
| `APPROVED` | Public | Shown in public lists |
| `REJECTED` | Only moderators | Hidden |

➡️ **Public lists MUST append** `?status=APPROVED` by default.

### 1.4 Role Enum
Users have a strict role field (not booleans):

```typescript
type Role = "STUDENT" | "MODERATOR" | "ADMIN";
```

| Capability | STUDENT | MODERATOR | ADMIN |
|------------|:-------:|:---------:|:-----:|
| Create posts | ✅ | ✅ | ✅ |
| Edit own posts directly | ❌ (use `suggest_edit`) | ✅ | ✅ |
| Delete any post | ❌ | ✅ | ✅ |
| Approve/Reject posts | ❌ | ✅ | ✅ |
| Change user roles | ❌ | ❌ | ✅ |
| List all users | ❌ | ✅ | ✅ |

### 1.5 Orphan Attachment Pattern (CRITICAL)
Files are **never** sent inline with post creation. A two-step flow is enforced:

```
Step 1: POST /api/attachments/   (multipart/form-data)
        → returns { id, file, uploader, ... }

Step 2: POST /api/questions/     (application/json)
        → body includes attachment_ids: [id1, id2]
```

➡️ On `PATCH`, pass the **final desired array** of IDs. The backend declaratively removes any attachment missing from the array.

---

## 2️⃣ Authentication

### `POST /api/auth/token/`
Login and receive JWT pair.

**Request:**
```json
{ "username": "string", "password": "string" }
```

**Response `200`:**
```json
{
  "refresh": "eyJhbG...",   // 90 days
  "access":  "eyJhbG..."    // 30 minutes
}
```

⚠️ No `user` object is returned. Frontend must decode JWT or call `/api/users/{id}/` to populate user state.

### `POST /api/auth/token/refresh/`
Exchange a valid refresh token for a new access token.

**Request:**
```json
{ "refresh": "eyJhbG..." }
```

**Response `200`:**
```json
{ "access": "eyJhbG..." }
```

➡️ **Interceptor pattern:** On `401`, call this endpoint, retry the original request. On refresh failure, redirect to `/login`.

---

## 3️⃣ Users

### `GET /api/users/`  _(MODERATOR / ADMIN)_
List users with filters.

**Query:** `?role=STUDENT|MODERATOR|ADMIN`, `?search=<text>`, `?page=`

**Response `results[]`:**
```json
{
  "id": "uuid",
  "username": "ali_k",
  "email": "ali@kntu.ac.ir",
  "first_name": "Ali",
  "last_name": "Karimi",
  "role": "STUDENT",
  "date_joined": "2024-01-15T08:00:00Z"
}
```

### `GET /api/users/{id}/`  _(MODERATOR / ADMIN)_
Retrieve single user. Path `id` is UUID.

### `PATCH /api/users/{id}/role/`  _(ADMIN ONLY)_
**Request:**
```json
{ "role": "MODERATOR" }
```
**Response `200`:** Updated user object.

---

## 4️⃣ Source Materials _(replaces `/curriculum/courses/`)_

### `GET /api/source-materials/`
List courses/textbooks. Public. Supports `?search=`.

**Result item:**
```json
{
  "id": 12,
  "title": "Engineering Mathematics",
  "author": "Dr. Smith",
  "description": "...",
  "created_at_jalali": "1403/02/10 09:15"
}
```

### `POST /api/source-materials/` _(MODERATOR / ADMIN)_
### `PATCH /api/source-materials/{id}/` _(MODERATOR / ADMIN)_
### `DELETE /api/source-materials/{id}/` _(MODERATOR / ADMIN)_

---

## 5️⃣ Tags

### `GET /api/tags/`
Public list. Supports `?search=`.

```json
{ "id": 4, "name": "linear-algebra", "created_at_jalali": "..." }
```

### `POST /api/tags/` _(MODERATOR / ADMIN)_
```json
{ "name": "fourier-transform" }
```

### `PATCH /api/tags/{id}/`, `DELETE /api/tags/{id}/` _(MODERATOR / ADMIN)_

---

## 6️⃣ Questions

### `GET /api/questions/`
Public (auto-filtered to `APPROVED` for non-authors).

**Query params:**
- `?status=PENDING|APPROVED|REJECTED`
- `?search=` (title + body)
- `?source_material=<id>`
- `?tags=<id>` (can repeat)
- `?author=<uuid>`

**Result item:**
```json
{
  "id": 42,
  "title": "Why does eigenvalue...",
  "body": "markdown...",
  "status": "APPROVED",
  "score": 7,
  "user_vote": 1,           // 1, -1, or 0 for current user
  "is_accepted": false,
  "author": { "id": "uuid", "username": "ali_k", "role": "STUDENT" },
  "source_material": { "id": 12, "title": "..." },
  "tags": [ { "id": 4, "name": "linear-algebra" } ],
  "attachments": [ { "id": 101, "file": "https://.../img.png" } ],
  "created_at_jalali": "1403/08/15 14:32",
  "updated_at_jalali": "1403/08/16 09:10"
}
```

### `POST /api/questions/` _(Authenticated)_
```json
{
  "title": "string",
  "body": "markdown string",
  "source_material": 12,         // integer ID
  "tag_ids": [4, 7],             // integer IDs
  "attachment_ids": [101, 102]   // orphan IDs from Step 1
}
```
➡️ Response status is `201` with `status: "PENDING"`.

### `GET /api/questions/{id}/`
### `PATCH /api/questions/{id}/` _(Author if MOD/ADMIN, else 403)_
### `DELETE /api/questions/{id}/` _(MODERATOR / ADMIN)_

### Actions (all under `/api/questions/{id}/<action>/`):

| Action | Method | Who | Body | Response |
|--------|--------|-----|------|----------|
| `vote/` | POST | Authenticated | `{"value": 1 \| -1}` (toggle) | `{ "score": N, "user_vote": V }` |
| `comments/` | GET/POST | Auth (POST) | `{"body": "text"}` on POST | Comment list/object |
| `suggest_edit/` | POST | Authenticated | `{ "proposed_text": "...", "attachment_ids": [...] }` | `{ "message": "...", "suggested_edit_id": N }` `201` |
| `approve/` | POST | MOD / ADMIN | — | `{ "message": "Question approved." }` |
| `reject/` | POST | MOD / ADMIN | — | `{ "message": "Question rejected." }` |

---

## 7️⃣ Answers

### `GET /api/answers/`
**Query:** `?question=<id>` (required for scoping), `?status=`, `?author=`

### `POST /api/answers/`
```json
{
  "question": 42,                // integer ID
  "body": "markdown...",
  "attachment_ids": [103]
}
```

### `GET /api/answers/{id}/`
### `PATCH /api/answers/{id}/` _(same rules as Questions)_
### `DELETE /api/answers/{id}/` _(MOD / ADMIN)_

### Actions:

| Action | Method | Who | Notes |
|--------|--------|-----|-------|
| `vote/` | POST | Authenticated | Toggle `1` / `-1` |
| `comments/` | GET/POST | Authenticated | — |
| `accept/` | POST | **Question author only** | Marks `is_accepted = true` |
| `suggest_edit/` | POST | Authenticated | Same payload as Question |
| `approve/` | POST | MOD / ADMIN | — |
| `reject/` | POST | MOD / ADMIN | — |

---

## 8️⃣ Attachments (Orphan Upload)

### `POST /api/attachments/`  _(Authenticated, multipart/form-data)_

**Form fields:**
- `file` — required, binary

**Response `201`:**
```json
{
  "id": 105,
  "file": "https://cdn.../abc.png",
  "uploader": "uuid",
  "content_type": null,
  "object_id": null
}
```

➡️ Store `id` locally, inject `file` URL into Markdown editor, include `id` in `attachment_ids` array on post submission. The backend will "claim" the orphan when the parent post is saved.

---

## 9️⃣ Suggested Edits  _(Moderation Queue)_

### `GET /api/suggested-edits/`  _(MOD / ADMIN)_
List all pending edits across Questions and Answers.

### `GET /api/suggested-edits/{id}/`  _(MOD / ADMIN)_

### `POST /api/suggested-edits/{id}/approve/`  _(MOD / ADMIN)_
Applies `proposed_text` to target post, attaches new files, removes `removed_attachment_ids`.

**Response:** `{ "message": "Edit approved and applied." }`

### `POST /api/suggested-edits/{id}/reject/`  _(MOD / ADMIN)_
**Response:** `{ "message": "Edit rejected." }`

---

## 🔟 Error Handling

| Status | Meaning | Frontend Action |
|--------|---------|-----------------|
| `400` | Validation error | Show field-level errors from `response.data` |
| `401` | Token expired / invalid | Trigger refresh interceptor |
| `403` | Permission denied | Hide action / show toast |
| `404` | Not found | Show empty state |
| `429` | Rate limited | Backoff & retry |

Validation error shape:
```json
{
  "title": ["This field is required."],
  "attachment_ids": ["Invalid pk \"999\" - object does not exist."]
}
```

---

## 🚫 Deprecated / Removed Endpoints

The following paths from the **old** `API.md` **do NOT exist** in the backend and must be removed from frontend code:

| ❌ Old Path | ✅ Replacement |
|-------------|---------------|
| `POST /auth/login/` | `POST /api/auth/token/` |
| `POST /auth/role-request/` | _(removed — roles are admin-managed)_ |
| `GET /curriculum/courses/` | `GET /api/source-materials/` |
| `GET /curriculum/courses/{id}/exams/` | `GET /api/questions/?source_material={id}` |
| `GET /wiki/questions/{id}/answers/` | `GET /api/answers/?question={id}` |
| `/support/tickets/*` | _(no backend support — disable UI)_ |
| `/widgets/*` | _(no backend support — disable UI)_ |
| `PUT /api/questions/{id}/` by STUDENT | Use `POST .../suggest_edit/` |
| `multipart/form-data` on question/answer POST | Use `application/json` + orphan pattern |

---

## 📋 Frontend Integration Checklist

- [ ] Base URL → `/api/`
- [ ] Header → `Authorization: Bearer <access>`
- [ ] 401 interceptor → auto-refresh via `/api/auth/token/refresh/`
- [ ] All list responses → read `.data.results`, paginate via `.next`/`.previous`
- [ ] Render dates from `*_jalali` fields only
- [ ] Public lists always include `?status=APPROVED`
- [ ] File uploads → orphan flow (`POST /api/attachments/` first)
- [ ] Submit payloads → `application/json` with `attachment_ids: [...]`
- [ ] Role checks → use `user.role` enum, not boolean flags
- [ ] Student "Edit" button → redirect to `suggest_edit` modal
- [ ] `/support/` and `/widgets/` UI → disabled or mocked

---