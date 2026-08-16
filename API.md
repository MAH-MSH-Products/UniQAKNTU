# API Specification - UniQAKNTU

## Overview
This document defines the REST API endpoints used for dynamic frontend-backend communication. The application uses a hybrid approach: initial page loads are Server-Side Rendered (SSR) via Django templates, while Answer actions (creating, editing, viewing multiple answers) are handled asynchronously via these endpoints.

**Architecture Change:** The system has migrated from a Wiki-style single-answer model to an **Instructor-led Multi-Answer system** with strict Role-Based Access Control (RBAC). Students have Read-Only access, while verified Instructors can post and edit their own isolated answers.

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
      "html": "<p>Here is an OS concept: \\(O(n)\\) scheduling.</p>"
  }
  ```

### 2. Fetch All Answers for a Question
Returns all instructor answers for a specific question. Each answer includes author information and verification status.

- **URL:** `/questions/{question_id}/answers/`
- **Method:** `GET`
- **Auth Required:** No (Read-only)
- **Response (200 OK):**
  ```json
  {
      "answers": [
          {
              "id": 1,
              "author_name": "dr_khanmirza",
              "author_is_instructor": true,
              "current_body": "The scheduler uses Round Robin algorithm...",
              "is_verified": true,
              "created_at": "2026-08-16T10:00:00Z"
          },
          {
              "id": 2,
              "author_name": "prof_smith",
              "author_is_instructor": true,
              "current_body": "Alternative approach using Priority Scheduling...",
              "is_verified": false,
              "created_at": "2026-08-16T14:30:00Z"
          }
      ]
  }
  ```

### 3. Create New Answer (Instructors Only)
Creates a new answer for a question. **Strictly requires `is_instructor = True`**. Students cannot create answers.

- **URL:** `/questions/{question_id}/answers/`
- **Method:** `POST`
- **Auth Required:** Yes
- **Permission Required:** `user.is_instructor == True` (Returns 403 Forbidden for non-instructors)
- **Request Body:**
  ```json
  {
      "body": "The solution involves implementing a mutex lock...",
      "edit_summary": "Initial answer submission"
  }
  ```
- **Response (201 Created):**
  ```json
  {
      "status": "success",
      "message": "Answer created successfully.",
      "answer_id": 42
  }
  ```
- **Response (403 Forbidden):**
  ```json
  {
      "error": "Only instructors can create answers."
  }
  ```
- **Response (409 Conflict):**
  ```json
  {
      "error": "You have already submitted an answer to this question."
  }
  ```

### 4. Update Answer (Author Only)
Updates an existing answer. Only the original author can update their own answer.

- **URL:** `/answers/{answer_id}/update/`
- **Method:** `PUT`
- **Auth Required:** Yes
- **Permission Required:** User must be the author of the answer
- **Request Body:**
  ```json
  {
      "body": "Updated markdown text with corrections...",
      "edit_summary": "Fixed typo in algorithm explanation"
  }
  ```
- **Response (200 OK):**
  ```json
  {
      "status": "success",
      "message": "Answer updated.",
      "revision_id": 5
  }
  ```

### 5. Request Instructor Status
New endpoint for students to request an upgrade to instructor status.

- **URL:** `/users/request-instructor/`
- **Method:** `POST`
- **Auth Required:** Yes
- **Request Body:**
  ```json
  {
      "reason": "I am a teaching assistant for this course and need to provide official solutions."
  }
  ```
- **Response (201 Created):**
  ```json
  {
      "status": "success",
      "message": "Role request submitted. Please wait for admin approval."
  }
  ```
- **Response (400 Bad Request):**
  ```json
  {
      "error": "You have already submitted a pending request."
  }
  ```

### 6. Fetch Revision History for an Answer
Retrieves the revision history for a specific answer (personal revision history for that instructor's answer).

- **URL:** `/answers/{answer_id}/revisions/`
- **Method:** `GET`
- **Auth Required:** No (Read-only)
- **Response (200 OK):**
  ```json
  {
      "revisions": [
          {
              "id": 5,
              "editor": "dr_khanmirza",
              "created_at": "2026-08-16T18:05:00Z",
              "edit_summary": "Fixed deadlock prevention algorithm"
          },
          {
              "id": 4,
              "editor": "dr_khanmirza",
              "created_at": "2026-08-15T10:00:00Z",
              "edit_summary": "Initial answer"
          }
      ]
  }
  ```
