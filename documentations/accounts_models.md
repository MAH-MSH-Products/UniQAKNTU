# Accounts App Models Documentation

## Overview
The `accounts` app handles user authentication, authorization, and role-based access control (RBAC) for the UniQAKNTU platform. It extends Django's built-in `AbstractUser` model to provide custom functionality for instructors and students.

## Models

### User Model
**Location:** `apps/accounts/models.py`

The `User` model extends `AbstractUser` to provide RBAC fields and instructor profile information.

#### Fields

| Field Name | Type | Default | Description |
|------------|------|---------|-------------|
| `username` | CharField (inherited) | - | Unique username for authentication (from AbstractUser) |
| `email` | EmailField (inherited) | - | User's email address (from AbstractUser) |
| `first_name` | CharField (inherited) | - | User's first name (from AbstractUser) |
| `last_name` | CharField (inherited) | - | User's last name (from AbstractUser) |
| `is_instructor` | BooleanField | `False` | Indicates if the user has instructor privileges. Instructors can create and edit answers. |
| `is_student` | BooleanField | `True` | Indicates if the user has student privileges. Students have read-only access to answers. |
| `title` | CharField | `null`, blank | Academic title of the instructor (e.g., "Dr.", "Prof.", "TA"). Max length: 50 characters. |
| `bio` | TextField | `null`, blank | Academic background and experience of the instructor. Used for displaying instructor profile information. |

#### Meta Options
- `db_table`: `'auth_user'` - Uses the default Django auth_user table
- `verbose_name`: `'user'`
- `verbose_name_plural`: `'users'`

#### Methods
- `__str__()`: Returns the username as the string representation

#### Usage Notes
- The `title` and `bio` fields are specifically designed for instructor profiles and are optional (blank=True, null=True)
- When a user is approved as an instructor via the RoleRequest system, `is_instructor` is set to `True` and `is_student` is set to `False`
- The `title` field should contain academic titles like "Dr.", "Professor", "TA", etc.
- The `bio` field should contain a brief description of the instructor's academic background, research interests, and teaching experience

---

### RoleRequest Model
**Location:** `apps/accounts/models.py`

The `RoleRequest` model handles the workflow for students requesting to be upgraded to instructor status.

#### Fields

| Field Name | Type | Default | Description |
|------------|------|---------|-------------|
| `user` | ForeignKey (User) | - | Reference to the User making the request. On delete: CASCADE. |
| `status` | CharField | `'Pending'` | Current status of the request. Choices: 'Pending', 'Approved', 'Rejected'. |
| `created_at` | DateTimeField | auto_now_add | Timestamp when the request was created. Automatically set on creation. |
| `introduction` | TextField | `null`, blank | Optional text field where the user explains why they are requesting instructor status. Should include background information, qualifications, and reasons for the request. |

#### Status Choices
```python
STATUS_CHOICES = [
    ('Pending', 'Pending'),
    ('Approved', 'Approved'),
    ('Rejected', 'Rejected'),
]
```

#### Meta Options
- `verbose_name`: `'Role Request'`
- `verbose_name_plural`: `'Role Requests'`
- `ordering`: `['-created_at']` - Orders by most recent requests first

#### Methods
- `__str__()`: Returns a string in the format `"{username} - {status}"`

#### Usage Notes
- When a student wants to become an instructor, they submit a RoleRequest with an introduction explaining their qualifications
- Admins can review the `introduction` field in the Django Admin panel to make informed approval decisions
- The admin action `approve_requests` automatically sets `user.is_instructor = True` and `user.is_student = False` when approving a request
- The `introduction` field is displayed as readonly in the admin panel to prevent accidental modification
- Multiple pending requests from the same user should be prevented at the application level

#### Example Introduction Text
```
I am a teaching assistant for the Operating Systems course this semester. 
I have completed my Master's degree in Computer Science from KNTU and have 
been working as a TA for two semesters. I need instructor access to provide 
official solutions for exam questions to help students understand the correct 
approaches to solving problems.
```

## Admin Configuration

### UserAdmin
- Extends Django's built-in `UserAdmin`
- Displays `is_instructor` and `is_student` in `list_display` and `list_filter`
- Includes `title` and `bio` fields in the fieldsets under "Instructor Profile" section
- Added fieldsets for both regular user editing and user creation (`add_fieldsets`)

### RoleRequestAdmin
- Displays `user`, `status`, and `created_at` in list view
- Filters by `status` for easy pending request management
- Includes `introduction` as a readonly field for admins to review
- Provides `approve_requests` admin action that:
  1. Sets the request status to 'Approved'
  2. Sets `user.is_instructor = True`
  3. Sets `user.is_student = False`
  4. Saves the user object

## Related Documentation
- See `wiki_models.md` for how `is_instructor` is used in answer creation permissions
- See `API.md` for the `/users/request-instructor/` endpoint specification
