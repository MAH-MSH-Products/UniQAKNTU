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
   - `status` (CharField choices: 'Pending', 'Resolved', 'Dismissed')
   - `created_at` (DateTimeField)

### API Endpoints
*Base URL: `/api/support/`*

| Method | Endpoint | Auth | Role | Description |
|--------|----------|------|------|-------------|
| GET | `/api/support/tickets/` | Yes | Any | List tickets created by `request.user` (include nested `replies`). |
| POST | `/api/support/tickets/` | Yes | Any | Create a new ticket. |
| POST | `/api/support/tickets/{id}/reply/`| Yes | Ticket Author / Admin | Add a `TicketReply` to a ticket. |
| GET | `/api/support/admin/tickets/`| Yes | Admin/Mod | List ALL tickets in the system (for Admin Panel). |
| POST | `/api/support/reports/` | Yes | Any | Create a new `ContentReport`. Payload: `{ "question_id": ID, "answer_id": ID (optional), "reason": "text" }` |

**Note on Instructor Requests:** A student will submit a ticket with category `"Request Instructor Role"`. The Admin will read this ticket in the `AdminSupportPanel`, and if approved, the admin will navigate to the User Management dashboard (`PATCH /api/users/{id}/role/`) to perform the actual promotion.

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

**Expected Payload Structure for Widgets:**
```json
// Example for recent-answers
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