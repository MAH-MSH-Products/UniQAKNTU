# API Specification - UniQAKNTU

## Overview
This document defines the REST API endpoints used for dynamic frontend-backend communication. The application uses a hybrid approach: initial page loads are Server-Side Rendered (SSR) via Django templates, while Wiki actions (editing, previewing, history) are handled asynchronously via these endpoints.

## Base URL
`/api/v1/`

## Authentication & Security
- All `POST`, `PUT`, `DELETE` requests MUST include the CSRF token in the headers.
- **Header:** `X-CSRFToken: <token_value>`
- Users must be authenticated via standard Django Session Auth. Unauthenticated requests will return `403 Forbidden`.

---

## Endpoints

### 1. Markdown Preview
Renders raw Markdown + MathJax content into safe HTML. Used for live preview in the editor.

- **URL:** `/markdown/preview/`
- **Method:** `POST`
- **Auth Required:** Yes
- **Request Body:**
  ```json
  {
      "raw_text": "Here is an OS concept: $O(n)$ scheduling."
  }
  ```
- **Response (200 OK):**
  ```json
  {
      "html": "<p>Here is an OS concept: \(O(n)\) scheduling.</p>"
  }
  ```

### 2. Submit / Update Answer
Submits a new answer or updates an existing one. If an answer exists, the backend automatically creates an `AnswerRevision` before updating the `current_body`.

- **URL:** `/questions/{question_id}/answer/`
- **Method:** `POST`
- **Auth Required:** Yes
- **Request Body:**
  ```json
  {
      "body": "Updated markdown text...",
      "edit_summary": "Fixed deadlock prevention algorithm",
      "last_modified": "2026-08-16T18:00:00Z" 
  }
  ```
  *(Note: `last_modified` is used for Optimistic Concurrency Control. If another user edited the answer after this timestamp, return a `409 Conflict`)*
- **Response (200 OK - Updated):**
  ```json
  {
      "status": "success",
      "message": "Answer updated.",
      "revision_id": 42
  }
  ```
- **Response (409 Conflict):**
  ```json
  {
      "error": "Edit conflict. Another user has modified this answer."
  }
  ```

### 3. Fetch Revision History
Retrieves the list of previous revisions for a specific question's answer.

- **URL:** `/questions/{question_id}/revisions/`
- **Method:** `GET`
- **Auth Required:** No (Read-only)
- **Response (200 OK):**
  ```json
  {
      "revisions": [
          {
              "id": 42,
              "editor": "amin_h",
              "created_at": "2026-08-16T18:05:00Z",
              "edit_summary": "Fixed deadlock prevention algorithm"
          },
          {
              "id": 41,
              "editor": "sajjad_h",
              "created_at": "2026-08-15T10:00:00Z",
              "edit_summary": "Initial answer"
          }
      ]
  }
  ```

### 4. Fetch Revision Diff
Gets the difference between two revisions for visual rendering.

- **URL:** `/revisions/{revision_id}/diff/?compare_to={target_revision_id}`
- **Method:** `GET`
- **Auth Required:** No
- **Response (200 OK):**
  ```json
  {
      "diff_html": "<div class='diff-line-added'>+ New algorithm step</div><div class='diff-line-removed'>- Old step</div>"
  }
  ```

### 5. Rollback Revision (Admin/Editor Only)
Reverts the current answer to a specific revision state.

- **URL:** `/revisions/{revision_id}/rollback/`
- **Method:** `POST`
- **Auth Required:** Yes (Admin/Staff only)
- **Request Body:** `{}`
- **Response (200 OK):**
  ```json
  {
      "status": "success",
      "message": "Rolled back successfully."
  }
  ```