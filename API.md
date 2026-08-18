# REST API Specification - UniQAKNTU

## Overview
This document defines the REST API endpoints for the Decoupled Architecture (Django REST Framework Backend + React Frontend).

## Base URL
`http://<domain>/api/v1/`

## Authentication & Security
- **Type:** Token Authentication (DRF Token or JWT).
- **Header:** `Authorization: Token <your_token>` or `Authorization: Bearer <your_jwt>`
- Unauthorized requests return `401 Unauthorized`.
- Forbidden requests (e.g., student trying to post an answer) return `403 Forbidden`.

---

## 1. Authentication & Users (`/auth/`)

### 1.1 Login
- **URL:** `/auth/login/`
- **Method:** `POST`
- **Auth Required:** No
- **Payload (`application/json`):**
  ```json
  {
      "username": "student_01",
      "password": "password123"
  }
  ```
- **Response (200 OK):**
  ```json
  {
      "token": "abc123xyz...",
      "user": {
          "id": 1,
          "username": "student_01",
          "is_instructor": false,
          "is_staff": false
      }
  }
  ```

### 1.2 Request Instructor Role
- **URL:** `/auth/role-request/`
- **Method:** `POST`
- **Auth Required:** Yes
- **Payload (`application/json`):**
  ```json
  {
      "introduction": "I am a TA for the OS course and would like to post official solutions."
  }
  ```
- **Response (201 Created):**
  ```json
  {
      "status": "Request submitted successfully. Pending admin approval."
  }
  ```

---

## 2. Curriculum (`/curriculum/`)

### 2.1 Get Courses
- **URL:** `/curriculum/courses/`
- **Method:** `GET`
- **Auth Required:** Yes
- **Response (200 OK):**
  ```json
  [
      {
          "id": 1,
          "name": "Operating Systems",
          "code": "CE414"
      }
  ]
  ```

### 2.2 Get Exams for Course
- **URL:** `/curriculum/courses/{course_id}/exams/`
- **Method:** `GET`
- **Auth Required:** Yes
- **Response (200 OK):**
  ```json
  [
      {
          "id": 10,
          "title": "Final Exam 1402",
          "year": 1402,
          "semester": "Fall"
      }
  ]
  ```

### 2.3 Get Questions for Exam
- **URL:** `/curriculum/exams/{exam_id}/questions/`
- **Method:** `GET`
- **Auth Required:** Yes
- **Response (200 OK):**
  ```json
  [
      {
          "id": 105,
          "question_number": 1,
          "text": "Explain Banker's Algorithm.",
          "image": "/media/questions/q1.png"
      }
  ]
  ```

---

## 3. Wiki / Answers (`/wiki/`)

### 3.1 Get Answers for Question
- **URL:** `/wiki/questions/{question_id}/answers/`
- **Method:** `GET`
- **Auth Required:** Yes
- **Response (200 OK):**
  ```json
  [
      {
          "id": 42,
          "author": {
              "id": 5,
              "name": "Dr. Hamed Khanmirza",
              "title": "Professor"
          },
          "current_body": "Detailed markdown explanation...",
          "image": "/media/answers/images/solution_1.png",
          "pdf_file": null,
          "is_verified": true,
          "last_updated": "2026-08-16T18:00:00Z"
      }
  ]
  ```

### 3.2 Submit Answer (Instructor Only)
- **URL:** `/wiki/questions/{question_id}/answers/`
- **Method:** `POST`
- **Auth Required:** Yes (Requires `is_instructor = true`)
- **Content-Type:** `multipart/form-data`
- **Payload:**
  - `current_body` (Text - optional if file is provided)
  - `image` (File - optional)
  - `pdf_file` (File - optional)
- **Response (201 Created):**
  ```json
  {
      "id": 43,
      "message": "Answer created successfully."
  }
  ```
- **Error (400 Bad Request):** If instructor already has an answer for this question (due to `unique_together` constraint).

