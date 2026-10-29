# UniQAKNTU Full-Stack Internationalization (i18n) & Localization (l10n) Rules

## 1. Executive Summary & Core Philosophy

Internationalization (i18n) and Localization (l10n) are **first-class architectural concerns** in the UniQAKNTU (AzmoonHub Nasir) codebase. The platform operates as a decoupled monorepo (React Single Page Application + Django REST Framework backend) providing bilingual support:
* **Persian (`fa`)**: Primary locale, Right-to-Left (RTL) reading direction, Jalali (Shamsi) calendar.
* **English (`en`)**: Secondary locale, Left-to-Right (LTR) reading direction, Gregorian calendar.

### 1.1 Non-Negotiable Engineering Mandates
1. **Zero Hardcoded Strings**: Every user-facing UI label, button, placeholder, title, tooltip, and backend validation/error message must be retrieved through the localization framework.
2. **English Technical Terms Exception**: Academic and computing terminology (e.g., *Markdown*, *MathJax*, *Context*, *Token*, *API*, *JWT*, *Routing*, *Cache*) MUST remain strictly in English, even in Persian sentences, to preserve semantic precision.
3. **1:1 Dictionary Parity**: Every key introduced in `src/locales/en/translation.json` must have an exact corresponding entry in `src/locales/fa/translation.json` and vice versa.
4. **End-to-End Language Synchronization**: The language selected on the client must automatically propagate to the backend via HTTP headers, adjusting date formats, error messages, and serializer representations.

---

## 2. End-to-End Language Synchronization Architecture

```
┌────────────────────────────────────────────────────────┐
│                   React Frontend                       │
│  - User selects language in Navbar (EN / FA)           │
│  - i18n.changeLanguage(lng)                            │
│  - localStorage['i18nextLng'] updated                  │
│  - App.jsx updates <html dir="rtl|ltr" lang="fa|en">  │
└───────────────────────────┬────────────────────────────┘
                            │
                            ▼ Axios Request Interceptor (src/services/api.js)
             Header: Accept-Language: fa | en
                            │
┌───────────────────────────▼────────────────────────────┐
│                  Django REST Backend                   │
│  - django.middleware.locale.LocaleMiddleware           │
│  - Extracts Accept-Language header                     │
│  - Activates thread-local language (fa / en)           │
│  - Formats dates: Jalali for fa, Gregorian for en      │
│  - Translates validation/permission messages (_(..))   │
└───────────────────────────┬────────────────────────────┘
                            │
                            ▼ JSON API Response (Localized strings / errors)
┌───────────────────────────▼────────────────────────────┐
│          src/utils/errorHandler.js & UI Components      │
│  - Resolves localized backend error payload            │
│  - Renders UI in active direction and font             │
└────────────────────────────────────────────────────────┘
```

---

## 3. Frontend Localization Rules (`react-i18next`)

### 3.1 Directory & File Structure
```
frontend/src/
├── i18n.js                           # Core i18next configuration & initialization
├── locales/
│   ├── en/
│   │   └── translation.json          # English translation dictionary
│   └── fa/
│       └── translation.json          # Persian translation dictionary
└── utils/
    └── errorHandler.js               # Localized error parsing helper
```

### 3.2 Namespace & Key Naming Conventions
Translation keys must follow structured hierarchical dot-notation based on domain responsibility:

```json
{
  "app": { "title": "AzmoonHub Nasir" },
  "nav": { "login": "Login", "logout": "Logout", "toggle_theme": "Toggle Dark/Light Mode" },
  "sidebar": { "all_courses": "All Courses", "marketplace": "Store / Marketplace" },
  "home": { "hero_title": "...", "features_title": "..." },
  "login": { "username": "Username or Email", "password": "Password" },
  "register": { "title": "Register for AzmoonHub Nasir" },
  "common": { "loading": "Loading...", "submit": "Submit", "cancel": "Cancel" },
  "wiki": { "upvote": "Upvote", "suggest_edit": "Suggest Edit" },
  "marketplace": { "purchase": "Purchase Package", "tokens": "Tokens" },
  "custom_exams": { "create_exam": "Build Custom Exam" },
  "support": { "ticket_subject": "Subject", "submit_ticket": "Submit Ticket" },
  "errors": { "network": "Unable to connect to server.", "unauthorized": "Session expired." },
  "enums": { "approved": "Approved", "pending": "Pending Review", "rejected": "Rejected" }
}
```

### 3.3 Component Usage Standards
1. **Hook Pattern**: Always import and invoke `useTranslation`:
   ```javascript
   import { useTranslation } from 'react-i18next';

   const ExamCard = ({ exam }) => {
     const { t } = useTranslation();
     return (
       <div className="card">
         <h5>{exam.title}</h5>
         <button className="btn btn-primary">{t('common.submit', 'Submit')}</button>
       </div>
     );
   };
   ```
2. **Mandatory Default Value**: Always provide a second parameter to `t()` as an English fallback to guarantee resilience against missing keys during development.

### 3.4 Parameterization & Interpolation (NO String Concatenation)
* ❌ **WRONG (Grammar/Direction Bug)**:
  ```javascript
  <span>{t('wiki.posted_by') + " " + author.name + " " + t('wiki.ago')}</span>
  ```
* ✅ **CORRECT (Dynamic Interpolation)**:
  ```javascript
  <span>{t('wiki.posted_by_author', { author: author.name })}</span>
  ```
  *In `en/translation.json`*: `"posted_by_author": "Posted by {{author}}"`  
  *In `fa/translation.json`*: `"posted_by_author": "ارسال شده توسط {{author}}"`

