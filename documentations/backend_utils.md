# Backend Core Utilities (utils.py) Documentation

## Purpose
`backend/core/utils.py` provides shared date and datetime serialization and formatting utilities supporting both Jalali (Shamsi) and Gregorian calendars based on the active language.

## Key Components

### 1. `format_localized_date(dt, lang=None)`
- Formats a Python `datetime.date` or `datetime.datetime` object into a localized string.
- If the active language starts with `'fa'`, formats using `jdatetime` into `'YYYY/MM/DD'`.
- Otherwise (e.g. `'en'`), formats into standard Gregorian `'YYYY/MM/DD'`.

### 2. `JalaliDateField` & `JalaliDateTimeField`
- DRF serializer fields converting incoming Jalali strings to Python date/datetime objects and serializing them back.

## Usage
```python
from core.utils import format_localized_date

formatted_date = format_localized_date(answer.created_at)
```

## Integration
Used across widget serializers (`WidgetAnswerSerializer`, `WidgetCourseSerializer`) and other serializers requiring language-sensitive date rendering.
