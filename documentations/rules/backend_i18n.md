# Backend Internationalization (i18n) Documentation

## Purpose
This document explains the internationalization and message localization architecture implemented in the Django REST Framework backend for the UniQAKNTU platform.

## Key Components

### 1. Locale Middleware (`django.middleware.locale.LocaleMiddleware`)
- Configured in `backend/core/settings.py` between `SessionMiddleware` and `CommonMiddleware`.
- Automatically parses the incoming HTTP `Accept-Language` header (sent by the frontend Axios interceptor).
- Activates the appropriate language thread (`fa` for Persian, `en` for English) for the lifetime of the request.

### 2. Supported Languages & Locale Paths
```python
LANGUAGES = [
    ('en', 'English'),
    ('fa', 'Persian'),
]

LOCALE_PATHS = [
    BASE_DIR / 'locale',
]

TIME_ZONE = 'Asia/Tehran'
USE_TZ = True
```

### 3. Translation Catalog (`locale/fa/LC_MESSAGES/django.po` & `django.mo`)
- Contains translations for all user-facing backend messages:
  - DRF validation errors (e.g., duplicate username, password mismatch, invalid credentials).
  - Permission exception messages (e.g., only admins can delete posts).
  - Workflow status responses (e.g., ticket responses, question/answer approval).

### 4. Dynamic Message Translation
All views and serializers wrap user-facing strings with Django's translation utilities:
```python
from django.utils.translation import gettext as _
# or for serializers/models:
from django.utils.translation import gettext_lazy as _
```

## Usage
When an API request includes `Accept-Language: fa`, DRF error messages, exception details, and action responses will automatically be translated to Persian. If `Accept-Language: en` or no header is sent, it defaults to English.

## Integration
- **Frontend Interceptor**: `frontend/src/services/api.js` attaches `Accept-Language: ${lang}` on all requests.
- **Date Formatting**: `core.utils.format_localized_date()` checks `django.utils.translation.get_language()` to return Jalali for Persian and Gregorian for English.