### 3.5 Bi-directional Layout Synchronization (`src/App.jsx`)
The root application component must reactively synchronize HTML attributes upon language change:
```javascript
useEffect(() => {
  const handleLanguageChange = (lng) => {
    document.documentElement.dir = lng === 'fa' ? 'rtl' : 'ltr';
    document.documentElement.lang = lng;
  };

  handleLanguageChange(i18n.language);
  i18n.on('languageChanged', handleLanguageChange);
  return () => i18n.off('languageChanged', handleLanguageChange);
}, []);
```

---

## 4. Backend Localization Rules (Django & DRF)

### 4.1 Django Configuration (`backend/core/settings.py`)
```python
MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.locale.LocaleMiddleware',  # Must be between Session and Common
    'django.middleware.common.CommonMiddleware',
    # ...
]

LANGUAGE_CODE = 'en-us'
LANGUAGES = [
    ('en', 'English'),
    ('fa', 'Persian'),
]
LOCALE_PATHS = [
    BASE_DIR / 'locale',
]
USE_I18N = True
TIME_ZONE = 'Asia/Tehran'
USE_TZ = True
```

### 4.2 Translation Functions Usage Guidelines
* **Views, ViewSets, API Functions**: Use standard `gettext`:
  ```python
  from django.utils.translation import gettext as _

  def custom_action(self, request):
      return Response({'message': _('Action successfully performed.')})
  ```
* **Models, Serializers, Form Fields, Class Attributes**: Use `gettext_lazy` to avoid early evaluation before request middleware executes:
  ```python
  from django.utils.translation import gettext_lazy as _

  class QuestionSerializer(serializers.ModelSerializer):
      class Meta:
          model = Question
          fields = '__all__'
          extra_kwargs = {
              'title': {
                  'error_messages': {
                      'blank': _('Title cannot be empty.')
                  }
              }
          }
  ```

### 4.3 Localized Date & Calendar Handling (`backend/core/utils.py`)
All date/datetime outputs must adapt to the request's active locale:
```python
from core.utils import format_localized_date

# If Accept-Language is 'fa', outputs Jalali: '1403/06/15'
# If Accept-Language is 'en', outputs Gregorian: '2024/09/05'
serialized_date = format_localized_date(answer.created_at)
```
When serializers receive Jalali date inputs from frontend Persian users, use `JalaliDateField` and `JalaliDateTimeField` to convert inputs to aware UTC Gregorian datetimes for database storage.

### 4.4 Translation Catalog Maintenance
* Translation messages are cataloged in `backend/locale/fa/LC_MESSAGES/django.po`.
* Whenever new strings are added:
  ```bash
  # 1. Extract strings
  python manage.py makemessages -l fa
  # 2. Add Persian translations to django.po
  # 3. Compile binary catalog
  python manage.py compilemessages
  ```

---

## 5. Unified Error Handling Pipeline (`frontend/src/utils/errorHandler.js`)

Frontend error handling must funnel through `getErrorMessage(error, fallbackKey)`. This utility intelligently:
1. Returns backend translated `detail` or `error` strings (sent directly from DRF).
2. Parses DRF `non_field_errors` arrays.
3. Formats field-level validation errors (e.g., `username: Already exists`).
4. Falls back to localized HTTP status code strings:
   - `401`: `errors.unauthorized` ("Session expired. Please log in again.")
   - `402`: `errors.insufficient_tokens` ("Insufficient tokens to complete this action.")
   - `403`: `errors.forbidden` ("You do not have permission to perform this action.")
   - `404`: `errors.notFound` ("Requested item was not found.")
   - `>= 500`: `errors.serverError` ("Server error. Please try again later.")
   - Network failure: `errors.network` ("Unable to connect to the server.")

---

## 6. Software Engineering Best Practices vs Anti-Patterns

| Anti-Pattern (❌ Forbidden) | Best Practice (✅ Mandatory) | Architectural Rationale |
| :--- | :--- | :--- |
| Hardcoding text in JSX: `<button>Submit</button>` | `<button>{t('common.submit', 'Submit')}</button>` | Enables dynamic translation and language-agnostic components. |
| Hardcoding directional CSS: `margin-left: 10px;` | `margin-inline-start: 10px;` or `ms-2` | Automatically mirrors in RTL mode without CSS bloat. |
| Concatenating translated fragments: `t('edit') + " " + t('question')` | `t('wiki.edit_question')` | Persian grammar order differs from English; whole phrases preserve correct syntax. |
| Translating technical terms to obscure equivalents: "Markdown" $\to$ "نشانه‌گذاری" | Keep English: "Markdown" | Ensures academic clarity for Iranian computer engineering students and instructors. |
| Using `gettext` in Django model field definitions | Use `gettext_lazy` | Prevents evaluation at server startup when no request context exists. |
| Hardcoding Gregorian date formats in Persian UI | Use `format_localized_date()` | Iranian academic institutions operate on the Jalali calendar system. |

---

## 7. Pre-Commit & PR Verification Checklist

Before opening a pull request touching UI or API endpoints:
- [ ] Every user-visible string in new/modified JSX components uses `{t('key')}`.
- [ ] New keys have been added to **both** `src/locales/en/translation.json` and `src/locales/fa/translation.json`.
- [ ] No hardcoded directional CSS properties (`margin-left`, `padding-right`, etc.) were introduced.
- [ ] Verified UI appearance in Persian (RTL) mode and English (LTR) mode.
- [ ] Backend messages use `_()` or `gettext_lazy()`.
- [ ] Backend date formatting utilizes `core.utils.format_localized_date()`.
- [ ] Run `python manage.py compilemessages` if `django.po` was updated.