### 3.3 Update Answer
- **URL:** `/wiki/answers/{answer_id}/`
- **Method:** `PUT` / `PATCH`
- **Auth Required:** Yes (Must be the `author` of the answer)
- **Content-Type:** `multipart/form-data`
- **Payload:** Same as 3.2.
- **Response (200 OK):**
  ```json
  {
      "status": "Answer updated successfully."
  }
  ```

---

## 4. Support & Ticketing (`/support/`)

### 4.1 Submit Support Ticket
- **URL:** `/support/tickets/`
- **Method:** `POST`
- **Auth Required:** Yes
- **Payload (`application/json`):**
  ```json
  {
      "title": "Cannot upload PDF",
      "description": "I get a 500 error when attaching a PDF.",
      "category": "Technical"
  }
  ```
- **Response (201 Created):**
  ```json
  {
      "id": 1001,
      "status": "Ticket created."
  }
  ```

### 4.2 Get User Tickets
- **URL:** `/support/tickets/`
- **Method:** `GET`
- **Auth Required:** Yes
- **Response (200 OK):** Array of ticket objects belonging to the current user.

### 4.3 Get All Tickets (Admin Only)
- **URL:** `/support/admin/tickets/`
- **Method:** `GET`
- **Auth Required:** Yes (Requires `is_staff = true`)
- **Response (200 OK):** Array of all tickets in the system.

### 4.4 Submit Ticket Reply
- **URL:** `/support/tickets/{ticket_id}/reply/`
- **Method:** `POST`
- **Auth Required:** Yes (Must be ticket owner or admin)
- **Payload (`application/json`):**
  ```json
  {
      "message": "Please try again now, issue is fixed."
  }
  ```
- **Response (201 Created):**
  ```json
  {
      "status": "Reply added."
  }
  ```

### 4.5 Submit Content Report
- **URL:** `/support/reports/`
- **Method:** `POST`
- **Auth Required:** Yes
- **Payload (`application/json`):**
  ```json
  {
      "question_id": 105,
      "answer_id": 42, 
      "reason": "The final formula in the PDF is incorrect."
  }
  ```
- **Response (201 Created):**
  ```json
  {
      "status": "Report submitted to admins."
  }
  ```

---

## 5. Widgets (`/widgets/`)

### 5.1 Get Recent Answers
- **URL:** `/widgets/recent-answers/`
- **Method:** `GET`
- **Auth Required:** Yes
- **Description:** Returns the most recently added instructor answers (top 5-10).
- **Response (200 OK):**
  ```json
  [
      {
          "id": 42,
          "title": "Banker's Algorithm Solution",
          "course": "Operating Systems",
          "author": "Dr. Khanmirza",
          "date": "2026-08-16"
      },
      {
          "id": 41,
          "title": "Deadlock Prevention",
          "course": "Operating Systems",
          "author": "Prof. Rahimi",
          "date": "2026-08-15"
      }
  ]
  ```

### 5.2 Get Popular Courses
- **URL:** `/widgets/popular-courses/`
- **Method:** `GET`
- **Auth Required:** Yes
- **Description:** Returns the top courses based on the number of exams/questions available.
- **Response (200 OK):**
  ```json
  [
      {
          "id": 1,
          "name": "Operating Systems",
          "code": "CE414",
          "examCount": 12
      },
      {
          "id": 2,
          "name": "Computer Networks",
          "code": "CE420",
          "examCount": 10
      }
  ]
  ```

### 5.3 Get Latest Exams
- **URL:** `/widgets/latest-exams/`
- **Method:** `GET`
- **Auth Required:** Yes
- **Description:** Returns the most recently added exams.
- **Response (200 OK):**
  ```json
  [
      {
          "id": 15,
          "title": "Final Exam 1402",
          "course": "Operating Systems",
          "date": "2026-08-16"
      },
      {
          "id": 14,
          "title": "Midterm 1402",
          "course": "Computer Networks",
          "date": "2026-08-15"
      }
  ]
  ```