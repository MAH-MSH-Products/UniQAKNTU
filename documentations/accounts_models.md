# Accounts App Models Documentation

## Overview
The `accounts` app handles user authentication and Role-Based Access Control (RBAC) for the UniQAKNTU platform. It extends Django's default `AbstractUser` to add instructor/student role differentiation and provides a workflow for students to request instructor status.

## Models

### 1. User Model
**Location:** `apps/accounts/models.py`

The custom `User` model extends Django's `AbstractUser` to add RBAC fields for distinguishing between instructors and students.

#### Fields

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `is_instructor` | BooleanField | `False` | Indicates if the user has instructor privileges. Instructors can create and edit answers. |
| `is_student` | BooleanField | `True` | Indicates if the user has student privileges. Students have read-only access to answers. |

#### Behavior
- By default, all new users are created as students (`is_student=True`, `is_instructor=False`).
- When a user's `RoleRequest` is approved by an admin, `is_instructor` is set to `True` and `is_student` is set to `False`.
- These flags are used throughout the application to enforce access control:
  - Only users with `is_instructor=True` can create or edit answers.
  - All authenticated users can view answers, but only instructors can modify their own.

#### Example Usage
```python
from apps.accounts.models import User

# Check if user is an instructor
if request.user.is_instructor:
    # Allow answer creation
    pass

# Check if user is a student
if request.user.is_student:
    # Read-only access
    pass
```

---

### 2. RoleRequest Model
**Location:** `apps/accounts/models.py`

The `RoleRequest` model manages the workflow for students requesting to be upgraded to instructor status. This provides an auditable trail of role change requests.

#### Fields

| Field | Type | Description |
|-------|------|-------------|
| `user` | ForeignKey (User) | Reference to the user who submitted the request. On delete: CASCADE. |
| `status` | CharField | Current status of the request. Choices: `Pending`, `Approved`, `Rejected`. Default: `Pending`. |
| `created_at` | DateTimeField | Timestamp when the request was created. Auto-set on creation. |

#### Status Choices
- **Pending:** Request is awaiting admin review.
- **Approved:** Request has been approved; user should have `is_instructor=True`.
- **Rejected:** Request has been denied.

#### Meta Options
- `verbose_name = 'Role Request'`
- `verbose_name_plural = 'Role Requests'`
- `ordering = ['-created_at']` (Newest requests first)

#### Admin Integration
The `RoleRequestAdmin` class in `admin.py` provides:
- `list_display`: Shows `user`, `status`, and `created_at`.
- `list_filter`: Allows filtering by `status`.
- **Custom Action:** `approve_requests` - An admin action that:
  1. Sets the request status to `Approved`.
  2. Sets `user.is_instructor = True`.
  3. Sets `user.is_student = False`.
  4. Saves both the request and user objects.

#### Example Workflow
```python
from apps.accounts.models import RoleRequest, User

# Student submits a request
request = RoleRequest.objects.create(user=some_student, reason="I am a TA")

# Admin approves via admin panel (or programmatically)
request.status = 'Approved'
request.save()
request.user.is_instructor = True
request.user.is_student = False
request.user.save()
```

---

## Database Schema Summary

### auth_user table (extended)
- Standard Django User fields (username, email, password, etc.)
- `is_instructor` (BOOLEAN)
- `is_student` (BOOLEAN)

### accounts_rolerequest table
- `id` (INTEGER, PRIMARY KEY)
- `user_id` (INTEGER, FOREIGN KEY -> auth_user.id)
- `status` (VARCHAR(10))
- `created_at` (DATETIME)

---

## Security Considerations
1. **Never trust client-side role checks:** Always verify `request.user.is_instructor` on the server side before allowing sensitive operations.
2. **Audit trail:** The `RoleRequest` model provides a complete history of role change requests, which is essential for accountability.
3. **Admin approval required:** Students cannot self-promote; all role changes must go through the admin approval workflow.
