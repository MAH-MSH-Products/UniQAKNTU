# Backend Missing Features & Integration Guide

## Overview
This document outlines the missing endpoints, models, and features in the Django Backend that are required to fully support the existing React Frontend. Currently, the frontend has UI components for Support Tickets, Content Reporting, and Dashboard Widgets, but the backend lacks the corresponding APIs.

## 1. Support & Ticketing System (`support` app)
Create a new Django app named `support` to handle user inquiries, role requests, and content reports.

### Models Required
1. **Ticket**
   - `author` (ForeignKey to User)
   - `title` (CharField)
   - `description` (TextField)
   - `category` (CharField choices: 'General Support', 'Technical Issue', 'Content Error', 'Request Instructor Role')
   - `introduction` (TextField, null=True, blank=True) -> *Used specifically when users request an instructor role to provide their resume/background.*
   - `status` (CharField choices: 'Open', 'In-progress', 'Closed', 'Resolved' - default: 'Open')
   - `created_at` / `updated_at` (DateTimeField)

2. **TicketReply**
   - `ticket` (ForeignKey to Ticket, related_name='replies')
   - `user` (ForeignKey to User)
   - `message` (TextField)
   - `created_at` (DateTimeField)

3. **ContentReport**
   - `reporter` (ForeignKey to User)
   - `content_type` & `object_id` (GenericForeignKey to link to either Question or Answer)
   - `reason` (TextField)
   - `status` (CharField choices: 'Pending', 'Resolved', 'Dismissed' - default: 'Pending')
   - `created_at` (DateTimeField)

### API Endpoints
*Base URL: `/api/support/`*

| Method | Endpoint | Auth | Role | Description |
|--------|----------|------|------|-------------|
| GET | `/api/support/tickets/` | Yes | Any | List tickets created by `request.user` (include nested `replies` in the serializer). |
| POST | `/api/support/tickets/` | Yes | Any | Create a new ticket. Payload includes `title`, `description`, `category`, and `introduction` (optional). |
| POST | `/api/support/tickets/{id}/reply/`| Yes | Ticket Author / Admin | Add a `TicketReply` to a ticket. |
| GET | `/api/support/admin/tickets/`| Yes | Admin/Mod | List ALL tickets in the system (for Admin Support Panel). |
| GET | `/api/support/reports/` | Yes | Admin/Mod | List all content reports for admins to review. |
| POST | `/api/support/reports/` | Yes | Any | Create a new `ContentReport`. Expected Frontend Payload: `{ "question_id": ID, "answer_id": ID (optional), "reason": "text" }` |

**Note on Instructor Requests (Workflow Alignment):** 
Do **NOT** build a new role-promotion API logic here. The frontend already handles role promotions via the existing User Management panel (`PATCH /api/users/{id}/role/`). 
The ticketing system's only job is to act as a communication inbox. A student will submit a ticket with the category `"Request Instructor Role"` and fill out the `introduction` field. The Admin will read this ticket in the `AdminSupportPanel`. If convinced, the admin will manually navigate to the Users table and change the role. 

---

## 2. Dashboard Widgets & Analytics
The frontend sidebar features a "Widgets Panel" that displays trending and recent data.

### API Endpoints
*Base URL: `/api/widgets/`*

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/widgets/recent-answers/` | Optional | Returns top 5 most recently created `Answer` objects (status=APPROVED). |
| GET | `/api/widgets/popular-courses/`| Optional | Returns top 5 `SourceMaterial` objects, ordered by the count of related questions. |
| GET | `/api/widgets/latest-exams/` | Optional | Returns top 5 most recently created `SourceMaterial` objects. |

**Expected Payload Structure for Widgets (Example for recent-answers):**
```json
{
  "results": [
    {
      "id": 1,
      "title": "Question Title Snippet",
      "course": "Source Material Title",
      "author": "Author Username",
      "date": "1403/08/15" // Jalali date
    }
  ]
}

```

---

## 3. Instructor Analytics (Optional / Future Feature)

Currently, the `/instructor/dashboard` route in the frontend is an empty UI placeholder. To make it functional in the future, the backend will need:

* **Endpoint:** `GET /api/users/me/stats/`
* **Purpose:** Return analytics for the instructor (e.g., total answers provided, total upvotes received, total accepted answers).
